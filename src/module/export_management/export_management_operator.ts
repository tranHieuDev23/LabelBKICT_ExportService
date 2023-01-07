import { Readable } from "stream";
import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Logger } from "winston";
import { ExportDataAccessor, EXPORT_DATA_ACCESSOR_TOKEN } from "../../dataaccess/db";
import { Export } from "../../proto/gen/Export";
import { _ExportStatus_Values } from "../../proto/gen/ExportStatus";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { ImageListFilterOptions } from "../../proto/gen/ImageListFilterOptions";
import { ErrorWithStatus, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";
import { ExportCreated, ExportCreatedProducer, EXPORT_CREATED_PRODUCER_TOKEN } from "../../dataaccess/kafka";
import { BucketDM, EXPORT_S3_DM_TOKEN } from "../../dataaccess/s3";

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
    deleteExpiredExports(): Promise<void>;
}

export class ExportManagementOperatorImpl implements ExportManagementOperator {
    constructor(
        private readonly exportDatabaseDM: ExportDataAccessor,
        private readonly exportS3DM: BucketDM,
        private readonly exportCreatedProducer: ExportCreatedProducer,
        private readonly timer: Timer,
        private readonly logger: Logger
    ) {}

    public async createExport(
        requestedByUserId: number,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export> {
        const currentTime = this.timer.getCurrentTime();

        const exportId = await this.exportDatabaseDM.createExport({
            requestedByUserId: requestedByUserId,
            type: type,
            requestTime: currentTime,
            filterOptions: filterOptions,
            status: _ExportStatus_Values.REQUESTED,
            expireTime: 0,
            exportedFilename: "",
        });

        await this.exportCreatedProducer.createExportCreatedMessage(new ExportCreated(exportId));

        return {
            id: exportId,
            requestedByUserId: requestedByUserId,
            type: type,
            requestTime: currentTime,
            status: _ExportStatus_Values.REQUESTED,
            expireTime: 0,
            exportedFileFilename: "",
        };
    }

    public async getExportList(
        requestedByUserId: number,
        offset: number,
        limit: number
    ): Promise<{ totalExportCount: number; exportList: Export[] }> {
        const currentTime = this.timer.getCurrentTime();
        const dmResults = await Promise.all([
            this.exportDatabaseDM.getExportCount(requestedByUserId, currentTime),
            this.exportDatabaseDM.getExportList(requestedByUserId, currentTime, offset, limit),
        ]);
        const totalExportCount = dmResults[0];
        const exportList = dmResults[1];
        return { totalExportCount, exportList };
    }

    public async getExport(id: number): Promise<Export> {
        const exportRequest = await this.exportDatabaseDM.getExport(id);
        if (exportRequest === null) {
            this.logger.error("no export with export_id found", {
                exportId: id,
            });
            throw new ErrorWithStatus(`no export with export_id ${id} found`, status.NOT_FOUND);
        }
        return exportRequest;
    }

    public async getExportFile(id: number): Promise<Readable> {
        const exportRequest = await this.exportDatabaseDM.getExport(id);
        if (exportRequest === null) {
            this.logger.error("no export with export_id found", {
                exportId: id,
            });
            throw new ErrorWithStatus(`no export with export_id ${id} found`, status.NOT_FOUND);
        }
        if (exportRequest.status !== _ExportStatus_Values.DONE) {
            this.logger.error("export with export_id has not been done yet", {
                exportId: id,
            });
            throw new ErrorWithStatus(`export with export_id ${id} has not been done yet`, status.FAILED_PRECONDITION);
        }
        return await this.exportS3DM.getFileStream(exportRequest.exportedFileFilename);
    }

    public async deleteExport(id: number): Promise<void> {
        await this.exportDatabaseDM.deleteExport(id);
    }

    public async deleteExpiredExports(): Promise<void> {
        const requestTime = this.timer.getCurrentTime();
        await this.exportDatabaseDM.deleteExpiredExportList(requestTime);
    }
}

injected(
    ExportManagementOperatorImpl,
    EXPORT_DATA_ACCESSOR_TOKEN,
    EXPORT_S3_DM_TOKEN,
    EXPORT_CREATED_PRODUCER_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN
);

export const EXPORT_MANAGEMENT_OPERATOR_TOKEN = token<ExportManagementOperator>("ExportManagementOperator");
