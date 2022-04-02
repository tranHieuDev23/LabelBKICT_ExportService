import { injected, token } from "brandi";
import { sendUnaryData, status } from "@grpc/grpc-js";
import { ExportServiceHandlers } from "../proto/gen/ExportService";
import { ErrorWithStatus } from "../utils";
import {
    ExportManagementOperator,
    EXPORT_MANAGEMENT_OPERATOR_TOKEN,
} from "../module/export_management";

export class ExportServiceHandlersFactory {
    constructor(
        private readonly exportManagementOperator: ExportManagementOperator
    ) {}

    public getExportServiceHandlers(): ExportServiceHandlers {
        const handler: ExportServiceHandlers = {
            CreateExport: async (call, callback) => {},
            DeleteExport: async (call, callback) => {},
            GetExport: async (call, callback) => {},
            GetExportFile: async (call) => {},
            GetExportList: async (call, callback) => {},
        };
        return handler;
    }

    private handleError(e: unknown, callback: sendUnaryData<any>) {
        if (e instanceof ErrorWithStatus) {
            return callback({
                message: e.message,
                code: e.status,
            });
        } else if (e instanceof Error) {
            return callback({
                message: e.message,
                code: status.INTERNAL,
            });
        } else {
            return callback({
                code: status.INTERNAL,
            });
        }
    }
}

injected(ExportServiceHandlersFactory, EXPORT_MANAGEMENT_OPERATOR_TOKEN);

export const EXPORT_SERVICE_HANDLERS_FACTORY_TOKEN =
    token<ExportServiceHandlersFactory>("ExportServiceHandlersFactory");
