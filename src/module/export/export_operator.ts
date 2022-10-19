import { injected, token } from "brandi";
import { Logger } from "winston";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import { ExportDataAccessor, EXPORT_DATA_ACCESSOR_TOKEN } from "../../dataaccess/db";
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
        private readonly exportDM: ExportDataAccessor,
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly datasetExporter: DatasetExporter,
        private readonly excelExporter: ExcelExporter,
        private readonly timer: Timer,
        private readonly logger: Logger,
        private readonly applicationConfig: ApplicationConfig
    ) {}

    public async processExport(id: number): Promise<void> {
        const exportRequest = await this.exportDM.withTransaction(async (exportDM) => {
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
        if (exportRequest === null) {
            return;
        }

        this.logger.info("export request found", {
            exportId: id,
            exportRequest,
        });

        const exportData = await this.getExportData(exportRequest.filterOptions);
        this.logger.info("retrieved image information", { imageCount: exportData.imageList.length });

        const exportedFileFilename =
            exportRequest.type === _ExportType_Values.DATASET
                ? await this.datasetExporter.generateExportFile(exportData)
                : await this.excelExporter.generateExportFile(exportData);
        this.logger.info("successfully generated export file", { exportedFileFilename });

        const expireTime = this.timer.getCurrentTime() + this.applicationConfig.exportExpireTime;

        await this.exportDM.withTransaction(async (exportDM) => {
            const exportRequest = await exportDM.getExportWithXLock(id);
            if (exportRequest === null) {
                this.logger.error("no export with export_id found", { exportId: id });
                return;
            }

            if (exportRequest.status === _ExportStatus_Values.DONE) {
                this.logger.error("export with export_id already has status of done", { exportId: id });
                return;
            }

            exportRequest.status = _ExportStatus_Values.DONE;
            exportRequest.exportedFileFilename = exportedFileFilename;
            exportRequest.expireTime = expireTime;
            await exportDM.updateExport(exportRequest);
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
}

injected(
    ExportOperatorImpl,
    EXPORT_DATA_ACCESSOR_TOKEN,
    IMAGE_INFO_PROVIDER_TOKEN,
    DATASET_EXPORTER_TOKEN,
    EXCEL_EXPORTER_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN,
    APPLICATION_CONFIG_TOKEN
);

export const EXPORT_OPERATOR_TOKEN = token<ExportOperator>("ExportOperator");
