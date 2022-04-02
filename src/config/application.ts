import { token } from "brandi";

export class ApplicationConfig {
    public exportDir = "exports";

    public static fromEnv(): ApplicationConfig {
        const config = new ApplicationConfig();
        if (process.env.EXPORT_DIR !== undefined) {
            config.exportDir = process.env.EXPORT_DIR;
        }
        return config;
    }
}

export const APPLICATION_CONFIG_TOKEN =
    token<ApplicationConfig>("ApplicationConfig");
