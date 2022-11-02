import { Container } from "brandi";
import { APPLICATION_CONFIG_TOKEN } from "./application";
import { CACHE_CONFIG_TOKEN } from "./cache";
import { ExportServiceConfig, EXPORT_SERVICE_CONFIG_TOKEN } from "./config";
import { DATABASE_CONFIG_TOKEN } from "./database";
import { DISTRIBUTED_CONFIG_TOKEN } from "./distributed";
import { ELASTICSEARCH_CONFIG_TOKEN } from "./elasticsearch";
import { GRPC_SERVER_CONFIG } from "./grpc_service";
import { IMAGE_SERVICE_CONFIG_TOKEN } from "./image_service";
import { KAFKA_CONFIG_TOKEN } from "./kafka";
import { LOG_CONFIG_TOKEN } from "./log";
import { S3_CONFIG_TOKEN } from "./s3";
import { USER_SERVICE_CONFIG_TOKEN } from "./user_service";

export * from "./log";
export * from "./cache";
export * from "./database";
export * from "./kafka";
export * from "./s3";
export * from "./image_service";
export * from "./user_service";
export * from "./grpc_service";
export * from "./application";
export * from "./distributed";
export * from "./elasticsearch";
export * from "./config";

export function bindToContainer(container: Container): void {
    container.bind(EXPORT_SERVICE_CONFIG_TOKEN).toInstance(ExportServiceConfig.fromEnv).inSingletonScope();
    container
        .bind(LOG_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).logConfig)
        .inSingletonScope();
    container
        .bind(CACHE_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).cacheConfig)
        .inSingletonScope();
    container
        .bind(DATABASE_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).databaseConfig)
        .inSingletonScope();
    container
        .bind(KAFKA_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).kafkaConfig)
        .inSingletonScope();
    container
        .bind(S3_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).s3Config)
        .inSingletonScope();
    container
        .bind(USER_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).userServiceConfig)
        .inSingletonScope();
    container
        .bind(IMAGE_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).imageServiceConfig)
        .inSingletonScope();
    container
        .bind(GRPC_SERVER_CONFIG)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).grpcServerConfig)
        .inSingletonScope();
    container
        .bind(DISTRIBUTED_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).distributedConfig)
        .inSingletonScope();
    container
        .bind(ELASTICSEARCH_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).elasticsearchConfig)
        .inSingletonScope();
    container
        .bind(APPLICATION_CONFIG_TOKEN)
        .toInstance(() => container.get(EXPORT_SERVICE_CONFIG_TOKEN).applicationConfig)
        .inSingletonScope();
}
