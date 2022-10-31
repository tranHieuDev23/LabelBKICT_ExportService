import { injected, token } from "brandi";
import { Logger } from "winston";
import { dirSync } from "tmp";
import { createReadStream } from "fs";
import { join } from "path";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import { Export, ExportDataAccessor, EXPORT_DATA_ACCESSOR_TOKEN } from "../../dataaccess/db";
import { _ExportStatus_Values } from "../../proto/gen/ExportStatus";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { ImageListFilterOptions } from "../../proto/gen/ImageListFilterOptions";
import { Image } from "../../proto/gen/Image";
import { ImageTag } from "../../proto/gen/ImageTag";
import { Region } from "../../proto/gen/Region";
import { LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";
import { DatasetExporter, DATASET_EXPORTER_TOKEN } from "./dataset_exporter";
import { ExcelExporter, EXCEL_EXPORTER_TOKEN } from "./excel_exporter";
import { ImageInfoProvider, IMAGE_INFO_PROVIDER_TOKEN } from "../info_providers";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";
import { BucketDM, EXPORT_S3_DM_TOKEN } from "../../dataaccess/s3";

interface ExportData {
    imageList: Image[];
    imageTagList: ImageTag[][];
    regionList: Region[][];
    regionSnapshotListAtPublishTime: Region[][];
    regionSnapshotListAtVerifyTime: Region[][];
}

export interface ExportOperator {
    processExport(id: number): Promise<void>;
}

export class ExportOperatorImpl implements ExportOperator {
    constructor(
        private readonly exportDatabaseDM: ExportDataAccessor,
        private readonly exportS3DM: BucketDM,
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly datasetExporter: DatasetExporter,
        private readonly excelExporter: ExcelExporter,
        private readonly timer: Timer,
        private readonly logger: Logger,
        private readonly applicationConfig: ApplicationConfig
    ) {}

    public async processExport(id: number): Promise<void> {
        const exportRequest = await this.getRequestedExportAndUpdateToProcessing(id);
        if (exportRequest === null) {
            return;
        }
        this.logger.info("export request found", { exportId: id, exportRequest });

        const exportData = await this.getExportData(exportRequest.filterOptions);
        this.logger.info("retrieved image information", { imageCount: exportData.imageList.length });

        const { name: exportedFileDirectory, removeCallback: exportedFileDirectoryCleanup } = dirSync({
            unsafeCleanup: true,
        });

        try {
            const exportedFileName = await this.generateExportFile(exportRequest, exportData, exportedFileDirectory);
            this.logger.info("successfully generated export file", { exportedFileName });

            await this.uploadExportedFile(exportedFileDirectory, exportedFileName);
            this.logger.info("successfully uploaded export file to s3", { exportedFileName });

            const expireTime = this.timer.getCurrentTime() + this.applicationConfig.exportExpireTime;
            await this.updateExportRequest(id, exportedFileName, expireTime);
            this.logger.info("successfully updated export information into database", { exportId: id });
        } finally {
            exportedFileDirectoryCleanup();
        }
    }

    private async getRequestedExportAndUpdateToProcessing(id: number): Promise<Export | null> {
        return await this.exportDatabaseDM.withTransaction(async (exportDM) => {
            const exportRequest = await exportDM.getExportWithXLock(id);
            if (exportRequest === null) {
                this.logger.error("no export with export_id found", {
                    exportId: id,
                });
                return null;
            }

            if (exportRequest.status === _ExportStatus_Values.DONE) {
                this.logger.error("export with export_id already has status of done", { exportId: id });
                return null;
            }

            exportRequest.status = _ExportStatus_Values.PROCESSING;
            await exportDM.updateExport(exportRequest);
            return exportRequest;
        });
    }

    private async getExportData(filterOptions: ImageListFilterOptions): Promise<ExportData> {
        const { imageList, imageTagList, regionList } = await this.imageInfoProvider.getImageList(filterOptions);

        const regionSnapshotListAtPublishTime: Region[][] = [];
        const regionSnapshotListAtVerifyTime: Region[][] = [];
        for (const image of imageList) {
            const imageId = image.id || 0;
            regionSnapshotListAtPublishTime.push(
                await this.imageInfoProvider.getRegionSnapshotListAtStatus(imageId, _ImageStatus_Values.PUBLISHED)
            );
            regionSnapshotListAtVerifyTime.push(
                await this.imageInfoProvider.getRegionSnapshotListAtStatus(imageId, _ImageStatus_Values.VERIFIED)
            );
        }

        return { imageList, imageTagList, regionList, regionSnapshotListAtPublishTime, regionSnapshotListAtVerifyTime };
    }

    private async generateExportFile(
        exportRequest: Export,
        exportData: ExportData,
        exportedFileDirectory: string
    ): Promise<string> {
        const exportedFileFilename =
            exportRequest.type === _ExportType_Values.DATASET
                ? await this.datasetExporter.generateExportFile({ exportedFileDirectory, ...exportData })
                : await this.excelExporter.generateExportFile({ exportedFileDirectory, ...exportData });
        return exportedFileFilename;
    }

    private async uploadExportedFile(exportedFileDirectory: string, exportedFileName: string): Promise<void> {
        const exportedFileStream = createReadStream(join(exportedFileDirectory, exportedFileName));
        await this.exportS3DM.uploadFile(exportedFileName, exportedFileStream);
    }

    private async updateExportRequest(exportId: number, exportedFileName: string, expireTime: number): Promise<void> {
        await this.exportDatabaseDM.withTransaction(async (exportDM) => {
            const exportRequest = await exportDM.getExportWithXLock(exportId);
            if (exportRequest === null) {
                this.logger.error("no export with export_id found", { exportId: exportId });
                return;
            }

            if (exportRequest.status === _ExportStatus_Values.DONE) {
                this.logger.error("export with export_id already has status of done", { exportId: exportId });
                return;
            }

            exportRequest.status = _ExportStatus_Values.DONE;
            exportRequest.exportedFileFilename = exportedFileName;
            exportRequest.expireTime = expireTime;
            await exportDM.updateExport(exportRequest);
        });
    }
}

injected(
    ExportOperatorImpl,
    EXPORT_DATA_ACCESSOR_TOKEN,
    EXPORT_S3_DM_TOKEN,
    IMAGE_INFO_PROVIDER_TOKEN,
    DATASET_EXPORTER_TOKEN,
    EXCEL_EXPORTER_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN,
    APPLICATION_CONFIG_TOKEN
);

export const EXPORT_OPERATOR_TOKEN = token<ExportOperator>("ExportOperator");
