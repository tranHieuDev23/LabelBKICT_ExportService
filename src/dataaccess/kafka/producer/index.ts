import { Container } from "brandi";
import {
    ExportCreatedProducerImpl,
    EXPORT_CREATED_PRODUCER_TOKEN,
} from "./export_created";
import { getKafkaProducer, KAFKA_PRODUCER_TOKEN } from "./producer";

export * from "./export_created";

export function bindToContainer(container: Container): void {
    container
        .bind(KAFKA_PRODUCER_TOKEN)
        .toInstance(getKafkaProducer)
        .inSingletonScope();
    container
        .bind(EXPORT_CREATED_PRODUCER_TOKEN)
        .toInstance(ExportCreatedProducerImpl)
        .inSingletonScope();
}
