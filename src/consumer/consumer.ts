import { injected, token } from "brandi";
import { Logger } from "winston";
import { MessageConsumer, MESSAGE_CONSUMER_TOKEN } from "../dataaccess/kafka";
import {
    BinaryConverter,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN,
} from "../utils";
import {
    ExportCreatedMessageHandler,
    EXPORT_CREATED_MESSAGE_HANDLER_TOKEN,
} from "./export_created";

const TopicNameExportServiceExportCreated = "export_service_export_created";

export class ExportServiceKafkaConsumer {
    constructor(
        private readonly messageConsumer: MessageConsumer,
        private readonly exportCreatedMessageHandler: ExportCreatedMessageHandler,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) {}

    public start(): void {
        this.messageConsumer
            .registerHandlerListAndStart([
                {
                    topic: TopicNameExportServiceExportCreated,
                    onMessage: (message) => this.onExportCreated(message),
                },
            ])
            .then();
    }

    private async onExportCreated(message: Buffer | null): Promise<void> {
        if (message === null) {
            this.logger.error("null message, skipping");
            return;
        }
        const exportCreatedMessage = this.binaryConverter.fromBuffer(message);
        await this.exportCreatedMessageHandler.onExportCreated(
            exportCreatedMessage
        );
    }
}

injected(
    ExportServiceKafkaConsumer,
    MESSAGE_CONSUMER_TOKEN,
    EXPORT_CREATED_MESSAGE_HANDLER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const EXPORT_SERVICE_KAFKA_CONSUMER_TOKEN =
    token<ExportServiceKafkaConsumer>("ExportServiceKafkaConsumer");
