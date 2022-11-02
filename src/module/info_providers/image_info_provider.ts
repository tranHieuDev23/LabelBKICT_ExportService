import { ImageListFilterOptions } from "../../proto/gen/ImageListFilterOptions";
import { Image } from "../../proto/gen/Image";
import { ImageTag } from "../../proto/gen/ImageTag";
import { Region } from "../../proto/gen/Region";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import { Logger } from "winston";
import { LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import { _ImageListSortOrder_Values } from "../../proto/gen/ImageListSortOrder";
import { injected, token } from "brandi";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";

export interface ImageInfoProvider {
    getImageList(
        filterOptions: ImageListFilterOptions
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][]; regionList: Region[][] }>;
    getRegionSnapshotListAtStatus(imageId: number, atStatus: _ImageStatus_Values): Promise<Region[]>;
}

export class ImageInfoProviderImpl implements ImageInfoProvider {
    constructor(
        private readonly imageServiceDM: ImageServiceClient,
        private readonly applicationConfig: ApplicationConfig,
        private readonly logger: Logger
    ) {}

    public async getImageList(
        filterOptions: ImageListFilterOptions
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][]; regionList: Region[][] }> {
        const imageList: Image[] = [];
        const imageTagList: ImageTag[][] = [];
        const regionList: Region[][] = [];

        for (let currentOffset = 0; ; currentOffset = imageList.length) {
            const { error: getImageListError, response: getImageListResponse } = await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                {
                    sortOrder: _ImageListSortOrder_Values.ID_ASCENDING,
                    filterOptions: filterOptions,
                    offset: currentOffset,
                    limit: this.applicationConfig.getImageListBatchSize,
                    withImageTag: true,
                    withRegion: true,
                }
            );
            if (getImageListError !== null) {
                this.logger.error("failed to call image_list.getImageList()", { error: getImageListError });
                throw getImageListError;
            }

            const batchImageList = getImageListResponse?.imageList || [];
            if (batchImageList.length === 0) {
                break;
            }

            imageList.push(...batchImageList);

            getImageListResponse?.imageTagListOfImageList?.forEach((batchImageTagList) => {
                imageTagList.push(batchImageTagList.imageTagList || []);
            });

            getImageListResponse?.regionListOfImageList?.forEach((batchRegionList) => {
                regionList.push(batchRegionList.regionList || []);
            });
        }

        return { imageList, imageTagList, regionList };
    }

    public async getRegionSnapshotListAtStatus(imageId: number, atStatus: _ImageStatus_Values): Promise<Region[]> {
        const { error: getRegionSnapshotListOfImageError, response: getRegionSnapshotListOfImageResponse } =
            await promisifyGRPCCall(this.imageServiceDM.getRegionSnapshotListOfImage.bind(this.imageServiceDM), {
                ofImageId: imageId,
                atStatus: atStatus,
            });
        if (getRegionSnapshotListOfImageError !== null) {
            this.logger.error("failed to call image_list.getImageList()", { error: getRegionSnapshotListOfImageError });
            throw getRegionSnapshotListOfImageError;
        }

        return getRegionSnapshotListOfImageResponse?.regionList || [];
    }
}

injected(ImageInfoProviderImpl, IMAGE_SERVICE_DM_TOKEN, APPLICATION_CONFIG_TOKEN, LOGGER_TOKEN);

export const IMAGE_INFO_PROVIDER_TOKEN = token<ImageInfoProvider>("ImageInfoProvider");
