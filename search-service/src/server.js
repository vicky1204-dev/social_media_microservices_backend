import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import express from "express";
import { logger } from "./utils/logger.util.js";
import { errorHandler } from "./middlewares/globalErrorHandler.middleware.js";
import { connectRabbitMq, consumeEvent } from "./utils/rabbitmq.util.js";
import { connectDB } from "./db/mongoDB/index.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3004;
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
    methods: ["GET"],
  }),
);
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  next();
});

import { router as searchRouter } from "./routes/search.route.js";
import { handlePostCreated, handlePostDeleted } from "./eventHandlers/searchEventHandlers.js";

app.use("/api/search", searchRouter)

app.use(errorHandler)

async function startServer() {
  try {
    await connectRabbitMq()
    await consumeEvent("post.created", handlePostCreated)
    await consumeEvent("post.deleted", handlePostDeleted)
    app.listen(PORT, () => {
      logger.info(`Search Service running on PORT: ${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to connect to server", error)
    process.exit(1)
  }
}

startServer()

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Promise Rejection, Reason: ${reason.message}`);
});