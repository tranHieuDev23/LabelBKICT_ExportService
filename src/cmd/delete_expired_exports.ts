import { Container } from "brandi";
import dotenv from "dotenv";
import * as utils from "../utils";
import * as config from "../config";
import * as db from "../dataaccess/db";
import * as elasticsearch from "../dataaccess/elasticsearch";
import * as kafka from "../dataaccess/kafka";
import * as s3 from "../dataaccess/s3";
import * as modules from "../module";
import * as jobs from "../jobs";

export function deleteExpiredExports(dotenvPath: string) {
    dotenv.config({
        path: dotenvPath,
    });

    const container = new Container();
    utils.bindToContainer(container);
    config.bindToContainer(container);
    db.bindToContainer(container);
    elasticsearch.bindToContainer(container);
    kafka.bindToContainer(container);
    s3.bindToContainer(container);
    modules.bindToContainer(container);
    jobs.bindToContainer(container);

    const job = container.get(jobs.DELETE_EXPIRED_EXPORTS_JOB_TOKEN);
    job.execute().then(() => {
        process.exit();
    });
}
