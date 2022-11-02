import { injected, token } from "brandi";
import { Region as RegionProto } from "../../proto/gen/Region";
import { RegionLabel as RegionLabelProto } from "../../proto/gen/RegionLabel";
import { Polygon as PolygonProto } from "../../proto/gen/Polygon";
import { Polygon, RegionLabel, User, Vertex } from "./dataset_metadata_models";
import {
    UserIdToUserConverter,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export class Region {
    constructor(
        public id: number,
        public drawn_by_user: User | null,
        public labeled_by_user: User | null,
        public border: Polygon,
        public holes: Polygon[],
        public label: RegionLabel | null
    ) {}
}

export interface RegionProtoToRegionConverter {
    convert(regionProto: RegionProto | undefined): Promise<Region>;
}

export class RegionProtoToRegionConverterImpl
    implements RegionProtoToRegionConverter
{
    constructor(
        private readonly userIdToUserConverter: UserIdToUserConverter
    ) {}

    public async convert(
        regionProto: RegionProto | undefined
    ): Promise<Region> {
        const regionId = regionProto?.id || 0;
        const drawnByUser = await this.userIdToUserConverter.convert(
            regionProto?.drawnByUserId
        );
        const labeledByUser = await this.userIdToUserConverter.convert(
            regionProto?.labeledByUserId
        );
        const border = regionProto?.border
            ? this.polygonProtoToPolygon(regionProto.border)
            : new Polygon([]);
        const holes =
            regionProto?.holes?.map((hole) =>
                this.polygonProtoToPolygon(hole)
            ) || [];
        const label = regionProto?.label
            ? this.regionLabelProtoToRegionLabel(regionProto.label)
            : null;

        return new Region(
            regionId,
            drawnByUser,
            labeledByUser,
            border,
            holes,
            label
        );
    }

    private polygonProtoToPolygon(polygon: PolygonProto): Polygon {
        const vertices = (polygon.vertices || []).map(
            (vertexProto) =>
                new Vertex(+(vertexProto.x || 0), +(vertexProto.y || 0))
        );
        return new Polygon(vertices);
    }

    private regionLabelProtoToRegionLabel(
        regionLabel: RegionLabelProto
    ): RegionLabel {
        return new RegionLabel(
            regionLabel.id || 0,
            regionLabel.displayName || "",
            regionLabel.color || ""
        );
    }
}

injected(RegionProtoToRegionConverterImpl, USER_ID_TO_USER_CONVERTER_TOKEN);

export const REGION_PROTO_TO_REGION_CONVERTER_TOKEN =
    token<RegionProtoToRegionConverter>("RegionProtoToRegionConverter");
