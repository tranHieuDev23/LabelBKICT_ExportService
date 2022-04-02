import { injected, token } from "brandi";
import { Logger } from "winston";
import { Archiver, create } from "archiver";
import { createWriteStream } from "fs";
import { join } from "path";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import { Image as ImageProto } from "../../proto/gen/Image";
import { ImageTag as ImageTagProto } from "../../proto/gen/ImageTag";
import { Region as RegionProto } from "../../proto/gen/Region";
import {
    IdGenerator,
    ID_GENERATOR_TOKEN,
    LOGGER_TOKEN,
    Timer,
    TIMER_TOKEN,
} from "../../utils";
import {
    ImageProtoToImageConverter,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
} from "./image_proto_to_image";
import {
    RegionProtoToRegionConverter,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
} from "./region_proto_to_region";
import { ImageTag } from "./dataset_metadata_models";

export interface DatasetExporter {
    generateExportFile(
        imageList: ImageProto[],
        imageTagList: ImageTagProto[][],
        regionList: RegionProto[][]
    ): Promise<string>;
}

export class DatasetExporterImpl implements DatasetExporter {
    constructor(
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly regionProtoToRegionConverter: RegionProtoToRegionConverter,
        private readonly applicationConfig: ApplicationConfig,
        private readonly timer: Timer,
        private readonly idGenerator: IdGenerator,
        private readonly logger: Logger
    ) {}

    public async generateExportFile(
        imageProtoList: ImageProto[],
        imageTagProtoList: ImageTagProto[][],
        regionProtoList: RegionProto[][]
    ): Promise<string> {
        const exportedFilename = await this.getExportedFilename();
        const archiver = this.getArchiver(exportedFilename);
        for (let i = 0; i < imageProtoList.length; i++) {
            await this.addImageToArchive(
                archiver,
                imageProtoList[i],
                imageTagProtoList[i],
                regionProtoList[i]
            );
        }
        await archiver.finalize();
        return exportedFilename;
    }

    private async getExportedFilename(): Promise<string> {
        const currentTime = this.timer.getCurrentTime();
        const id = await this.idGenerator.generate();
        return `Dataset-${currentTime}-${id}.zip`;
    }

    private getArchiver(exportedFilename: string): Archiver {
        const outputStream = createWriteStream(
            this.getExportedFilePath(exportedFilename)
        );
        const archiver = create("zip", { zlib: { level: 9 } });
        outputStream.on("close", () => {
            this.logger.info(
                `Exported ${exportedFilename}: ${archiver.pointer()} bytes`
            );
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

    private getExportedFilePath(exportedFilename: string): string {
        return join(this.applicationConfig.exportDir, exportedFilename);
    }

    private async addImageToArchive(
        archiver: Archiver,
        imageProto: ImageProto,
        imageTagProtoList: ImageTagProto[],
        regionProtoList: RegionProto[]
    ): Promise<void> {
        const imageMetadataJSON = await this.getImageMetadataJSON(
            imageProto,
            imageTagProtoList,
            regionProtoList
        );
        const originalImageFilePath = this.getOriginalImageFilePath(
            imageProto.originalImageFilename || ""
        );
        const exportedImageFilename = this.getExportedImageFilename(
            imageProto.id || 0
        );
        const exportedMetadataFilename = this.getExportedMetadataFilename(
            imageProto.id || 0
        );
        archiver.file(originalImageFilePath, {
            name: exportedImageFilename,
            prefix: "images",
        });
        archiver.append(imageMetadataJSON, {
            name: exportedMetadataFilename,
            prefix: "metadata",
        });
    }

    private async getImageMetadataJSON(
        imageProto: ImageProto,
        imageTagProtoList: ImageTagProto[],
        regionProtoList: RegionProto[]
    ): Promise<string> {
        const image = await this.imageProtoToImageConverter.convert(imageProto);
        const imageTagList = imageTagProtoList.map(
            (imageTagProto) =>
                new ImageTag(
                    imageTagProto.id || 0,
                    imageTagProto.displayName || ""
                )
        );
        const regionList = await Promise.all(
            regionProtoList.map((regionProto) =>
                this.regionProtoToRegionConverter.convert(regionProto)
            )
        );
        return JSON.stringify({
            image: image,
            image_tag_list: imageTagList,
            region_list: regionList,
        });
    }

    private getOriginalImageFilePath(originalImageFilename: string): string {
        return join(
            this.applicationConfig.originalImageDir,
            originalImageFilename
        );
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
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    TIMER_TOKEN,
    ID_GENERATOR_TOKEN,
    LOGGER_TOKEN
);

export const DATASET_EXPORTER_TOKEN = token<DatasetExporter>("DatasetExporter");
