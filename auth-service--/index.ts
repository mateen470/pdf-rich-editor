import dotenv from "dotenv";
dotenv.config();

import express from "express";
import authRouter from "./src/routes/routes";

import "./src/db/connection";

const app = express();
app.use(express.json());

app.use("/", authRouter);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`AUTH-SERVICE STARTED ON PORT : ${PORT}`);
});
