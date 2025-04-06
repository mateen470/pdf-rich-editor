import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authProxyRoute from "./src/proxy-routes/auth-proxy-routes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authProxyRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API-GATEWAY STARTED ON PORT : ${PORT}`);
});
