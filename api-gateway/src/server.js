import express from "express";
import dotenv from "dotenv";
import { logger } from "./utils/logger.util.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import helmet from "helmet";
import cors from "cors";
import { redisClient } from "./db/redis/client.js";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import proxy from "express-http-proxy";
import { validateToken } from "./middleware/auth.middleware.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3000;
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(",");
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        cb(null, true);
      } else {
        logger.warn("Blocked by CORS");
        cb(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Version"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ limit: "16kb", extended: true }));

//-----rate limiting----------
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(rateLimiter);

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  },
};

// setting up proxy for identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // used to ovverride the request options, headers before the proxy request
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from identity service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

//setting up proxy for post service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json"
      proxyReqOpts.headers["x-user-id"] = srcReq.user.id
      return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from Post service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use("/v1/media", validateToken, proxy(
  process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["x-user-id"] = srcReq.user.id
      if(!srcReq.headers["content-type"].startsWith("multipart/form-data")){
        proxyReqOpts.headers["Content-Type"] = "application/json"
      }
      return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from Media service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
    parseReqBody: false // ensures entire request body is proxied for the file uploads as well
  })
)

//setting up proxy for SEARCH service
app.use(
  "/v1/search",
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json"
      proxyReqOpts.headers["x-user-id"] = srcReq.user.id
      return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from Search service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway running on PORT: ${PORT}`);
  logger.info(`Redis running on: ${process.env.REDIS_URL}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Promise Rejection, Reason: ${reason.message}`);
});
