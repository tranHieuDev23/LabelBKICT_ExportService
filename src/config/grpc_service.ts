import { token } from "brandi";

export class GRPCServerConfig {
    public port = 20002;

    public static fromEnv(): GRPCServerConfig {
        const config = new GRPCServerConfig();
        if (process.env.EXPORT_SERVICE_PORT !== undefined) {
            config.port = +process.env.EXPORT_SERVICE_PORT;
        }
        return config;
    }
}

export const GRPC_SERVER_CONFIG = token<GRPCServerConfig>("GRPCServerConfig");
