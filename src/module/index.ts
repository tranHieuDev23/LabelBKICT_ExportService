import { Container } from "brandi";
import * as exportModule from "./export";
import * as exportManagementModule from "./export_management";
import * as infoProvidersModule from "./info_providers";
import * as s3Migration from "./s3_migration";

export function bindToContainer(container: Container): void {
    exportModule.bindToContainer(container);
    exportManagementModule.bindToContainer(container);
    infoProvidersModule.bindToContainer(container);
    s3Migration.bindToContainer(container);
}
