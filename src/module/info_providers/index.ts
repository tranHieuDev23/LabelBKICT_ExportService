import { Container } from "brandi";
import {
    UserInfoProviderImpl,
    USER_INFO_PROVIDER_TOKEN,
} from "./user_info_provider";

export * from "./user_info_provider";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_INFO_PROVIDER_TOKEN)
        .toInstance(UserInfoProviderImpl)
        .inSingletonScope();
}
