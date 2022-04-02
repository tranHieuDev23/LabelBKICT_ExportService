import { injected, token } from "brandi";
import { Logger } from "winston";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import {
    ExportDataAccessor,
    EXPORT_DATA_ACCESSOR_TOKEN,
} from "../../dataaccess/db";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { _ExportStatus_Values } from "../../proto/gen/ExportStatus";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import {
    LOGGER_TOKEN,
    promisifyGRPCCall,
    Timer,
    TIMER_TOKEN,
} from "../../utils";
import { DatasetExporter, DATASET_EXPORTER_TOKEN } from "./dataset_exporter";
import { ExcelExporter, EXCEL_EXPORTER_TOKEN } from "./excel_exporter";

export interface ExportOperator {
    processExport(id: number): Promise<void>;
}

export class ExportOperatorImpl implements ExportOperator {
    constructor(
        private readonly exportDM: ExportDataAccessor,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly datasetExporter: DatasetExporter,
        private readonly excelExporter: ExcelExporter,
        private readonly timer: Timer,
        private readonly logger: Logger,
        private readonly applicationConfig: ApplicationConfig
    ) {}

    public async processExport(id: number): Promise<void> {
        const exportRequest = await this.exportDM.withTransaction(
            async (exportDM) => {
                const exportRequest = await exportDM.getExportWithXLock(id);
                if (exportRequest === null) {
                    this.logger.error("no export with export_id found", {
                        exportId: id,
                    });
                    return null;
                }

                if (exportRequest.status === _ExportStatus_Values.DONE) {
                    this.logger.error(
                        "export with export_id already has status of done",
                        { exportId: id }
                    );
                    return null;
                }

                exportRequest.status = _ExportStatus_Values.PROCESSING;
                await this.exportDM.updateExport(exportRequest);
                return exportRequest;
            }
        );
        if (exportRequest === null) {
            return;
        }

        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                {
                    filterOptions: exportRequest.filterOptions,
                    withImageTag: true,
                    withRegion: true,
                }
            );
        if (getImageListError !== null) {
            this.logger.error("failed to call image_list.getImageList()", {
                error: getImageListError,
            });
            throw getImageListError;
        }

        const imageProtoList = getImageListResponse?.imageList || [];
        const imageTagListOfImageList =
            getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map(
            (imageTagList) => imageTagList.imageTagList || []
        );
        const regionListOfImageList =
            getImageListResponse?.regionListOfImageList || [];
        const regionProtoList = regionListOfImageList.map(
            (regionList) => regionList.regionList || []
        );

        const exportedFilename =
            exportRequest.type === _ExportType_Values.DATASET
                ? await this.datasetExporter.generateExportFile(
                      imageProtoList,
                      imageTagProtoList,
                      regionProtoList
                  )
                : await this.excelExporter.generateExportFile(
                      imageProtoList,
                      imageTagProtoList,
                      regionProtoList
                  );
        const expireTime =
            this.timer.getCurrentTime() +
            this.applicationConfig.exportExpireTime;

        await this.exportDM.withTransaction(async (exportDM) => {
            const exportRequest = await exportDM.getExportWithXLock(id);
            if (exportRequest === null) {
                this.logger.error("no export with export_id found", {
                    exportId: id,
                });
                return null;
            }

            if (exportRequest.status === _ExportStatus_Values.DONE) {
                this.logger.error(
                    "export with export_id already has status of done",
                    { exportId: id }
                );
                return null;
            }

            exportRequest.status = _ExportStatus_Values.DONE;
            exportRequest.exportedFilename = exportedFilename;
            exportRequest.expireTime = expireTime;
            await this.exportDM.updateExport(exportRequest);
        });
    }
}

injected(
    ExportOperatorImpl,
    EXPORT_DATA_ACCESSOR_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    DATASET_EXPORTER_TOKEN,
    EXCEL_EXPORTER_TOKEN,
    TIMER_TOKEN,
    LOGGER_TOKEN,
    APPLICATION_CONFIG_TOKEN
);

export const EXPORT_OPERATOR_TOKEN = token<ExportOperator>("ExportOperator");
