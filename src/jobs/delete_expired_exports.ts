import { injected, token } from "brandi";
import { ExportManagementOperator, EXPORT_MANAGEMENT_OPERATOR_TOKEN } from "../module/export_management";

export interface DeleteExpiredExports {
    execute(): Promise<void>;
}

export class DeleteExpiredExportsImpl implements DeleteExpiredExports {
    constructor(private readonly exportManagementOperator: ExportManagementOperator) {}

    public async execute(): Promise<void> {
        await this.exportManagementOperator.deleteExpiredExports();
    }
}

injected(DeleteExpiredExportsImpl, EXPORT_MANAGEMENT_OPERATOR_TOKEN);

export const DELETE_EXPIRED_EXPORTS_JOB_TOKEN = token<DeleteExpiredExports>("DeleteExpiredExportsJob");
