import { injected, token } from "brandi";
import { UserInfoProvider, USER_INFO_PROVIDER_TOKEN } from "../info_providers";
import { User } from "./dataset_metadata_models";

export interface UserIdToUserConverter {
    convert(userId: number | undefined): Promise<User | null>;
}

export class UserIdToUserConverterImpl implements UserIdToUserConverter {
    constructor(private readonly userInfoProvider: UserInfoProvider) {}

    public async convert(userId: number | undefined): Promise<User | null> {
        if (userId === undefined || userId === 0) {
            return null;
        }
        const userProto = await this.userInfoProvider.getUser(userId);
        if (userProto === null) {
            return null;
        }
        return new User(
            userProto.id || 0,
            userProto.username || "",
            userProto.displayName || ""
        );
    }
}

injected(UserIdToUserConverterImpl, USER_INFO_PROVIDER_TOKEN);

export const USER_ID_TO_USER_CONVERTER_TOKEN = token<UserIdToUserConverter>(
    "UserIdToUserConverter"
);
