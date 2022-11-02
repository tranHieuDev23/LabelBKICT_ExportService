import { injected, token } from "brandi";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../config";
import { BucketDM, EXPORT_S3_DM_TOKEN } from "../dataaccess/s3";
import { S3MigrationOperator, S3_MIGRATION_OPERATOR_TOKEN } from "../module/s3_migration/s3_migration_operator";

export interface MigrateFilesToS3Job {
    execute(): Promise<void>;
}

export class MigrateFilesToS3JobImpl {
    constructor(
        private readonly exportS3DM: BucketDM,
        private readonly s3MigrationOperator: S3MigrationOperator,
        private readonly applicationConfig: ApplicationConfig
    ) {}

    public async execute(): Promise<void> {
        await this.exportS3DM.createBucketIfNotExist();
        await this.s3MigrationOperator.migrateFilesToS3(this.applicationConfig.exportDir, this.exportS3DM);
    }
}

injected(MigrateFilesToS3JobImpl, EXPORT_S3_DM_TOKEN, S3_MIGRATION_OPERATOR_TOKEN, APPLICATION_CONFIG_TOKEN);

export const MIGRATE_FILES_TO_S3_JOBS_TOKEN = token<MigrateFilesToS3Job>("MigrateFilesToS3Job");
