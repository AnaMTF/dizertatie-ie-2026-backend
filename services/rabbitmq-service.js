import amqp from "amqplib";

const RABBITMQ_URL =
    process.env.RABBITMQ_URL || "amqp://app:app@localhost:5672";
const RABBITMQ_JOB_QUEUE = process.env.RABBITMQ_JOB_QUEUE || "scan.jobs.v1";
const RABBITMQ_RESULT_QUEUE =
    process.env.RABBITMQ_RESULT_QUEUE || "scan.results.v1";
const RABBITMQ_DLX = process.env.RABBITMQ_DLX || "scan.dlx";
const RABBITMQ_JOB_DLQ = process.env.RABBITMQ_JOB_DLQ || "scan.jobs.v1.dlq";
const RABBITMQ_RESULT_DLQ =
    process.env.RABBITMQ_RESULT_DLQ || "scan.results.v1.dlq";
const RABBITMQ_RESULT_PREFETCH = Number(
    process.env.RABBITMQ_RESULT_PREFETCH || 10,
);

let connection;
let publisherChannel;
let resultConsumerChannel;

function createDeadLetterArguments(deadLetterRoutingKey) {
    return {
        "x-dead-letter-exchange": RABBITMQ_DLX,
        "x-dead-letter-routing-key": deadLetterRoutingKey,
    };
}

async function connect() {
    if (connection) {
        return connection;
    }

    connection = await amqp.connect(RABBITMQ_URL);

    connection.on("error", (error) => {
        console.error("RabbitMQ connection error", error);
    });

    connection.on("close", () => {
        connection = undefined;
        publisherChannel = undefined;
        resultConsumerChannel = undefined;
        console.warn("RabbitMQ connection closed");
    });

    return connection;
}

async function setupInfrastructure(channel) {
    await channel.assertExchange(RABBITMQ_DLX, "direct", { durable: true });

    await channel.assertQueue(RABBITMQ_JOB_DLQ, { durable: true });
    await channel.bindQueue(RABBITMQ_JOB_DLQ, RABBITMQ_DLX, RABBITMQ_JOB_DLQ);

    await channel.assertQueue(RABBITMQ_RESULT_DLQ, { durable: true });
    await channel.bindQueue(
        RABBITMQ_RESULT_DLQ,
        RABBITMQ_DLX,
        RABBITMQ_RESULT_DLQ,
    );

    await channel.assertQueue(RABBITMQ_JOB_QUEUE, {
        durable: true,
        arguments: createDeadLetterArguments(RABBITMQ_JOB_DLQ),
    });

    await channel.assertQueue(RABBITMQ_RESULT_QUEUE, {
        durable: true,
        arguments: createDeadLetterArguments(RABBITMQ_RESULT_DLQ),
    });
}

async function getPublisherChannel() {
    if (publisherChannel) {
        return publisherChannel;
    }

    const mqConnection = await connect();
    publisherChannel = await mqConnection.createChannel();

    publisherChannel.on("error", (error) => {
        console.error("RabbitMQ publisher channel error", error);
    });

    publisherChannel.on("close", () => {
        publisherChannel = undefined;
    });

    await setupInfrastructure(publisherChannel);

    return publisherChannel;
}

async function getResultConsumerChannel() {
    if (resultConsumerChannel) {
        return resultConsumerChannel;
    }

    const mqConnection = await connect();
    resultConsumerChannel = await mqConnection.createChannel();

    resultConsumerChannel.on("error", (error) => {
        console.error("RabbitMQ result-consumer channel error", error);
    });

    resultConsumerChannel.on("close", () => {
        resultConsumerChannel = undefined;
    });

    await setupInfrastructure(resultConsumerChannel);

    if (
        Number.isFinite(RABBITMQ_RESULT_PREFETCH) &&
        RABBITMQ_RESULT_PREFETCH > 0
    ) {
        await resultConsumerChannel.prefetch(RABBITMQ_RESULT_PREFETCH);
    }

    return resultConsumerChannel;
}

export async function publishScanJob(payload) {
    const channel = await getPublisherChannel();

    const sent = channel.sendToQueue(
        RABBITMQ_JOB_QUEUE,
        Buffer.from(JSON.stringify(payload)),
        {
            contentType: "application/json",
            deliveryMode: 2,
            type: "scan.job.v1",
            messageId: payload.jobId,
            timestamp: Date.now(),
        },
    );

    if (!sent) {
        throw new Error("RabbitMQ publish buffer is full");
    }
}

export async function consumeScanResults(handler) {
    const channel = await getResultConsumerChannel();

    await channel.consume(
        RABBITMQ_RESULT_QUEUE,
        async (message) => {
            if (!message) {
                return;
            }

            try {
                const payload = JSON.parse(message.content.toString("utf8"));
                await handler(payload);
                channel.ack(message);
            } catch (error) {
                const requeue = Boolean(error?.retryable);
                channel.nack(message, false, requeue);
            }
        },
        { noAck: false },
    );
}

export async function closeRabbitMq() {
    await Promise.allSettled([
        publisherChannel?.close?.(),
        resultConsumerChannel?.close?.(),
    ]);

    publisherChannel = undefined;
    resultConsumerChannel = undefined;

    if (connection) {
        await connection.close();
        connection = undefined;
    }
}
