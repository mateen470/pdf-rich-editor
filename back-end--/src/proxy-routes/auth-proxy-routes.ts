import express, { Request } from "express";

// module.exports = router;
const proxy = require("express-http-proxy");

const router = express.Router();

//PROXIES ARE BEING USED TO REDIRECT THE REQUEST MADE TO API-GATEWAY TOWARDS THE
//SSO-AUTH SERVICE
router.use(fafansafaff
//   "/login",
//   proxy(`${process.env.SSO_AUTH_SERVICE_URL}`, {
//     proxyReqPathResolver: (req: Request) => {
//       return "/login";
//     },
//   })
// );

module.exports = router;
