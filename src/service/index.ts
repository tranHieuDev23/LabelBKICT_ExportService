import { Container } from "brandi";
import {
    ExportServiceHandlersFactory,
    EXPORT_SERVICE_HANDLERS_FACTORY_TOKEN,
} from "./handler";
import {
    ExportServiceGRPCServer,
    EXPORT_SERVICE_GRPC_SERVER_TOKEN,
} from "./server";

export * from "./handler";
export * from "./server";

export function bindToContainer(container: Container): void {
    container
        .bind(EXPORT_SERVICE_HANDLERS_FACTORY_TOKEN)
        .toInstance(ExportServiceHandlersFactory)
        .inSingletonScope();
    container
        .bind(EXPORT_SERVICE_GRPC_SERVER_TOKEN)
        .toInstance(ExportServiceGRPCServer)
        .inSingletonScope();
}
