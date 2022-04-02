import { Container } from "brandi";
import {
    ExportManagementOperatorImpl,
    EXPORT_MANAGEMENT_OPERATOR_TOKEN,
} from "./export_management_operator";

export * from "./export_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(EXPORT_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(ExportManagementOperatorImpl)
        .inSingletonScope();
}
