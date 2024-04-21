import {webSearch} from "./webSearch"

import * as config from "../../src/config/keys.config"

import {createClient} from "redis"
const PocketBase = require("pocketbase/cjs")

const pb = new PocketBase(config.default.pocketBaseUrl)
pb.autoCancellation(false)

const redisClient = createClient({
  url: config.default.redisUrl,
})
redisClient.on("error", (err) => console.log("Redis Client Error", err))

const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))

async function main(redisClient: any) {
  try {
    let listCategories = await pb.collection("categories").getFullList({
      sort: "nextSearchGoogleAt",
    })

    for (const cate of listCategories) {
      if (new Date(cate.nextSearchGoogleAt) < new Date()) {
        await webSearch(cate, redisClient, listCategories, pb)
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

  try {
    while (true) {
      await main(redisClient)
      await sleep(30 * 1000)
    }
  } catch (error) {
    await redisClient.disconnect()
    console.log("Error in while loop: ", error)
  }
})()
