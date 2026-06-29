import amqp, {
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
} from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbit(rabbitUrl: string): Promise<Channel> {
  if (channel) return channel;

  connection = await amqp.connect(rabbitUrl);

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error);
    connection = null;
    channel = null;
  });

  connection.on("close", () => {
    console.warn("RabbitMQ connection closed");
    connection = null;
    channel = null;
  });

  channel = await connection.createChannel();
  await channel.prefetch(5);

  return channel;
}

export async function sendToQueue<T>(
  rabbitUrl: string,
  queue: string,
  message: T,
): Promise<void> {
  const ch = await connectRabbit(rabbitUrl);

  await ch.assertQueue(queue, { durable: true });

  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
    contentType: "application/json",
  });
}

export async function consumeQueue<T>(
  rabbitUrl: string,
  queue: string,
  handler: (message: T) => Promise<void>,
): Promise<void> {
  const ch = await connectRabbit(rabbitUrl);

  await ch.assertQueue(queue, { durable: true });

  console.log(`Waiting for messages in "${queue}"...`);

  await ch.consume(
    queue,
    async (message: ConsumeMessage | null) => {
      if (!message) return;

      try {
        const parsed = JSON.parse(message.content.toString()) as T;

        await handler(parsed);

        ch.ack(message);
      } catch (error) {
        console.error(`Failed to process message from "${queue}":`, error);

        ch.nack(message, false, false);
      }
    },
    { noAck: false },
  );
}

export async function closeRabbit(): Promise<void> {
  await channel?.close();
  await connection?.close();

  channel = null;
  connection = null;
}
