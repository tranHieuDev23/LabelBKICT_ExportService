import { injected, token } from "brandi";
import { Logger } from "winston";
import { Image as ImageProto } from "../../proto/gen/Image";
import { ImageType as ImageTypeProto } from "../../proto/gen/ImageType";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";
import { LOGGER_TOKEN } from "../../utils";
import {
    UserIdToUserConverter,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";
import { Image, ImageStatus, ImageType } from "./dataset_metadata_models";

export interface ImageProtoToImageConverter {
    convert(imageProto: ImageProto): Promise<Image>;
}

export class ImageProtoToImageConverterImpl
    implements ImageProtoToImageConverter
{
    constructor(
        private readonly userIdToUserConverter: UserIdToUserConverter,
        private readonly logger: Logger
    ) {}

    public async convert(imageProto: ImageProto): Promise<Image> {
        const imageId = imageProto.id || 0;
        const uploadedByUser = await this.userIdToUserConverter.convert(
            imageProto.uploadedByUserId
        );
        if (uploadedByUser === null) {
            throw new Error("image has no uploader");
        }
        const uploadTime = +(imageProto.uploadTime || 0);
        const publishedByUser = await this.userIdToUserConverter.convert(
            imageProto.publishedByUserId
        );
        const publishTime = +(imageProto.publishTime || 0);
        const verifiedByUser = await this.userIdToUserConverter.convert(
            imageProto.verifiedByUserId
        );
        const verifyTime = +(imageProto.verifyTime || 0);
        const originalFileName = imageProto.originalFileName || "";
        const description = imageProto.description || "";
        const imageType = imageProto.imageType
            ? this.imageTypeProtoToImageType(imageProto.imageType)
            : null;
        const imageStatus = this.statusProtoToStatus(imageProto.status);

        return new Image(
            imageId,
            uploadedByUser,
            uploadTime,
            publishedByUser,
            publishTime,
            verifiedByUser,
            verifyTime,
            originalFileName,
            description,
            imageType,
            imageStatus
        );
    }

    private imageTypeProtoToImageType(imageType: ImageTypeProto): ImageType {
        return new ImageType(imageType.id || 0, imageType.displayName || "");
    }

    private statusProtoToStatus(
        status:
            | _ImageStatus_Values
            | keyof typeof _ImageStatus_Values
            | undefined
    ): ImageStatus {
        switch (status) {
            case _ImageStatus_Values.UPLOADED:
            case "UPLOADED":
                return ImageStatus.UPLOADED;
            case _ImageStatus_Values.PUBLISHED:
            case "PUBLISHED":
                return ImageStatus.PUBLISHED;
            case _ImageStatus_Values.VERIFIED:
            case "VERIFIED":
                return ImageStatus.VERIFIED;
            case _ImageStatus_Values.EXCLUDED:
            case "EXCLUDED":
                return ImageStatus.EXCLUDED;
            default:
                this.logger.error("invalid image status", { status });
                throw new Error(`Invalid image status ${status}`);
        }
    }
}

injected(
    ImageProtoToImageConverterImpl,
    USER_ID_TO_USER_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN =
    token<ImageProtoToImageConverter>("ImageProtoToImageConverter");
