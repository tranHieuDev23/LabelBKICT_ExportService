import { Container } from "brandi";
import * as exportModule from "./export";
import * as exportManagementModule from "./export_management";

export function bindToContainer(container: Container): void {
    exportModule.bindToContainer(container);
    exportManagementModule.bindToContainer(container);
}
