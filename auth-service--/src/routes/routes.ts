import express from "express";
import {
  handleLoginRequest,
  handleRegisterRequest,
  handleForgetPasswordRequest,
} from "../controller/controller";

const router = express.Router();

router.post("/login", handleLoginRequest);
router.post("/register", handleRegisterRequest);
router.post("/forget-password", handleForgetPasswordRequest);

export default router;
