import { injected, token } from "brandi";

export interface ExportOperator {
    processExport(id: number): Promise<void>;
}

export class ExportOperatorImpl implements ExportOperator {
    public async processExport(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

injected(ExportOperatorImpl);

export const EXPORT_OPERATOR_TOKEN = token<ExportOperator>("ExportOperator");
