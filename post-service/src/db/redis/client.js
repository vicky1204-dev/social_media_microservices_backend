import Redis from "ioredis"
import { logger } from "../../utils/logger.util.js"

export const redisClient = new Redis(process.env.REDIS_URL, {
    connectTimeout: 10_000,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times){
        if(times>5) return null
        return Math.min(times * 100, 1000)
    },
    enableOfflineQueue: true
})

redisClient.on("connect", ()=>{
    logger.info("Redis socket connected ")
})
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