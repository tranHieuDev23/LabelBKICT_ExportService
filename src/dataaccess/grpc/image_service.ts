import { loadPackageDefinition, credentials } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import { ImageServiceConfig, IMAGE_SERVICE_CONFIG_TOKEN } from "../../config";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ProtoGrpcType } from "../../proto/gen/image_service";

export function getImageServiceDM(
    ImageServiceConfig: ImageServiceConfig
): ImageServiceClient {
    const ImageServiceProtoGrpc = loadImageServiceProtoGrpc(
        ImageServiceConfig.protoPath
    );
    return new ImageServiceProtoGrpc.ImageService(
        `${ImageServiceConfig.host}:${ImageServiceConfig.port}`,
        credentials.createInsecure()
    );
}

function loadImageServiceProtoGrpc(protoPath: string): ProtoGrpcType {
    const packageDefinition = loadSync(protoPath, {
        keepCase: false,
        enums: String,
        defaults: false,
        oneofs: true,
    });
    const ImageServicePackageDefinition = loadPackageDefinition(
        packageDefinition
    ) as unknown;
    return ImageServicePackageDefinition as ProtoGrpcType;
}

injected(getImageServiceDM, IMAGE_SERVICE_CONFIG_TOKEN);

export const IMAGE_SERVICE_DM_TOKEN =
    token<ImageServiceClient>("ImageServiceClient");
