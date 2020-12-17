const { Kafka } = require("kafkajs");

const TOPICS = ["AUTHOR_REMOVED", "POST_ADDED"];

class KafkaProvider {
  static DEFAULT_GROUP_ID = "gr";
  _client;
  _io;

  getClient() {
    if (!this._client) {
      this._client = this.connect();
    }
    return this._client;
  }

  setIo(io) {
    this._io = io;
  }

  getIo() {
    if (!this._io) {
      throw new Error("Io was not set");
    }
    return this._io;
  }

  /**
   * @param {string} groupId
   * @param {string} eventName
   * @param {({topic, partition, message }) => void} eachMessage
   * @memberof KafkaProvider
   */
  async run() {
    const consumer = this.getClient().consumer({
      sessionTimeout: 180000,
      heartbeatInterval: 5000,
      groupId: KafkaProvider.DEFAULT_GROUP_ID,
    });
    await consumer.connect();
    // await consumer.commitOffsets([
    //   { topic: "POST_ADDED", partition: 0, offset: 18 },
    // ]);
    for await (let topic of TOPICS) {
      console.log("\x1b[41m!!!!!! checking topic \x1b[0m", topic);
      consumer.subscribe({
        topic,
        fromBeginning: false,
      });
    }
    consumer.run({
      autoCommitInterval: 5000,
      eachMessage: async ({ topic, partition, message }) => {
        console.log(
          "\x1b[41m!!!!!! NEW MESSAGE  TOPIC PARTITION MESSAGE \x1b[0m",
          topic,
          partition,
          message.value.toString()
        );

        try {
          const data = JSON.parse(JSON.stringify(message.value.toString()));
          console.log("\x1b[41m!!!!!! EMIT \x1b[0m", data);
          this.getIo().emit(data.event, {
            ...data,
            // /            timestamp: id.split("-")[0],
          });
        } catch (e) {
          console.log("\x1b[41m!!!!!! ERROR \x1b[0m", e);
          console.error(e);
          throw new Error(e);
        }
      },
    });
    consumer.seek({ topic: 'POST_ADDED', partition: 0, offset: 23 })
  }

  /**
   * NOT USED
   *
   * @param {string} groupId
   * @param {string} eventName
   * @param {({topic, partition, message }) => void} eachMessage
   * @memberof KafkaProvider
   */
  async subscribe(eventName, eachMessage) {
    const consumer = this.getClient().consumer({
      groupId: KafkaProvider.DEFAULT_GROUP_ID,
    });
    await consumer.connect();
    console.log("\x1b[41m!!!!!! subscribing to topic \x1b[0m", eventName);
    await consumer.subscribe({
      topic: eventName,
      fromBeginning: true,
    });
    await consumer.run({
      eachMessage,
    });
  }

  async getProducer() {
    const producer = this.getClient().producer();
    await producer.connect();
    return producer;
  }

  /**
   * @param {string} eventName
   * @param {string} value
   * @returns
   * @memberof KafkaProvider
   */
  async produce(eventName, value) {
    const producer = await this.getProducer();
    await producer.send({
      topic: eventName,
      messages: [{ value }],
    });
    return this;
  }

  connect() {
    const kafkaPort = process.env.KAFKA_BROKER_PORT || 9092;
    const kafkaConfig = {
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [`localhost:${kafkaPort}`],
    };
    const kafka = new Kafka(kafkaConfig);

    return kafka;
  }
}

module.exports = {
  kafka: new KafkaProvider(),
};
