import amqp from "amqplib";
import { logger } from "./logger.util.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "post_events";

export async function connectRabbitMq() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("RabbitMQ connected and exchange asserted");
    return channel;
  } catch (error) {
    logger.error("Rabbitmq connection error", error);
  }
}

export async function publishEvent(routingKey, message) {
    try {
      if(!channel){
          await connectRabbitMq()
      }
  
      channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
      logger.info(`Event Published: ${routingKey}`)
    } catch (error) {
      logger.error(`Error occurred while publishing event: ${error}`)
    }
}