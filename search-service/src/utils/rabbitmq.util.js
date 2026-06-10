import amqp from "amqplib";
import { logger } from "./logger.util.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "post_events";

export const connectRabbitmq = async () => {
  try {
    connection = await amqp.connect(process.env.EXCHANGE_NAME);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("RabbitMQ connected and exchange asserted");
    return channel;
  } catch (error) {
    logger.error(`Rabbitmq connection error: ${error.message}`);
  }
};

export const consumeEvent = async(routingKey, callback)=>{
    if (!channel) {
      await connectRabbitmq();
    }

    const q = await channel.assertQueue("", {exclusive: true});
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey)
    await channel.consume(q.queue, (msg)=> {
        if(msg !== null){
            const content = JSON.parse(msg.content.toString())
            callback(content)
            channel.ack(msg) //acknowledge the message
        }
    })

    logger.info(`Subscribed to event: ${routingKey}`)
}
