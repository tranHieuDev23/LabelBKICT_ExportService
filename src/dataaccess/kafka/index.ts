import { Container } from "brandi";
import * as consumer from "./consumer";
import * as producer from "./producer";
import { getKafkaInstance, KAFKA_INSTANCE_TOKEN } from "./kafka";

export * from "./consumer";
export * from "./producer";

export function bindToContainer(container: Container): void {
    container
        .bind(KAFKA_INSTANCE_TOKEN)
        .toInstance(getKafkaInstance)
        .inSingletonScope();
    consumer.bindToContainer(container);
    producer.bindToContainer(container);
}
