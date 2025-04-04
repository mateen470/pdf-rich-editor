import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

import authRoute from "./src/proxy-routes/auth-proxy-routes";
app.use("/auth", authRoute);

app.get("/", (req: Request, res: Response) => {
  res.send("PDFaddy API-GATEWAY");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API-GATEWAY STARTED ON PORT : ${PORT}`);
});
