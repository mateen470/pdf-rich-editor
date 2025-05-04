import express from "express";
import {
  handleLoginRequest,
  handleRegisterRequest,
  handleForgetPasswordRequest,
  handleResetPasswordRequest,
} from "../controller/controller";

const router = express.Router();

router.post("/login", handleLoginRequest);
router.post("/register", handleRegisterRequest);
router.post("/forget-password", handleForgetPasswordRequest);
router.post("/reset-password", handleResetPasswordRequest);

export default router;
