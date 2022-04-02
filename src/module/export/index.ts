import { Container } from "brandi";
import { ExportOperatorImpl, EXPORT_OPERATOR_TOKEN } from "./export_operator";

export * from "./export_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(EXPORT_OPERATOR_TOKEN)
        .toInstance(ExportOperatorImpl)
        .inSingletonScope();
}
