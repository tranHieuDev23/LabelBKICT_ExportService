import { injected, token } from "brandi";
import { Observable } from "rxjs";
import { Export } from "../../proto/gen/Export";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { ImageListFilterOptions } from "../../proto/gen/ImageListFilterOptions";

export interface ExportManagementOperator {
    createExport(
        requestedByUserId: number,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export>;
    getExportList(
        requestedByUserId: number,
        requestTime: number,
        offset: number,
        limit: number
    ): Promise<{
        totalExportCount: number;
        exportList: Export[];
    }>;
    getExport(id: number): Promise<Export>;
    getExportFile(id: number): Observable<Buffer>;
    deleteExport(id: number): Promise<void>;
}

export class ExportManagementOperatorImpl implements ExportManagementOperator {
    public async createExport(
        requestedByUserId: number,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export> {
        throw new Error("Method not implemented.");
    }

    public async getExportList(
        requestedByUserId: number,
        requestTime: number,
        offset: number,
        limit: number
    ): Promise<{ totalExportCount: number; exportList: Export[] }> {
        throw new Error("Method not implemented.");
    }

    public async getExport(id: number): Promise<Export> {
        throw new Error("Method not implemented.");
    }

    public getExportFile(id: number): Observable<Buffer> {
        throw new Error("Method not implemented.");
    }

    public async deleteExport(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

injected(ExportManagementOperatorImpl);

export const EXPORT_MANAGEMENT_OPERATOR_TOKEN = token<ExportManagementOperator>(
    "ExportManagementOperator"
);
