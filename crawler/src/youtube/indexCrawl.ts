import {PrismaClient, STATUS, SOURCE_TYPE} from "@prisma/client"
import {io} from "socket.io-client"
import {createClient} from "redis"
import {crawlChannelVideo} from "./crawlChannelVideo"
import * as config from "../config/keys.config"

import {Kafka, Producer, Partitioners} from "kafkajs"

let kafka = null
let producer: Producer = null

if (config.default.useKafka) {
  kafka = new Kafka({
    clientId: "website",
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
        isCrawlVideo: true,
      },
      orderBy: {
        lastCrawledAt: "asc",
      },
    })
    if (source) {
      if (new Date().getTime() - new Date(source.lastCrawledAt).getTime() > 10 * 60 * 1000) {
        await prisma.sources.update({
          where: {
            id: source.id,
          },
          data: {
            lastCrawledAt: new Date(),
          },
        })
        const listTopics = await prisma.topics.findMany({
          where: {isActiveCrawl: true},
        })
        let {lastCrawledAt} = source
        const now = new Date()
        now.setDate(now.getDate() - 2)
        const lastCrawl = lastCrawledAt > now ? lastCrawledAt : now
        await crawlChannelVideo(prisma, socket, listTopics, lastCrawl, source, "localhost", producer, redisClient)
      }
    }
    await sleep(3000)
  }
})()
