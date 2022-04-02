import { injected, token } from "brandi";
import { ExportCreated } from "../dataaccess/kafka";
import { ExportOperator, EXPORT_OPERATOR_TOKEN } from "../module/export";

export interface ExportCreatedMessageHandler {
    onExportCreated(message: ExportCreated): Promise<void>;
}

export class ExportCreatedMessageHandlerImpl
    implements ExportCreatedMessageHandler
{
    constructor(private readonly exportOperator: ExportOperator) {}

    public async onExportCreated(message: ExportCreated): Promise<void> {
        await this.exportOperator.processExport(message.exportId);
    }
}

injected(ExportCreatedMessageHandlerImpl, EXPORT_OPERATOR_TOKEN);

export const EXPORT_CREATED_MESSAGE_HANDLER_TOKEN =
    token<ExportCreatedMessageHandler>("ExportCreatedMessageHandler");
