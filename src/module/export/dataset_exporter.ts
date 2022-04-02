import { injected, token } from "brandi";
import { Image } from "../../proto/gen/Image";
import { ImageTag } from "../../proto/gen/ImageTag";
import { Region } from "../../proto/gen/Region";

export interface DatasetExporter {
    generateExportFile(
        imageList: Image[],
        imageTagList: ImageTag[][],
        regionList: Region[][]
    ): Promise<string>;
}

export class DatasetExporterImpl implements DatasetExporter {
    generateExportFile(
        imageList: Image[],
        imageTagList: ImageTag[][],
        regionList: Region[][]
    ): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

injected(DatasetExporterImpl);

export const DATASET_EXPORTER_TOKEN = token<DatasetExporter>("DatasetExporter");
