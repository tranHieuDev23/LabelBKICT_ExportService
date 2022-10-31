import { Container } from "brandi";
import { MINIO_CLIENT_TOKEN, newMinioClient } from "./minio";
import { initializeOriginalImageS3DM, ORIGINAL_IMAGE_S3_DM_TOKEN } from "./original_image";
import { initializeExportS3DM, EXPORT_S3_DM_TOKEN } from "./export";

export * from "./bucket_dm";
export * from "./original_image";
export * from "./export";

export function bindToContainer(container: Container): void {
    container.bind(MINIO_CLIENT_TOKEN).toInstance(newMinioClient).inSingletonScope();
    container.bind(ORIGINAL_IMAGE_S3_DM_TOKEN).toInstance(initializeOriginalImageS3DM).inSingletonScope();
    container.bind(EXPORT_S3_DM_TOKEN).toInstance(initializeExportS3DM).inSingletonScope();
}
