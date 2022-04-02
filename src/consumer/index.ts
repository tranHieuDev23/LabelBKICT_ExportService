import { Container } from "brandi";
import {
    ExportServiceKafkaConsumer,
    EXPORT_SERVICE_KAFKA_CONSUMER_TOKEN,
} from "./consumer";
import {
    ExportCreatedMessageHandlerImpl,
    EXPORT_CREATED_MESSAGE_HANDLER_TOKEN,
} from "./export_created";

export * from "./export_created";

export function bindToContainer(container: Container): void {
    container
        .bind(EXPORT_CREATED_MESSAGE_HANDLER_TOKEN)
        .toInstance(ExportCreatedMessageHandlerImpl)
        .inSingletonScope();
    container
        .bind(EXPORT_SERVICE_KAFKA_CONSUMER_TOKEN)
        .toInstance(ExportServiceKafkaConsumer)
        .inSingletonScope();
}
