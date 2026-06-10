import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { logger } from "./utils/logger.util.js";
import { errorHandler } from "./middlewares/globalErrorHandler.middleware.js";
import { connectDB } from "./db/index.js";
import {mediaRouter} from "./routes/media.routes.js"
import { connectRabbitmq, consumeEvent } from "./utils/rabbitmq.util.js";
import { handlePostDeleted } from "./eventHandlers/media-event-handlers.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3003;
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
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  next();
});

app.use("/api/media", mediaRouter)

app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitmq()

    //consume all events
    await consumeEvent('post.deleted', handlePostDeleted)

    app.listen(PORT, () => {
      logger.info(`Media Service running on PORT: ${PORT}`);
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
