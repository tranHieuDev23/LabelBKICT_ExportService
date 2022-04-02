import { Knex } from "knex";

const TabNameExportServiceExport = "export_service_export_tab";

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TabNameExportServiceExport))) {
        await knex.schema.createTable(TabNameExportServiceExport, (tab) => {
            tab.increments("export_id", { primaryKey: true });
            tab.integer("requested_by_user_id").notNullable();
            tab.bigInteger("request_time").notNullable();
            tab.smallint("type").notNullable();
            tab.bigInteger("expire_time").notNullable();
            tab.binary("filter_options").notNullable();
            tab.smallint("status").notNullable();
            tab.string("exported_file_filename", 256).notNullable();

            tab.index(
                ["requested_by_user_id", "request_time"],
                "export_service_export_requested_by_user_id_request_time_idx"
            );
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable(TabNameExportServiceExport);
}
