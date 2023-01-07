import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import { Knex } from "knex";
import { Logger } from "winston";
import { _ExportStatus_Values } from "../../proto/gen/ExportStatus";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { ImageListFilterOptions } from "../../proto/gen/ImageListFilterOptions";
import { BinaryConverter, BINARY_CONVERTER_TOKEN, ErrorWithStatus, LOGGER_TOKEN } from "../../utils";
import { KNEX_INSTANCE_TOKEN } from "./knex";

export class Export {
    constructor(
        public id: number,
        public requestedByUserId: number,
        public requestTime: number,
        public type: _ExportType_Values,
        public expireTime: number,
        public filterOptions: ImageListFilterOptions,
        public status: _ExportStatus_Values,
        public exportedFileFilename: string
    ) {}
}

export interface CreateExportArguments {
    requestedByUserId: number;
    requestTime: number;
    type: _ExportType_Values;
    expireTime: number;
    filterOptions: ImageListFilterOptions;
    status: _ExportStatus_Values;
    exportedFilename: string;
}

export interface ExportDataAccessor {
    createExport(args: CreateExportArguments): Promise<number>;
    getExportCount(requestedByUserId: number, requestTime: number): Promise<number>;
    getExportList(requestedByUserId: number, requestTime: number, offset: number, limit: number): Promise<Export[]>;
    getExport(id: number): Promise<Export | null>;
    getExportWithXLock(id: number): Promise<Export | null>;
    updateExport(exp: Export): Promise<void>;
    deleteExport(id: number): Promise<void>;
    deleteExpiredExportList(requestTime: number): Promise<void>;
    withTransaction<T>(executeFunc: (dm: ExportDataAccessor) => Promise<T>): Promise<T>;
}

const TabNameExportServiceExport = "export_service_export_tab";
const ColNameExportServiceExportExportId = "export_id";
const ColNameExportServiceExportRequestedByUserId = "requested_by_user_id";
const ColNameExportServiceExportRequestTime = "request_time";
const ColNameExportServiceExportType = "type";
const ColNameExportServiceExportExpireTime = "expire_time";
const ColNameExportServiceExportFilterOptions = "filter_options";
const ColNameExportServiceExportStatus = "status";
const ColNameExportServiceExportExportedFileFilename = "exported_file_filename";

export class ExportDataAccessorImpl implements ExportDataAccessor {
    constructor(
        private readonly knex: Knex<any, any[]>,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) {}

