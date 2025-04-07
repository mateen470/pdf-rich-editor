import express from "express";
import {
  handleLoginRequest,
  handleRegisterRequest,
} from "../controller/controller";

const router = express.Router();

router.post("/login", handleLoginRequest);
router.post("/register", handleRegisterRequest);

export default router;
