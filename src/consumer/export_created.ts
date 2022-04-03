import { injected, token } from "brandi";
import { Logger } from "winston";
import { ExportCreated } from "../dataaccess/kafka";
import { ExportOperator, EXPORT_OPERATOR_TOKEN } from "../module/export";
import { LOGGER_TOKEN } from "../utils";

export interface ExportCreatedMessageHandler {
    onExportCreated(message: ExportCreated): Promise<void>;
}

export class ExportCreatedMessageHandlerImpl
    implements ExportCreatedMessageHandler
{
    constructor(
        private readonly exportOperator: ExportOperator,
        private readonly logger: Logger
    ) {}

    public async onExportCreated(message: ExportCreated): Promise<void> {
        this.logger.info("export_service_export_created message received", {
            payload: message,
        });
        await this.exportOperator.processExport(message.exportId);
    }
}

injected(ExportCreatedMessageHandlerImpl, EXPORT_OPERATOR_TOKEN, LOGGER_TOKEN);

export const EXPORT_CREATED_MESSAGE_HANDLER_TOKEN =
    token<ExportCreatedMessageHandler>("ExportCreatedMessageHandler");
