import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../db/sql_pool";
import { registerSchema, loginSchema, forgetPasswordSchema, resetPasswordSchema } from "../utilities/authSchemas";

export const handleLoginRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const loginData = loginSchema.safeParse(req.body);

    if (!loginData.success) {
      res.status(400).json({ message: loginData.error.errors[0].message });
      return;
    }

    const { email, password } = loginData.data;

    // Check if user exists
    const userQuery = `SELECT id, name, email, password FROM users WHERE email = $1`;
    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];

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
    const existingUserQuery = `SELECT id FROM users WHERE email = $1`;
    const existingResult = await pool.query(existingUserQuery, [email]);

    if (existingResult.rows.length > 0) {
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
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email
    `;
    
    const newUserResult = await pool.query(insertUserQuery, [
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
    const forgetPasswordData = forgetPasswordSchema.safeParse(req.body);

    if (!forgetPasswordData.success) {
      res.status(400).json({ message: forgetPasswordData.error.errors[0].message });
      return;
    }

    const { email } = forgetPasswordData.data;

    // Check if user exists
    const userQuery = `SELECT id, email FROM users WHERE email = $1`;
    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
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
      SET password_reset_token = $1, password_reset_expires = $2 
      WHERE email = $3
    `;
    
    await pool.query(updateResetTokenQuery, [
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
    const resetPasswordData = resetPasswordSchema.safeParse(req.body);

    if (!resetPasswordData.success) {
      res.status(400).json({ message: resetPasswordData.error.errors[0].message });
      return;
    }

    const { token, newPassword } = resetPasswordData.data;

    // Find user with valid reset token
    const userQuery = `
      SELECT id, email FROM users 
      WHERE password_reset_token = $1 AND password_reset_expires > NOW()
    `;
    const result = await pool.query(userQuery, [token]);

    if (result.rows.length === 0) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const user = result.rows[0];

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const updatePasswordQuery = `
      UPDATE users 
      SET password = $1, password_reset_token = NULL, password_reset_expires = NULL 
      WHERE id = $2
    `;
    
    await pool.query(updatePasswordQuery, [hashedPassword, user.id]);

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};