import {io} from "socket.io-client"
import {createClient} from "redis"
import {crawlChannelVideo} from "./crawlChannelVideo"
import * as config from "../config/keys.config"
import {createDirectus, readItems, rest, staticToken, updateItem} from "@directus/sdk"
const clientDirectus = createDirectus(config.default.directusUrl)
  .with(rest())
  .with(staticToken(config.default.directusStaticToken))
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

;(async () => {
  console.log("Start")
  await redisClient.connect()

  while (true) {
    const source = (
      await clientDirectus.request(
        readItems("sources", {
          filter: {
            status: {
              _eq: "LIVE",
            },
            type: {
              _eq: "YOUTUBE",
            },
            isCrawl: {
              _eq: true,
            },
            isCrawlVideo: {
              _eq: true,
            },
          },
          sort: "lastCrawledAt",
          limit: 1,
        }),
      )
    )?.[0]

    if (source) {
      if (new Date().getTime() - new Date(source.lastCrawledAt).getTime() > 10 * 60 * 1000) {
        await clientDirectus.request(
          updateItem("sources", source.id, {
            lastCrawledAt: new Date(),
          }),
        )

        const listTopics = await clientDirectus.request(
          readItems("topics", {
            filter: {
              is_active_crawl: {
                _eq: true,
              },
            },
          }),
        )
        let {lastCrawledAt} = source
        const now = new Date()
        now.setDate(now.getDate() - 2)
        const lastCrawl = lastCrawledAt > now ? lastCrawledAt : now
        await crawlChannelVideo(clientDirectus, socket, listTopics, lastCrawl, source, "localhost", redisClient)
      }
    }
    await sleep(3000)
  }
})()
