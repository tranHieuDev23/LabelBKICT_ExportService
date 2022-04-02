import { injected, token } from "brandi";
import { sendUnaryData, status } from "@grpc/grpc-js";
import { ExportServiceHandlers } from "../proto/gen/ExportService";
import { ErrorWithStatus } from "../utils";
import {
    ExportManagementOperator,
    EXPORT_MANAGEMENT_OPERATOR_TOKEN,
} from "../module/export_management";

const DEFAULT_GET_EXPORT_LIST_LIMIT = 10;

export class ExportServiceHandlersFactory {
    constructor(
        private readonly exportManagementOperator: ExportManagementOperator
    ) {}

    public getExportServiceHandlers(): ExportServiceHandlers {
        const handler: ExportServiceHandlers = {
            CreateExport: async (call, callback) => {
                const req = call.request;
                if (req.requestedByUserId === undefined) {
                    return callback({
                        message: "requested_by_user_id is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                if (req.type === undefined) {
                    return callback({
                        message: "type is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                const filterOptions = req.filterOptions || {};
                try {
                    const exportRequest =
                        await this.exportManagementOperator.createExport(
                            req.requestedByUserId,
                            req.type,
                            filterOptions
                        );
                    callback(null, { export: exportRequest });
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            DeleteExport: async (call, callback) => {
                const req = call.request;
                if (req.id === undefined) {
                    return callback({
                        message: "id is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                try {
                    await this.exportManagementOperator.deleteExport(req.id);
                    callback(null, {});
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            GetExport: async (call, callback) => {
                const req = call.request;
                if (req.id === undefined) {
                    return callback({
                        message: "id is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                try {
                    const exportRequest =
                        await this.exportManagementOperator.getExport(req.id);
                    callback(null, { export: exportRequest });
                } catch (e) {
                    this.handleError(e, callback);
                }
            },

            GetExportFile: async (call) => {
                const req = call.request;
                if (req.id === undefined) {
                    call.destroy(
                        new ErrorWithStatus(
                            "id is required",
                            status.INVALID_ARGUMENT
                        )
                    );
                    return;
                }

                this.exportManagementOperator.getExportFile(req.id).subscribe({
                    next: (data) => {
                        call.write({ data });
                    },
                    error: (error) => {
                        call.destroy(error);
                    },
                    complete: () => {
                        call.destroy();
                    },
                });
            },

            GetExportList: async (call, callback) => {
                const req = call.request;
                if (req.requestedByUserId === undefined) {
                    return callback({
                        message: "requested_by_user_id is required",
                        code: status.INVALID_ARGUMENT,
                    });
                }
                const offset = req.offset || 0;
                const limit = req.limit || DEFAULT_GET_EXPORT_LIST_LIMIT;
                try {
                    const { totalExportCount, exportList } =
                        await this.exportManagementOperator.getExportList(
                            req.requestedByUserId,
                            offset,
                            limit
                        );
                    callback(null, { totalExportCount, exportList });
                } catch (e) {
                    this.handleError(e, callback);
                }
            },
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
