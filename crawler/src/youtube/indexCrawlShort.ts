import {PrismaClient, STATUS, SOURCE_TYPE} from "@prisma/client"
import {io} from "socket.io-client"
import {createClient} from "redis"
import {crawlChannelShort} from "./crawlChannelShort"

import {Kafka, Producer, Partitioners} from "kafkajs"
import * as config from "../config/keys.config"

let kafka = null
let producer: Producer = null
if (config.default.useKafka) {
  kafka = new Kafka({
    clientId: "youtube-short",
    brokers: [`${config.default.severIP}:29092`],
  })

  producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner})
}
const socket = io(config.default.apiServer, {
  path: "/ws",
  auth: {
    token: config.default.socketSecretToken,
  },
})

socket.on("connect", () => {
  console.log(`Client connected: ${socket.id}`)
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
const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
const prisma = new PrismaClient()

;(async () => {
  console.log("Start")
  await redisClient.connect()

  if (config.default.useKafka) {
    await producer.connect()
  }
  while (true) {
    const source = await prisma.sources.findFirst({
      where: {
        status: STATUS.LIVE,
        type: SOURCE_TYPE.YOUTUBE,
        isCrawl: true,
        isCrawlShort: true,
      },
      orderBy: {
        lastCrawledShortAt: "asc",
      },
    })
    if (source) {
      if (new Date().getTime() - new Date(source.lastCrawledShortAt).getTime() > 10 * 60 * 1000) {
        await prisma.sources.update({
          where: {
            id: source.id,
          },
          data: {
            lastCrawledShortAt: new Date(),
          },
        })
        const listTopics = await prisma.topics.findMany({
          where: {isActiveCrawl: true},
        })
        await crawlChannelShort(prisma, socket, listTopics, source, "localhost", producer, redisClient)
      }
    }
    await sleep(3000)
  }
})()
