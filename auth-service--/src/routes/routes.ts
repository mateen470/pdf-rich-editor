import express from "express";
import { handleLoginRequest } from "../controller/controller";

const router = express.Router();

router.post("/login", handleLoginRequest);

export default router;
