import { injected, token } from "brandi";
import { Logger } from "winston";
import { Archiver, create } from "archiver";
import { createWriteStream } from "fs";
import { join } from "path";
import { Image as ImageProto } from "../../proto/gen/Image";
import { ImageTag as ImageTagProto } from "../../proto/gen/ImageTag";
import { Region as RegionProto } from "../../proto/gen/Region";
import { IdGenerator, ID_GENERATOR_TOKEN, LOGGER_TOKEN, Timer, TIMER_TOKEN } from "../../utils";
import { ImageProtoToImageConverter, IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN } from "./image_proto_to_image";
import { RegionProtoToRegionConverter, REGION_PROTO_TO_REGION_CONVERTER_TOKEN } from "./region_proto_to_region";
import { ImageTag } from "./dataset_metadata_models";
import { BucketDM, ORIGINAL_IMAGE_S3_DM_TOKEN } from "../../dataaccess/s3";

export interface DatasetExporterArguments {
    exportedFileDirectory: string;
    imageList: ImageProto[];
    imageTagList: ImageTagProto[][];
    regionList: RegionProto[][];
    regionSnapshotListAtPublishTime: RegionProto[][];
    regionSnapshotListAtVerifyTime: RegionProto[][];
}

export interface DatasetExporter {
    generateExportFile(args: DatasetExporterArguments): Promise<string>;
}

export class DatasetExporterImpl implements DatasetExporter {
    constructor(
        private readonly originalImageS3DM: BucketDM,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly regionProtoToRegionConverter: RegionProtoToRegionConverter,
        private readonly timer: Timer,
        private readonly idGenerator: IdGenerator,
        private readonly logger: Logger
    ) {}

    public async generateExportFile(args: DatasetExporterArguments): Promise<string> {
        const { imageList, imageTagList, regionList, regionSnapshotListAtPublishTime, regionSnapshotListAtVerifyTime } =
            args;
        const exportedFileName = await this.getExportedFileName();
        const archiver = this.getArchiver(args.exportedFileDirectory, exportedFileName);
        for (let i = 0; i < imageList.length; i++) {
            await this.addImageToArchive(archiver, imageList[i]);
            await this.addImageMetadataToArchive(
                archiver,
                imageList[i],
                imageTagList[i],
                regionList[i],
                regionSnapshotListAtPublishTime[i],
                regionSnapshotListAtVerifyTime[i]
            );
        }
        await archiver.finalize();
        return exportedFileName;
    }

    private async getExportedFileName(): Promise<string> {
        const currentTime = this.timer.getCurrentTime();
        const id = await this.idGenerator.generate();
        return `Dataset-${currentTime}-${id}.zip`;
    }

    private getArchiver(exportedFileDirectory: string, exportedFileName: string): Archiver {
        const outputStream = createWriteStream(join(exportedFileDirectory, exportedFileName));
        const archiver = create("zip", { zlib: { level: 9 } });
        outputStream.on("close", () => {
            this.logger.info(`Exported ${exportedFileName}: ${archiver.pointer()} bytes`);
        });
        archiver.on("warning", (error) => {
            if (error.code === "ENOENT") {
                this.logger.warn("warning during generation of archive file", {
                    error,
                });
            } else {
                this.logger.error("error during generation of archive file", {
                    error,
                });
                throw error;
            }
        });
        archiver.on("error", (error) => {
            this.logger.error("error during generation of archive file", {
                error,
            });
            throw error;
        });
        archiver.pipe(outputStream);
        return archiver;
    }

    private async addImageToArchive(archiver: Archiver, imageProto: ImageProto): Promise<void> {
        const originalImageFileData = await this.originalImageS3DM.getFile(imageProto.originalImageFilename || "");
        const exportedImageFilename = this.getExportedImageFilename(imageProto.id || 0);
        archiver.append(originalImageFileData, {
            name: exportedImageFilename,
            prefix: "images",
        });
    }

    private async addImageMetadataToArchive(
        archiver: Archiver,
        imageProto: ImageProto,
        imageTagProtoList: ImageTagProto[],
        regionProtoList: RegionProto[],
        regionSnapshotListAtPublishTime: RegionProto[],
        regionSnapshotListAtVerifyTime: RegionProto[]
    ): Promise<void> {
        const imageMetadataJSON = await this.getImageMetadataJSON(
            imageProto,
            imageTagProtoList,
            regionProtoList,
            regionSnapshotListAtPublishTime,
            regionSnapshotListAtVerifyTime
        );
        const exportedMetadataFilename = this.getExportedMetadataFilename(imageProto.id || 0);
        archiver.append(imageMetadataJSON, {
            name: exportedMetadataFilename,
            prefix: "metadata",
        });
    }

    private async getImageMetadataJSON(
        imageProto: ImageProto,
        imageTagProtoList: ImageTagProto[],
        regionProtoList: RegionProto[],
        regionSnapshotListAtPublishTime: RegionProto[],
        regionSnapshotListAtVerifyTime: RegionProto[]
    ): Promise<string> {
        const image = await this.imageProtoToImageConverter.convert(imageProto);
        const imageTagList = imageTagProtoList.map(
            (imageTagProto) => new ImageTag(imageTagProto.id || 0, imageTagProto.displayName || "")
        );
        const regionList = await Promise.all(
            regionProtoList.map((regionProto) => this.regionProtoToRegionConverter.convert(regionProto))
        );
        const regionListAtPublishTime = await Promise.all(
            regionSnapshotListAtPublishTime.map((regionProto) => this.regionProtoToRegionConverter.convert(regionProto))
        );
        const regionListAtVerifyTime = await Promise.all(
            regionSnapshotListAtVerifyTime.map((regionProto) => this.regionProtoToRegionConverter.convert(regionProto))
        );
        return JSON.stringify({
            image: image,
            image_tag_list: imageTagList,
            region_list: regionList,
            region_list_at_publish_time: regionListAtPublishTime,
            region_list_at_verify_time: regionListAtVerifyTime,
        });
    }

    private getExportedImageFilename(imageId: number): string {
        return `${imageId}.jpeg`;
    }

    private getExportedMetadataFilename(imageId: number): string {
        return `${imageId}.json`;
    }
}

injected(
    DatasetExporterImpl,
    ORIGINAL_IMAGE_S3_DM_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
    TIMER_TOKEN,
    ID_GENERATOR_TOKEN,
    LOGGER_TOKEN
);

export const DATASET_EXPORTER_TOKEN = token<DatasetExporter>("DatasetExporter");
