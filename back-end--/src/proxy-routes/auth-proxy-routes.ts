import express, { Request } from "express";
import proxy from "express-http-proxy";

const router = express.Router();

//PROXIES ARE BEING USED TO REDIRECT THE REQUEST MADE TO API-GATEWAY TOWARDS THE
//SSO-AUTH SERVICE
router.use(
  "/login",
  proxy(`${process.env.SSO_AUTH_SERVICE_URL}`, {
    proxyReqPathResolver: (req: Request) => {
      return "/login";
    },
  })
);
router.use(
  "/register",
  proxy(`${process.env.SSO_AUTH_SERVICE_URL}`, {
    proxyReqPathResolver: (req: Request) => {
      return "/register";
    },
  })
);
router.use(
  "/forget-password",
  proxy(`${process.env.SSO_AUTH_SERVICE_URL}`, {
    proxyReqPathResolver: (req: Request) => {
      return "/forget-password";
    },
  })
);
router.use(
  "/reset-password",
  proxy(`${process.env.SSO_AUTH_SERVICE_URL}`, {
    proxyReqPathResolver: (req: Request) => {
      return "/reset-password";
    },
  })
);

export default router;
