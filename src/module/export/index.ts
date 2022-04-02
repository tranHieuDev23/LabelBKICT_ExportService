import { Container } from "brandi";
import {
    DatasetExporterImpl,
    DATASET_EXPORTER_TOKEN,
} from "./dataset_exporter";
import { ExcelExporterImpl, EXCEL_EXPORTER_TOKEN } from "./excel_exporter";
import { ExportOperatorImpl, EXPORT_OPERATOR_TOKEN } from "./export_operator";

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
}
