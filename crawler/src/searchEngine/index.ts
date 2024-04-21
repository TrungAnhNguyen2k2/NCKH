import {PrismaClient} from "@prisma/client"
import {BrowserContext, chromium} from "playwright"
import {addStealth} from "../browser/spoofing/stealth"
import {webSearch} from "./webSearch"
import {io} from "socket.io-client"
import * as config from "../config/keys.config"

import {createClient} from "redis"
import {Kafka, Producer, Partitioners} from "kafkajs"

let kafka = null
let producer: Producer = null
if (config.default.useKafka) {
  kafka = new Kafka({
    clientId: "search-google",
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
const prisma = new PrismaClient()
const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))

async function main(incognito: BrowserContext, redisClient: any) {
  try {
    let listTopics = await prisma.topics.findMany({
      where: {
        isActiveCrawl: true,
      },

      orderBy: {
        nextSearchGoogleAt: "asc",
      },
    })
    for (const topic of listTopics) {
      if (topic.nextSearchGoogleAt < new Date()) {
        await webSearch(topic, redisClient, socket, producer, listTopics, incognito, prisma)
      } else {
        break
      }
    }
  } catch (error) {
    console.log("Error when search google:", error)
  }
}
;(async () => {
  console.log("Start")
  if (config.default.useKafka) {
    await producer.connect()
  }
  await redisClient.connect()
  let browser = null
  let context: BrowserContext = null
  if (config.default.isScreenShot) {
    browser = await chromium.launch({
      headless: false,
      args: ["--headless=new"],
    })
    context = await browser.newContext({
      viewport: {
        width: 1920,
        height: 1007,
      },
      screen: {
        width: 1920,
        height: 1080,
      },
    })

    await addStealth(context)
  }
  try {
    while (true) {
      await main(context, redisClient)
      await sleep(30 * 1000)
    }
  } catch (error) {
    await redisClient.disconnect()
    await browser.close()
    console.log("Error in while loop: ", error)
  }
})()
