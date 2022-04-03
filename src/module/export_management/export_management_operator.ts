import { createReadStream } from "fs";
import { join } from "path";
import { Readable } from "stream";
import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    ExportDataAccessor,
    EXPORT_DATA_ACCESSOR_TOKEN,
} from "../../dataaccess/db";
import { Export } from "../../proto/gen/Export";
import { _ExportStatus_Values } from "../../proto/gen/ExportStatus";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { ImageListFilterOptions } from "../../proto/gen/ImageListFilterOptions";
import { ErrorWithStatus, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import {
    ExportCreated,
    ExportCreatedProducer,
    EXPORT_CREATED_PRODUCER_TOKEN,
} from "../../dataaccess/kafka";

export interface ExportManagementOperator {
    createExport(
        requestedByUserId: number,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export>;
    getExportList(
        requestedByUserId: number,
        offset: number,
        limit: number
    ): Promise<{
        totalExportCount: number;
        exportList: Export[];
    }>;
    getExport(id: number): Promise<Export>;
    getExportFile(id: number): Promise<Readable>;
    deleteExport(id: number): Promise<void>;
}

export class ExportManagementOperatorImpl implements ExportManagementOperator {
    constructor(
        private readonly exportDM: ExportDataAccessor,
        private readonly exportCreatedProducer: ExportCreatedProducer,
        private readonly applicationConfig: ApplicationConfig,
        private readonly timer: Timer,
        private readonly logger: Logger
    ) {}

    public async createExport(
        requestedByUserId: number,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export> {
        const currentTime = this.timer.getCurrentTime();
        return this.exportDM.withTransaction(async (exportDM) => {
            const exportId = await exportDM.createExport({
                requestedByUserId: requestedByUserId,
                type: type,
                requestTime: currentTime,
                filterOptions: filterOptions,
                status: _ExportStatus_Values.REQUESTED,
                expireTime: 0,
                exportedFilename: "",
            });
            await this.exportCreatedProducer.createExportCreatedMessage(
                new ExportCreated(exportId)
            );
            return {
                id: exportId,
                requestedByUserId: requestedByUserId,
                type: type,
                requestTime: currentTime,
                filterOptions: filterOptions,
                status: _ExportStatus_Values.REQUESTED,
                expireTime: 0,
                exportedFileFilename: "",
            };
        });
    }

    public async getExportList(
        requestedByUserId: number,
        offset: number,
        limit: number
    ): Promise<{ totalExportCount: number; exportList: Export[] }> {
        const currentTime = this.timer.getCurrentTime();
        const dmResults = await Promise.all([
            this.exportDM.getExportCount(requestedByUserId, currentTime),
            this.exportDM.getExportList(
                requestedByUserId,
                currentTime,
                offset,
                limit
            ),
        ]);
        const totalExportCount = dmResults[0];
        const exportList = dmResults[1];
        return { totalExportCount, exportList };
    }

    public async getExport(id: number): Promise<Export> {
        const exportRequest = await this.exportDM.getExport(id);
        if (exportRequest === null) {
            this.logger.error("no export with export_id found", {
                exportId: id,
            });
            throw new ErrorWithStatus(
                `no export with export_id ${id} found`,
                status.NOT_FOUND
            );
        }
        return exportRequest;
    }

    public async getExportFile(id: number): Promise<Readable> {
        const exportRequest = await this.exportDM.getExport(id);
        if (exportRequest === null) {
            this.logger.error("no export with export_id found", {
                exportId: id,
            });
            throw new ErrorWithStatus(
                `no export with export_id ${id} found`,
                status.NOT_FOUND
            );
        }
        if (exportRequest.status !== _ExportStatus_Values.DONE) {
            this.logger.error("export with export_id has not been done yet", {
                exportId: id,
            });
            throw new ErrorWithStatus(
                `export with export_id ${id} has not been done yet`,
                status.FAILED_PRECONDITION
            );
        }
        const exportedFilePath = this.getExportedFilePath(
            exportRequest.exportedFileFilename
        );
        return createReadStream(exportedFilePath);
    }

    public async deleteExport(id: number): Promise<void> {
        await this.exportDM.deleteExport(id);
    }

    private getExportedFilePath(exportedFileFilename: string): string {
        return join(this.applicationConfig.exportDir, exportedFileFilename);
    }
}

injected(
    ExportManagementOperatorImpl,
    EXPORT_DATA_ACCESSOR_TOKEN,
    EXPORT_CREATED_PRODUCER_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN
);

export const EXPORT_MANAGEMENT_OPERATOR_TOKEN = token<ExportManagementOperator>(
    "ExportManagementOperator"
);
