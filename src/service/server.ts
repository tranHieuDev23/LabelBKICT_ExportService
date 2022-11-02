import {
    loadPackageDefinition,
    Server,
    ServerCredentials,
} from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import {
    ExportServiceHandlersFactory,
    EXPORT_SERVICE_HANDLERS_FACTORY_TOKEN,
} from "./handler";
import { GRPCServerConfig, GRPC_SERVER_CONFIG } from "../config";
import { ProtoGrpcType } from "../proto/gen/export_service";
import { Logger } from "winston";
import { LOGGER_TOKEN } from "../utils";

export class ExportServiceGRPCServer {
    constructor(
        private readonly handlerFactory: ExportServiceHandlersFactory,
        private readonly grpcServerConfig: GRPCServerConfig,
        private readonly logger: Logger
    ) {}

    public loadProtoAndStart(protoPath: string): void {
        const exportServiceProtoGrpc =
            this.loadExportServiceProtoGrpc(protoPath);

        const server = new Server();
        server.addService(
            exportServiceProtoGrpc.ExportService.service,
            this.handlerFactory.getExportServiceHandlers()
        );

        server.bindAsync(
            `0.0.0.0:${this.grpcServerConfig.port}`,
            ServerCredentials.createInsecure(),
            (error, port) => {
                if (error) {
                    this.logger.error("failed to start grpc server", { error });
                    return;
                }

                console.log(`starting grpc server, listening to port ${port}`);
                this.logger.info("starting grpc server", { port });
                server.start();
            }
        );
    }

    private loadExportServiceProtoGrpc(protoPath: string): ProtoGrpcType {
        const packageDefinition = loadSync(protoPath, {
            keepCase: false,
            enums: Number,
            defaults: false,
            oneofs: true,
        });
        const exportServicePackageDefinition = loadPackageDefinition(
            packageDefinition
        ) as unknown;
        return exportServicePackageDefinition as ProtoGrpcType;
    }
}

injected(
    ExportServiceGRPCServer,
    EXPORT_SERVICE_HANDLERS_FACTORY_TOKEN,
    GRPC_SERVER_CONFIG,
    LOGGER_TOKEN
);

export const EXPORT_SERVICE_GRPC_SERVER_TOKEN = token<ExportServiceGRPCServer>(
    "ExportServiceGRPCServer"
);
