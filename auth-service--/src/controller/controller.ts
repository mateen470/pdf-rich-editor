import { Request, Response } from "express";

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
