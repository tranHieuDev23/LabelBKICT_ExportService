import { program } from "commander";
import { startGRPCServer } from "./cmd/start_grpc_server";
import { startKafkaConsumer } from "./cmd/start_kafka_consumer";

program.command("start_grpc_server").action(() => startGRPCServer(".env"));
program
    .command("start_kafka_consumer")
    .action(() => startKafkaConsumer(".env"));

program.parse();
