import {parse} from "node-html-parser"
import {getHtml} from "libts"
import {PrismaClient, STATUS, SOURCE_TYPE} from "@prisma/client"
import {getMainContent} from "./getMainContent"
import {filterAndSaveContent} from "../filterAndSaveContent"
import {Kafka, Partitioners, Producer} from "kafkajs"
import {BrowserContext, chromium} from "playwright"
import {Socket, io} from "socket.io-client"

import {createClient} from "redis"
import * as config from "../config/keys.config"
import {addStealth} from "../browser/spoofing/stealth"
import "cross-fetch/polyfill"
const PocketBase = require("pocketbase/cjs")

const pb = new PocketBase(config.default.pocketBaseUrl)
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
export async function getAllLinkAndPage2(html: string, originUrl: string) {
  let document: any
  try {
    document = parse(html)
  } catch (error) {
    console.log("Error when parse html with url: ", error)
  }
  if (!document) {
    return {
      page2: "",
      allLinks: [],
    }
  }
  let page2 = ""
  let allLinks = Array.from(document.querySelectorAll("a"))
    .filter((e: any) => {
      const link = e?.getAttribute("href")
      const linkTitle = e?.textContent?.trim()
      if ((link?.startsWith("/") || (link?.startsWith("http") && link?.includes(originUrl))) && linkTitle?.length > 0) {
        if (linkTitle == "2") {
          if (link.startsWith("http") && link.includes(originUrl)) {
            page2 = link
          } else if (link.startsWith("/")) {
            page2 = originUrl + link
          }
          return false
        } else if (linkTitle.length < 5) {
          return false
        } else if (linkTitle.split(" ").length < 5) {
          return false
        }

        return true
      }
      return false
    })
    .map((e: any) => {
      const tempUrl = e.getAttribute("href")
      if (!tempUrl?.startsWith("http")) {
        return originUrl + tempUrl
      } else {
        return tempUrl
      }
    })
  allLinks = [...new Set(allLinks)]
  if (!page2.startsWith("http")) {
    page2 = originUrl + page2
  }

  return {
    page2,
    allLinks,
  }
}
export async function getAllLink(html: string, originUrl: string) {
  let document: any
  try {
    document = parse(html)
  } catch (error) {
    console.log("Error when parse html with url: ", error)
  }
  if (!document) {
    return []
  }
  let allLinks = Array.from(document.querySelectorAll("a"))
    .filter((e: any) => {
      const link = e?.getAttribute("href")
      const linkTitle = e?.textContent?.trim()
      if (
        (link?.startsWith("/") || (link?.startsWith("http") && link?.includes(originUrl))) &&
        linkTitle?.length > 5 &&
        linkTitle.split(" ").length > 5
      ) {
        return true
      }
      return false
    })
    .map((e: any) => {
      const tempUrl = e.getAttribute("href")?.trim()
      if (!tempUrl?.startsWith("http")) {
        return originUrl + tempUrl
      } else {
        return tempUrl
      }
    })
  allLinks = [...new Set(allLinks)]

  return allLinks
}
export async function crawlCategory(
  socket: Socket,
  incognito: BrowserContext | null,

  prisma: PrismaClient,
  producer: Producer,
) {
  const topics = await prisma.topics.findMany({
    where: {
      isActiveCrawl: true,
    },
  })
  if (config.default.pocketBaseUrl) {
    for (const topic of topics) {
      if (!topic.pbId) {
        const pbTopic = await pb.collection("topics").create({
          total: topic.totalContent,
          name: topic?.name,
        })
        await prisma.topics.update({
          where: {id: topic.id},
          data: {
            pbId: pbTopic.id,
          },
        })
      }
    }
  }

  const source = await prisma.sources.findFirst({
    where: {
      status: STATUS.LIVE,
      type: SOURCE_TYPE.WEBSITE,
      isCrawl: true,
      isTopic: true,
    },

    orderBy: {
      lastCrawledAt: "asc",
    },
  })
  if (new Date().getTime() - source.lastCrawledAt.getTime() > config.default.minTimeCrawlWeb * 60 * 1000) {
    await prisma.sources.update({
      where: {
        id: source.id,
      },
      data: {
        lastCrawledAt: new Date(),
      },
    })
    let crawledContent: any[] = []
    const url = new URL(source.link)
    console.log(`${new Date()}: ${source.link} --`)
    let html = await getHtml(
      source.link,
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "",
    )

    // let {page2, allLinks} = await getAllLinkAndPage2(html.html, url.origin)
    let allLinks = await getAllLink(html.html, url.origin)
    if (allLinks.length > 0) {
      // let checkToBreak = false
      for (const crawledLink of allLinks) {
        if (await redisClient.get(crawledLink)) {
        } else {
          await sleep(5 * 1000)

          const mainContent = await getMainContent(crawledLink, false)
          if (await redisClient.get(mainContent.link)) {
          } else {
            await redisClient.set(mainContent.link, 1, {
              EX: 60 * 60 * 24 * 7,
            })
            if (mainContent.textContent !== "") {
              crawledContent.push(mainContent)
              if (crawledContent.length == 10) {
                await filterAndSaveContent(
                  crawledContent,
                  socket,
                  topics,
                  incognito,
                  prisma,
                  "WEBSITE",
                  producer,
                  source,
                )
                crawledContent = []
              }
            }
          }
          // if (false && mainContent.postedAt < source.lastCrawledAt && mainContent.textContent !== "") {
          //   // checkToBreak = true
          // } else
        }
      }

      if (crawledContent.length) {
        await filterAndSaveContent(crawledContent, socket, topics, incognito, prisma, "WEBSITE", producer, source)
      }
    }
  }

  setTimeout(() => {
    crawlCategory(socket, incognito, prisma, producer)
  }, 30 * 1000)
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
    const promises: Array<Promise<void>> = []
    for (let i = 0; i < config.default.numThreadWebCate; i++) {
      try {
        promises.push(crawlCategory(socket, context, prisma, producer))
      } catch (error) {
        console.log(`Error with process ${i}`, error)
      }
    }
    await Promise.all(promises)
  } catch (error) {
    console.log("Error in while loop: ", error)
    await redisClient.disconnect()
    await browser.close()
  }
})()
