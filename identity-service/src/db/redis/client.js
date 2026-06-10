import Redis from "ioredis"
import { logger } from "../../utils/logger.util.js";

export const redisClient = new Redis(process.env.REDIS_URL, {
        connectTimeout: 10_000,          // fail fast if Redis is unreachable, _ is called numeric separator 10_000 === 10000; its just for redability
  enableReadyCheck: true,          // wait until Redis is actually ready

  // ---- Retry behavior ----
  maxRetriesPerRequest: 3,         // default is 20 (too high for auth); this is command level retry for every redis command such as get set and not redis connection retry!!!!!
  
  retryStrategy(times) {
    if (times > 5) return null;    // stop reconnecting after 5 attempts
    return Math.min(times * 100, 2000); //this is returning the delay in milliseconds before next retry
  },

  // ---- Offline queue ----
  enableOfflineQueue: false,       // fail immediately if Redis is down, if true queues the commands when redis is down, keep false for auth services
})

redisClient.on("connect", () => {
  logger.info("Redis socket connected");
});

redisClient.on("ready", () => {
  logger.info("Redis ready to accept commands");
});

redisClient.on("error", (err) => {
  logger.error("Redis error", {
    message: err.message,
    stack: err.stack,
  });
});

redisClient.on("close", () => {
  logger.warn("Redis connection closed");
});

redisClient.on("reconnecting", (time) => {
  logger.warn("Redis reconnecting", { delay: time });
});