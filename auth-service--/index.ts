import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.get("/", (req: Request, res: Response) => {
  res.send("PDFaddy AUTH-SERVICE");
});

app.listen(PORT, () => {
  console.log(`API-GATEWAY STARTED ON PORT : ${PORT}`);
});
