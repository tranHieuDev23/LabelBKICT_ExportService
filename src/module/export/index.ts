import { Container } from "brandi";
import {
    DatasetExporterImpl,
    DATASET_EXPORTER_TOKEN,
} from "./dataset_exporter";
import { ExcelExporterImpl, EXCEL_EXPORTER_TOKEN } from "./excel_exporter";
import { ExportOperatorImpl, EXPORT_OPERATOR_TOKEN } from "./export_operator";
import {
    ImageProtoToImageConverterImpl,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
} from "./image_proto_to_image";
import {
    RegionProtoToRegionConverterImpl,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
} from "./region_proto_to_region";
import {
    UserIdToUserConverterImpl,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export * from "./export_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(EXPORT_OPERATOR_TOKEN)
        .toInstance(ExportOperatorImpl)
        .inSingletonScope();
    container
        .bind(DATASET_EXPORTER_TOKEN)
        .toInstance(DatasetExporterImpl)
        .inSingletonScope();
    container
        .bind(EXCEL_EXPORTER_TOKEN)
        .toInstance(ExcelExporterImpl)
        .inSingletonScope();
    container
        .bind(IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN)
        .toInstance(ImageProtoToImageConverterImpl)
        .inSingletonScope();
    container
        .bind(REGION_PROTO_TO_REGION_CONVERTER_TOKEN)
        .toInstance(RegionProtoToRegionConverterImpl)
        .inSingletonScope();
    container
        .bind(USER_ID_TO_USER_CONVERTER_TOKEN)
        .toInstance(UserIdToUserConverterImpl)
        .inSingletonScope();
}
