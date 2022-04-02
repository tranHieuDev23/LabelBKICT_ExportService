import { injected, token } from "brandi";
import { Image as ImageProto } from "../../proto/gen/Image";
import { ImageTag as ImageTagProto } from "../../proto/gen/ImageTag";
import { Region as RegionProto } from "../../proto/gen/Region";

export interface ExcelExporter {
    generateExportFile(
        imageList: ImageProto[],
        imageTagList: ImageTagProto[][],
        regionList: RegionProto[][]
    ): Promise<string>;
}

export class ExcelExporterImpl implements ExcelExporter {
    generateExportFile(
        imageList: ImageProto[],
        imageTagList: ImageTagProto[][],
        regionList: RegionProto[][]
    ): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

injected(ExcelExporterImpl);

export const EXCEL_EXPORTER_TOKEN = token<ExcelExporter>("ExcelExporter");
