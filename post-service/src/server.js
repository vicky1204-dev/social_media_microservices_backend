import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import express from "express";
import { redisClient } from "./db/redis/client.js";
import { router } from "./routes/post.route.js";
import { logger } from "./utils/logger.util.js";
import { errorHandler } from "./middlewares/globalErrorHandler.middleware.js";
import { connectDB } from "./db/mongoDB/index.js";
import { RedisStore } from "rate-limit-redis";
import { rateLimit } from "express-rate-limit";
import { connectRabbitMq } from "./utils/rabbitmq.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3002;
const app = express();

connectDB().then(() => {
  logger.info("Database connected successfully!");
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || "*";
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        cb(null, true);
      } else {
        logger.warn("Blocked by CORS");
        cb(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  next();
});

// rate limiting based on ip

const createPostEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/posts/create-post", createPostEndpointLimiter);
app.use("/api/posts", router);
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMq()
    app.listen(PORT, () => {
      logger.info(`Post Service running on PORT: ${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to connect to server", error)
    process.exit(1)
  }
}

startServer()

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Promise Rejection, Reason: ${reason.message}`);
});
