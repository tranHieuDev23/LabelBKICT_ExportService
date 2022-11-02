import { Container } from "brandi";
import { ExportDataAccessorImpl, EXPORT_DATA_ACCESSOR_TOKEN } from "./export";
import { KNEX_INSTANCE_TOKEN, newKnexInstance } from "./knex";

export * from "./export";

export function bindToContainer(container: Container): void {
    container
        .bind(KNEX_INSTANCE_TOKEN)
        .toInstance(newKnexInstance)
        .inSingletonScope();
    container
        .bind(EXPORT_DATA_ACCESSOR_TOKEN)
        .toInstance(ExportDataAccessorImpl)
        .inSingletonScope();
}