    public async createExport(args: CreateExportArguments): Promise<number> {
        try {
            const rows = await this.knex
                .insert({
                    [ColNameExportServiceExportRequestedByUserId]: args.requestedByUserId,
                    [ColNameExportServiceExportRequestTime]: args.requestTime,
                    [ColNameExportServiceExportType]: args.type,
                    [ColNameExportServiceExportExpireTime]: args.expireTime,
                    [ColNameExportServiceExportFilterOptions]: this.binaryConverter.toBuffer(args.filterOptions),
                    [ColNameExportServiceExportStatus]: args.status,
                    [ColNameExportServiceExportExportedFileFilename]: args.exportedFilename,
                })
                .returning([ColNameExportServiceExportExportId])
                .into(TabNameExportServiceExport);
            return +rows[0][ColNameExportServiceExportExportId];
        } catch (error) {
            this.logger.error("failed to create export", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async getExportCount(requestedByUserId: number, requestTime: number): Promise<number> {
        try {
            const rows = await this.knex
                .count()
                .from(TabNameExportServiceExport)
                .where(ColNameExportServiceExportRequestedByUserId, "=", requestedByUserId)
                .andWhere((qb) => {
                    qb.where(ColNameExportServiceExportExpireTime, "=", 0).orWhere(
                        ColNameExportServiceExportExpireTime,
                        ">=",
                        requestTime
                    );
                });
            return +(rows[0] as any)["count"];
        } catch (error) {
            this.logger.error("failed to get export count", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async getExportList(
        requestedByUserId: number,
        requestTime: number,
        offset: number,
        limit: number
    ): Promise<Export[]> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameExportServiceExport)
                .where(ColNameExportServiceExportRequestedByUserId, "=", requestedByUserId)
                .andWhere((qb) => {
                    qb.where(ColNameExportServiceExportExpireTime, "=", 0).orWhere(
                        ColNameExportServiceExportExpireTime,
                        ">=",
                        requestTime
                    );
                })
                .offset(offset)
                .limit(limit)
                .orderBy(ColNameExportServiceExportRequestTime, "desc");
            return rows.map((row) => this.getExportFromRow(row));
        } catch (error) {
            this.logger.error("failed to get export list", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async getExport(id: number): Promise<Export | null> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameExportServiceExport)
                .where(ColNameExportServiceExportExportId, "=", id);
            if (rows.length === 0) {
                this.logger.debug("no export with export_id found", {
                    exportId: id,
                });
                return null;
            }
            if (rows.length > 1) {
                this.logger.debug("more than one export with export_id found", {
                    exportId: id,
                });
                throw new ErrorWithStatus(`more than one export with export_id ${id} found`, status.INTERNAL);
            }
            return this.getExportFromRow(rows[0]);
        } catch (error) {
            this.logger.error("failed to get export", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async getExportWithXLock(id: number): Promise<Export | null> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameExportServiceExport)
                .where(ColNameExportServiceExportExportId, "=", id)
                .forUpdate();
            if (rows.length === 0) {
                this.logger.debug("no export with export_id found", {
                    exportId: id,
                });
                return null;
            }
            if (rows.length > 1) {
                this.logger.debug("more than one export with export_id found", {
                    exportId: id,
                });
                throw new ErrorWithStatus(`more than one export with export_id ${id} found`, status.INTERNAL);
            }
            return this.getExportFromRow(rows[0]);
        } catch (error) {
            this.logger.error("failed to get export", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async updateExport(exp: Export): Promise<void> {
        try {
            await this.knex
                .table(TabNameExportServiceExport)
                .update({
                    [ColNameExportServiceExportRequestedByUserId]: exp.requestedByUserId,
                    [ColNameExportServiceExportRequestTime]: exp.requestTime,
                    [ColNameExportServiceExportType]: exp.type,
                    [ColNameExportServiceExportExpireTime]: exp.expireTime,
                    [ColNameExportServiceExportFilterOptions]: this.binaryConverter.toBuffer(exp.filterOptions),
                    [ColNameExportServiceExportStatus]: exp.status,
                    [ColNameExportServiceExportExportedFileFilename]: exp.exportedFileFilename,
                })
                .where({
                    [ColNameExportServiceExportExportId]: exp.id,
                });
        } catch (error) {
            this.logger.error("failed to update export", { error });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async deleteExport(id: number): Promise<void> {
        try {
            const deleteCount = await this.knex
                .delete()
                .from(TabNameExportServiceExport)
                .where(ColNameExportServiceExportExportId, "=", id);
            if (deleteCount === 0) {
                this.logger.debug("no export with export_id found", {
                    exportId: id,
                });
                throw new ErrorWithStatus(`no export with export_id ${id} found`, status.NOT_FOUND);
            }
        } catch (error) {
            this.logger.error("failed to delete export", { error, exportId: id });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async deleteExpiredExportList(requestTime: number): Promise<void> {
        try {
            await this.knex
                .delete()
                .from(TabNameExportServiceExport)
                .where(ColNameExportServiceExportExpireTime, "<", requestTime);
        } catch (error) {
            this.logger.error("failed to delete expired export", { error, requestTime });
            throw ErrorWithStatus.wrapWithStatus(error, status.INTERNAL);
        }
    }

    public async withTransaction<T>(executeFunc: (dataAccessor: ExportDataAccessor) => Promise<T>): Promise<T> {
        return this.knex.transaction(async (tx) => {
            const txDataAccessor = new ExportDataAccessorImpl(tx, this.binaryConverter, this.logger);
            return executeFunc(txDataAccessor);
        });
    }

    private getExportFromRow(row: Record<string, any>): Export {
        const filterOptions = this.binaryConverter.fromBuffer(row[ColNameExportServiceExportFilterOptions]);
        return new Export(
            +row[ColNameExportServiceExportExportId],
            +row[ColNameExportServiceExportRequestedByUserId],
            +row[ColNameExportServiceExportRequestTime],
            +row[ColNameExportServiceExportType],
            +row[ColNameExportServiceExportExpireTime],
            filterOptions,
            +row[ColNameExportServiceExportStatus],
            row[ColNameExportServiceExportExportedFileFilename]
        );
    }
}

injected(ExportDataAccessorImpl, KNEX_INSTANCE_TOKEN, BINARY_CONVERTER_TOKEN, LOGGER_TOKEN);

export const EXPORT_DATA_ACCESSOR_TOKEN = token<ExportDataAccessor>("ExportDataAccessor");
