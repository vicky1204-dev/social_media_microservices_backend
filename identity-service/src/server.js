import dotenv from "dotenv";
import { connectDB } from "./db/mongoDB/index.js";
import { redisClient } from "./db/redis/client.js";
import { logger } from "./utils/logger.util.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis"; // this is a redis store for express rate limit package
import userRouter from "./routes/identity.route.js";
import { errorHandler } from "./middlewares/globalErrorHandler.middleware.js";

dotenv.config({
  path: "./.env",
});

const app = express();
const PORT = process.env.PORT || 3001;

//----------------database connection---------------
connectDB().then(() => {
  logger.info("Connected To MongoDB");
});

//----------middlewares--------------------
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins =
        process.env.CORS_ORIGIN?.split(",");
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Version"],
    credentials: true, //enable cookie support
    preflightContinue: false,
    optionsSuccessStatus: 204, //a status code for successful OPTIONS requests
    maxAge: 600, //cache preflight responses for 10 mins
  })
);
app.use(express.json());
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  next();
});

//----------------DDOS protection and rate limiting------------------
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  //basically using redis for rate limiting storage, as it Atomically increments a counter and applies TTL duration of seconds
  keyPrefix: "middleware", // to distinguish rate limiting data from other data in redis
  points: 10, // max req a user or ip address can make in a given time period
  duration: 1, // so 10 req in 1 seconds
});
/* Why Redis is used here

Redis provides:
	•	Atomic operations (no race conditions)
	•	Shared state across servers
	•	Fast in-memory performance
	•	Automatic expiration

Without Redis:
	•	Each server would rate limit independently
	•	Attackers could bypass limits via load balancers */

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

// ----------------IP based rate limiting for sensitive endpoints--------------
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // time window for rate limiting
  max: 50,
  standardHeaders: true, // tells whether to include the rate limiting info in the response headers
  legacyHeaders: false, // whether to include legacy headers
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// -------------implementing sensitiveEndpointsLimiter -----------------------
app.use("/api/auth/register", sensitiveEndpointsLimiter);
app.use("/api/auth/login", sensitiveEndpointsLimiter);

//------routes------
app.use("/api/auth", userRouter);

//----error handler------
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity Service running on PORT: ${PORT}`);
});

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Promise Rejection, Reason: ${reason.message}`);
});
