import { token } from "brandi";

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export class ApplicationConfig {
    public exportDir = "exports";
    public exportExpireTime = ONE_WEEK;

    public static fromEnv(): ApplicationConfig {
        const config = new ApplicationConfig();
        if (process.env.EXPORT_DIR !== undefined) {
            config.exportDir = process.env.EXPORT_DIR;
        }
        if (process.env.EXPORT_EXPIRE_TIME !== undefined) {
            config.exportExpireTime = +process.env.EXPORT_EXPIRE_TIME;
        }
        return config;
    }
}

export const APPLICATION_CONFIG_TOKEN =
    token<ApplicationConfig>("ApplicationConfig");
