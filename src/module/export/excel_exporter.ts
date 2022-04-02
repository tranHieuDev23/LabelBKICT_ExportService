import { injected, token } from "brandi";
import { Image } from "../../proto/gen/Image";
import { ImageTag } from "../../proto/gen/ImageTag";
import { Region } from "../../proto/gen/Region";

export interface ExcelExporter {
    generateExportFile(
        imageList: Image[],
        imageTagList: ImageTag[][],
        regionList: Region[][]
    ): Promise<string>;
}

export class ExcelExporterImpl implements ExcelExporter {
    generateExportFile(
        imageList: Image[],
        imageTagList: ImageTag[][],
        regionList: Region[][]
    ): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

injected(ExcelExporterImpl);

export const EXCEL_EXPORTER_TOKEN = token<ExcelExporter>("ExcelExporter");
