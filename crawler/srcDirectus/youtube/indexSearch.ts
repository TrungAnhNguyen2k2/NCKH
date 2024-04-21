import {searchYoutube} from "./searchYoutube"
import {createClient} from "redis"
import {io} from "socket.io-client"

import * as config from "../config/keys.config"
import {createDirectus, readItems, rest, staticToken, updateItem} from "@directus/sdk"
const clientDirectus = createDirectus(config.default.directusUrl)
  .with(rest())
  .with(staticToken(config.default.directusStaticToken))
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

const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
async function main() {
  try {
    const listTopics = await clientDirectus.request(
      readItems("topics", {
        filter: {
          is_active_crawl: {
            _eq: true,
          },
        },
        sort: "nextSearchYoutubeAt",
      }),
    )

    for (const topic of listTopics) {
      if (topic.nextSearchYoutubeAt < new Date()) {
        await searchYoutube(clientDirectus, redisClient, socket, listTopics, topic)
      } else {
        break
      }
    }
  } catch (error) {
    console.log("Error when search google:", error)
  }
}
;(async () => {
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
