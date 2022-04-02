import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Producer } from "kafkajs";
import { Logger } from "winston";
import {
    BinaryConverter,
    BINARY_CONVERTER_TOKEN,
    ErrorWithStatus,
    LOGGER_TOKEN,
} from "../../../utils";
import { KAFKA_PRODUCER_TOKEN } from "./producer";

export class ExportCreated {
    constructor(public exportId: number) {}
}

export interface ExportCreatedProducer {
    createExportCreatedMessage(message: ExportCreated): Promise<void>;
}

const TopicNameExportServiceExportCreated = "export_service_export_created";

export class ExportCreatedProducerImpl implements ExportCreatedProducer {
    constructor(
        private readonly producer: Producer,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) {}

    public async createExportCreatedMessage(
        message: ExportCreated
    ): Promise<void> {
        try {
            this.producer.send({
                topic: TopicNameExportServiceExportCreated,
                messages: [
                    {
                        value: this.binaryConverter.toBuffer(message),
                    },
                ],
            });
        } catch (error) {
            this.logger.error(
                `failed to create ${TopicNameExportServiceExportCreated} message`,
                { message, error }
            );
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }
}

injected(
    ExportCreatedProducerImpl,
    KAFKA_PRODUCER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const EXPORT_CREATED_PRODUCER_TOKEN = token<ExportCreatedProducer>(
    "ExportCreatedProducer"
);
