import { token } from "brandi";

export class ImageServiceConfig {
    public protoPath = "./src/proto/dependencies/image_service.proto";
    public host = "127.0.0.1";
    public port = 20001;

    public static fromEnv(): ImageServiceConfig {
        const config = new ImageServiceConfig();
        if (process.env.IMAGE_SERVICE_PROTO_PATH !== undefined) {
            config.protoPath = process.env.IMAGE_SERVICE_PROTO_PATH;
        }
        if (process.env.IMAGE_SERVICE_HOST !== undefined) {
            config.host = process.env.IMAGE_SERVICE_HOST;
        }
        if (process.env.IMAGE_SERVICE_PORT !== undefined) {
            config.port = +process.env.IMAGE_SERVICE_PORT;
        }
        return config;
    }
}

export const IMAGE_SERVICE_CONFIG_TOKEN = token<ImageServiceConfig>("ImageServiceConfig");
