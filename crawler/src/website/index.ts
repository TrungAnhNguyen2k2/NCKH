import {PrismaClient} from "@prisma/client"
import {BrowserContext, chromium} from "playwright"
import {addStealth} from "../browser/spoofing/stealth"
import {crawl} from "./crawl_old"
import {io} from "socket.io-client"
import {createClient} from "redis"
import * as config from "../config/keys.config"
import {Kafka, Producer, Partitioners} from "kafkajs"
import {logger} from "./logger"

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
  logger.info(`Client connected: ${socket.id}`)
})

socket.on("disconnect", () => {
  logger.info(`Client disconnected`)
})

socket.on("connect_error", (e) => {
  logger.error(`Connect error: ${e}`)
})

const redisClient = createClient({
  url: config.default.redisUrl,
})

redisClient.on("error", (err) => logger.error(`Redis Client Error ${err}`))

const prisma = new PrismaClient()

async function main(context: BrowserContext, producer: Producer) {
  const promises: Array<Promise<void>> = []
  for (let i = 0; i < config.default.numThreadWebCate; i++) {
    try {
      promises.push(crawl(prisma, socket, context, redisClient, producer))
    } catch (error) {
      console.log(`Error with process ${i}`, error)
    }
  }
  await Promise.all(promises)
  // await crawl(prisma, socket, context, redisClient, producer)
  // process.exit()
}

;(async () => {
  logger.info("Start")
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
    await context.newPage()
  }
  if (config.default.useKafka) {
    await producer.connect()
  }

  try {
    await main(context, producer)
  } catch (error) {
    logger.error(`Error in while loop ${error}`)
    await redisClient.disconnect()
    await browser.close()
  }
})()
