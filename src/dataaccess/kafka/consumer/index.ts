import { Container } from "brandi";
import { KAFKA_CONSUMER_TOKEN, getKafkaConsumer } from "./consumer";
import { MessageConsumer, MESSAGE_CONSUMER_TOKEN } from "./message_consumer";

export * from "./message_consumer";

export function bindToContainer(container: Container): void {
    container
        .bind(KAFKA_CONSUMER_TOKEN)
        .toInstance(getKafkaConsumer)
        .inSingletonScope();
    container
        .bind(MESSAGE_CONSUMER_TOKEN)
        .toInstance(MessageConsumer)
        .inSingletonScope();
}
