import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../db/sql_pool";
import { registerSchema } from "../utilities/regitserSchema";

export const handleLoginRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if user exists
    const userQuery = `SELECT id, name, email, password FROM users WHERE email = ?`;
    const [rows] = await pool.execute(userQuery, [email]);
    const users = rows as any[];

    if (users.length === 0) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const handleRegisterRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const registerData = registerSchema.safeParse(req.body);

    if (!registerData.success) {
      res.status(400).json({ message: registerData.error.errors[0].message });
      return;
    }

    const { name, email, password } = registerData.data;

    // Check if user already exists
    const existingUserQuery = `SELECT id FROM users WHERE email = ?`;
    const [existingRows] = await pool.execute(existingUserQuery, [email]);
    const existingUsers = existingRows as any[];

    if (existingUsers.length > 0) {
      res.status(409).json({ message: "User already exists with this email" });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (name, email, password, email_verification_token, email_verification_expires, is_email_verified) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await pool.execute(insertUserQuery, [
      name,
      email,
      hashedPassword,
      emailVerificationToken,
      emailVerificationExpires,
      false
    ]);

    // TODO: Send verification email with emailVerificationToken
    // You'll need to implement email sending service here

    res.status(201).json({
      message: "Please check your email to verify your account",
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const handleForgetPasswordRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Check if user exists
    const userQuery = `SELECT id, email FROM users WHERE email = ?`;
    const [rows] = await pool.execute(userQuery, [email]);
    const users = rows as any[];

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      res.status(200).json({ 
        message: "If an account with this email exists, you will receive a password reset link" 
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    const updateResetTokenQuery = `
      UPDATE users 
      SET password_reset_token = ?, password_reset_expires = ? 
      WHERE email = ?
    `;
    
    await pool.execute(updateResetTokenQuery, [
      resetToken,
      resetTokenExpires,
      email
    ]);

    // TODO: Send password reset email with resetToken
    // You'll need to implement email sending service here

    res.status(200).json({ 
      message: "If an account with this email exists, you will receive a password reset link" 
    });

  } catch (error) {
    console.error("Forget password error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const handleResetPasswordRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: "Token and new password are required" });
      return;
    }

    // Find user with valid reset token
    const userQuery = `
      SELECT id, email FROM users 
      WHERE password_reset_token = ? AND password_reset_expires > NOW()
    `;
    const [rows] = await pool.execute(userQuery, [token]);
    const users = rows as any[];

    if (users.length === 0) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const user = users[0];

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const updatePasswordQuery = `
      UPDATE users 
      SET password = ?, password_reset_token = NULL, password_reset_expires = NULL 
      WHERE id = ?
    `;
    
    await pool.execute(updatePasswordQuery, [hashedPassword, user.id]);

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};