import {Browser, BrowserContext, chromium} from "playwright"
import {addStealth} from "../browser/spoofing/stealth"
import {webSearch} from "./webSearch"
import {io} from "socket.io-client"
import * as config from "../config/keys.config"

import {createClient} from "redis"
import {createDirectus, readItems, rest, staticToken} from "@directus/sdk"
const clientDirectus = createDirectus(config.default.directusUrl)
  .with(rest())
  .with(staticToken(config.default.directusStaticToken))
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

const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))

async function main(incognito: BrowserContext | null, redisClient: any) {
  try {
    const listTopics = await clientDirectus.request(
      readItems("topics", {
        filter: {
          is_active_crawl: {
            _eq: true,
          },
        },
        sort: "nextSearchGoogleAt",
      }),
    )

    for (const topic of listTopics) {
      if (topic.nextSearchGoogleAt < new Date()) {
        await webSearch(topic, redisClient, socket, listTopics, incognito, clientDirectus)
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

  await redisClient.connect()
  let browser: Browser
  let context: BrowserContext | null = null
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

    console.log("Error in while loop: ", error)
  }
})()
