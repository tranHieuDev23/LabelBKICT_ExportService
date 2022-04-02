import { Container } from "brandi";
import { KAFKA_CONSUMER_TOKEN, getKafkaConsumer } from "./consumer/consumer";
import { getKafkaInstance, KAFKA_INSTANCE_TOKEN } from "./kafka";
import { KAFKA_PRODUCER_TOKEN, getKafkaProducer } from "./producer/producer";

export * from "./models";

export function bindToContainer(container: Container): void {
    container
        .bind(KAFKA_INSTANCE_TOKEN)
        .toInstance(getKafkaInstance)
        .inSingletonScope();
    container
        .bind(KAFKA_PRODUCER_TOKEN)
        .toInstance(getKafkaProducer)
        .inSingletonScope();
    container
        .bind(KAFKA_CONSUMER_TOKEN)
        .toInstance(getKafkaConsumer)
        .inSingletonScope();
}
