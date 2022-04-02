export class User {
    constructor(
        public readonly id: number,
        public readonly username: string,
        public readonly display_name: string
    ) {}
}

export class ImageType {
    constructor(public id: number, public display_name: string) {}
}

export enum ImageStatus {
    UPLOADED = 0,
    PUBLISHED = 1,
    VERIFIED = 2,
    EXCLUDED = 3,
}

export class Image {
    constructor(
        public id: number,
        public uploaded_by_user: User,
        public upload_time: number,
        public published_by_user: User | null,
        public publish_time: number,
        public verified_by_user: User | null,
        public verify_time: number,
        public original_file_name: string,
        public description: string,
        public image_type: ImageType | null,
        public status: ImageStatus
    ) {}
}

export class ImageTag {
    constructor(public id: number, public display_name: string) {}
}

export class Vertex {
    constructor(public x: number, public y: number) {}
}

export class Polygon {
    constructor(public vertices: Vertex[]) {}
}

export class RegionLabel {
    constructor(
        public id: number,
        public display_name: string,
        public color: string
    ) {}
}

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
