import { join } from "path";
import { injected, token } from "brandi";
import { Workbook, Worksheet } from "exceljs";
import { Image as ImageProto } from "../../proto/gen/Image";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";
import { ImageTag as ImageTagProto } from "../../proto/gen/ImageTag";
import { Region as RegionProto } from "../../proto/gen/Region";
import { IdGenerator, ID_GENERATOR_TOKEN, Timer, TIMER_TOKEN } from "../../utils";
import { UserInfoProvider, USER_INFO_PROVIDER_TOKEN } from "../info_providers";

export interface ExcelExporterArguments {
    exportedFileDirectory: string;
    imageList: ImageProto[];
    imageTagList: ImageTagProto[][];
    regionList: RegionProto[][];
    regionSnapshotListAtPublishTime: RegionProto[][];
    regionSnapshotListAtVerifyTime: RegionProto[][];
}

export interface ExcelExporter {
    generateExportFile(args: ExcelExporterArguments): Promise<string>;
}

const EXCEL_COLUMN_LIST = [
    {
        header: "Original file name",
        key: "originalFilename",
        width: 40,
    },
    {
        header: "File name in dataset",
        key: "exportedFilename",
        width: 40,
    },
    {
        header: "Uploaded by",
        key: "uploadedByUser",
        width: 25,
    },
    {
        header: "Upload time",
        key: "uploadTime",
        width: 25,
    },
    {
        header: "Published by",
        key: "publishedByUser",
        width: 25,
    },
    {
        header: "Publish time",
        key: "publishTime",
        width: 25,
    },
    {
        header: "Verified by",
        key: "verifiedByUser",
        width: 25,
    },
    {
        header: "Verify time",
        key: "verifyTime",
        width: 25,
    },
    {
        header: "Image type",
        key: "imageType",
        width: 20,
    },
    {
        header: "Status",
        key: "status",
        width: 20,
    },
    {
        header: "Labels in image",
        key: "regionLabels",
        width: 40,
    },
    {
        header: "Labels in image at publish time",
        key: "regionLabelsAtPublishTime",
        width: 40,
    },
    {
        header: "Labels in image at verify time",
        key: "regionLabelsAtVerifyTime",
        width: 40,
    },
    {
        header: "Tags",
        key: "tags",
        width: 40,
    },
    {
        header: "Description",
        key: "description",
        width: 50,
    },
];

export class ExcelExporterImpl implements ExcelExporter {
    constructor(
        private readonly userInfoProvider: UserInfoProvider,
        private readonly timer: Timer,
        private readonly idGenerator: IdGenerator
    ) {}

    public async generateExportFile(args: ExcelExporterArguments): Promise<string> {
        const { imageList, imageTagList, regionList, regionSnapshotListAtPublishTime, regionSnapshotListAtVerifyTime } =
            args;

        const exportedFileName = await this.getExportedFileName();
        const { workbook, worksheet } = this.getImageInformationWorkbook();
        for (let i = 0; i < imageList.length; i++) {
            const row = await this.imageToWorkbookRow(
                imageList[i],
                imageTagList[i],
                regionList[i],
                regionSnapshotListAtPublishTime[i],
                regionSnapshotListAtVerifyTime[i]
            );
            worksheet.addRow(row);
        }

        const exportedFilePath = join(args.exportedFileDirectory, exportedFileName);
        await workbook.xlsx.writeFile(exportedFilePath);
        return exportedFileName;
    }

    private async getExportedFileName(): Promise<string> {
        const currentTime = this.timer.getCurrentTime();
        const id = await this.idGenerator.generate();
        return `Dataset Information-${currentTime}-${id}.xlsx`;
    }

    private getImageInformationWorkbook(): {
        workbook: Workbook;
        worksheet: Worksheet;
    } {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet("Dataset Information");
        worksheet.columns = EXCEL_COLUMN_LIST;
        return { workbook, worksheet };
    }

    private async imageToWorkbookRow(
        image: ImageProto,
        imageTagProtoList: ImageTagProto[],
        regionProtoList: RegionProto[],
        regionProtoListAtPublishTime: RegionProto[],
        regionProtoListAtVerifyTime: RegionProto[]
    ): Promise<any> {
        const originalFilename = image.originalFileName || "";
        const exportedFilename = this.getImageExportedFilename(image.id || 0);
        const uploadedByUser = image.uploadedByUserId
            ? await this.userInfoProvider.getUser(image.uploadedByUserId || 0)
            : null;
        const uploadTime = new Date(+(image.uploadTime || 0));
        const publishedByUser = image.publishedByUserId
            ? await this.userInfoProvider.getUser(image.publishedByUserId || 0)
            : null;
        const publishTime = new Date(+(image.publishTime || 0));
        const verifiedByUser = image.verifiedByUserId
            ? await this.userInfoProvider.getUser(image.verifiedByUserId || 0)
            : null;
        const verifyTime = new Date(+(image.verifyTime || 0));
        const imageType = image.imageType?.displayName || "No type";
        const status = this.getImageStatusString(image.status);
        const regionLabels = regionProtoList
            .filter((region) => region.label)
            .map((region) => region.label?.displayName)
            .join(", ");
        const regionLabelsAtPublishTime = regionProtoListAtPublishTime
            .filter((region) => region.label)
            .map((region) => region.label?.displayName)
            .join(", ");
        const regionLabelsAtVerifyTime = regionProtoListAtVerifyTime
            .filter((region) => region.label)
            .map((region) => region.label?.displayName)
            .join(", ");
        const tags = imageTagProtoList.map((imageTag) => imageTag.displayName).join(", ");
        const description = image.description;
        return {
            originalFilename,
            exportedFilename,
            uploadedByUser: uploadedByUser?.displayName || "",
            uploadTime: uploadTime.toLocaleString(),
            publishedByUser: publishedByUser?.displayName || "",
            publishTime: publishedByUser ? publishTime.toLocaleString() : "",
            verifiedByUser: verifiedByUser?.displayName || "",
            verifyTime: verifiedByUser ? verifyTime.toLocaleString() : "",
            imageType,
            status,
            regionLabels,
            regionLabelsAtPublishTime,
            regionLabelsAtVerifyTime,
            tags,
            description,
        };
    }

    private getImageExportedFilename(imageId: number): string {
        return `${imageId}.jpeg`;
    }

    private getImageStatusString(status: _ImageStatus_Values | keyof typeof _ImageStatus_Values | undefined): string {
        switch (status) {
            case _ImageStatus_Values.UPLOADED:
            case "UPLOADED":
                return "Uploaded";
            case _ImageStatus_Values.PUBLISHED:
            case "PUBLISHED":
                return "Published";
            case _ImageStatus_Values.VERIFIED:
            case "VERIFIED":
                return "Verified";
            case _ImageStatus_Values.EXCLUDED:
            case "EXCLUDED":
                return "Excluded";
            default:
                return "";
        }
    }
}

injected(ExcelExporterImpl, USER_INFO_PROVIDER_TOKEN, TIMER_TOKEN, ID_GENERATOR_TOKEN);

export const EXCEL_EXPORTER_TOKEN = token<ExcelExporter>("ExcelExporter");
