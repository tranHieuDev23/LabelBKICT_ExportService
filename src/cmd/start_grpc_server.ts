import { Container } from "brandi";
import dotenv from "dotenv";
import * as utils from "../utils";
import * as config from "../config";
import * as grpc from "../dataaccess/grpc";
import * as db from "../dataaccess/db";
import * as modules from "../module";
import * as service from "../service";

export function startGRPCServer(dotenvPath: string) {
    dotenv.config({
        path: dotenvPath,
    });

    const container = new Container();
    utils.bindToContainer(container);
    config.bindToContainer(container);
    grpc.bindToContainer(container);
    db.bindToContainer(container);
    modules.bindToContainer(container);
    service.bindToContainer(container);

    const server = container.get(service.EXPORT_SERVICE_GRPC_SERVER_TOKEN);
    server.loadProtoAndStart("./src/proto/service/export_service.proto");
}
