//THIS MIDDLEWARE CHECKS FOR THE TOKEN IN THE REQUEST'S HEADER
//AND VERIFIES THE TOKEN
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  email: string;
  name: string;
}

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as CustomJwtPayload;

    req.body = {
      ...req.body,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error: any) {
    res.status(400).send(error.message || error);
  }
}
