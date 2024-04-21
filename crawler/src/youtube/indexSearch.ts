import {PrismaClient} from "@prisma/client"
import {searchYoutube} from "./searchYoutube"
import {createClient} from "redis"
import {io} from "socket.io-client"

import {Kafka, Partitioners, Producer} from "kafkajs"
import * as config from "../config/keys.config"
const prisma = new PrismaClient()
const socket = io(config.default.apiServer || "http://localhost:8000", {
  path: "/ws",
  auth: {
    token: config.default.socketSecretToken,
  },
})

socket.on("disconnect", () => {
  console.log(`Client disconnected`)
})

socket.on("connect_error", (e) => {
  console.log("Connect error: ", e)
})
const redisClient = createClient({
  url: config.default.redisUrl,
})
redisClient.on("error", (err) => console.log("Redis Client Error", err))
let kafka = null
let producer: Producer = null

if (config.default.useKafka) {
  kafka = new Kafka({
    clientId: "website",
    brokers: [`${config.default.severIP}:29092`],
  })

  producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner})
}
const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
async function main() {
  try {
    let listTopics = await prisma.topics.findMany({
      where: {
        isActiveCrawl: true,
      },

      orderBy: {
        nextSearchYoutubeAt: "asc",
      },
    })
    for (const topic of listTopics) {
      if (topic.nextSearchYoutubeAt < new Date()) {
        await searchYoutube(prisma, redisClient, socket, listTopics, topic, producer)
      } else {
        break
      }
    }
  } catch (error) {
    console.log("Error when search google:", error)
  }
}
;(async () => {
  if (config.default.useKafka) {
    await producer.connect()
  }
  await redisClient.connect()
  try {
    while (true) {
      await main()
      await sleep(15 * 1000)
    }
  } catch (error) {
    await redisClient.disconnect()
    console.log("Error in while loop searchYoutube: ", error)
  }
})()
