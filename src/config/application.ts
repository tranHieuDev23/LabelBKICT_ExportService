import { token } from "brandi";

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export class ApplicationConfig {
    public originalImageDir = "originals";
    public exportDir = "exports";
    public exportExpireTime = ONE_WEEK;
    public getImageListBatchSize = 100;

    public static fromEnv(): ApplicationConfig {
        const config = new ApplicationConfig();
        if (process.env.EXPORT_ORIGINAL_IMAGE_DIR !== undefined) {
            config.originalImageDir = process.env.EXPORT_ORIGINAL_IMAGE_DIR;
        }
        if (process.env.EXPORT_DIR !== undefined) {
            config.exportDir = process.env.EXPORT_DIR;
        }
        if (process.env.EXPORT_EXPIRE_TIME !== undefined) {
            config.exportExpireTime = +process.env.EXPORT_EXPIRE_TIME;
        }
        if (process.env.EXPORT_GET_IMAGE_LIST_BATCH_SIZE !== undefined) {
            config.getImageListBatchSize =
                +process.env.EXPORT_GET_IMAGE_LIST_BATCH_SIZE;
        }
        return config;
    }
}

export const APPLICATION_CONFIG_TOKEN =
    token<ApplicationConfig>("ApplicationConfig");
