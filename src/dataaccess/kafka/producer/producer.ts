import { injected, token } from "brandi";
import { Kafka, KafkaConfig, Producer } from "kafkajs";
import { KAFKA_CONFIG_TOKEN } from "../../../config";
import { KAFKA_INSTANCE_TOKEN } from "../kafka";

export function getKafkaProducer(kafka: Kafka, config: KafkaConfig): Producer {
    return kafka.producer();
}

injected(getKafkaProducer, KAFKA_INSTANCE_TOKEN, KAFKA_CONFIG_TOKEN);

export const KAFKA_PRODUCER_TOKEN = token<Producer>("Producer");
