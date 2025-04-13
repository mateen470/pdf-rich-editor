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
    console.log(req.body);
  } catch (error) {
    console.error("Login error:", error);
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
    }

    const { name, email, password } = registerData.data;

    res.status(200).json({
      message: "Please check your email",
    });
  } catch (error) {
    console.error("error");
    res.status(500).json({
      message: "Something went wrong!",
    });
  }
};
export const handleForgetPasswordRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(req.body);
  } catch (error) {
    console.error("error");
  }
};
