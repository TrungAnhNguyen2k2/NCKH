import {parse} from "node-html-parser"
import {getHtml} from "libts"
import {getMainContent} from "../../src/website/getMainContent"

import {createClient} from "redis"
import * as config from "../../src/config/keys.config"

// import "cross-fetch/polyfill"
const PocketBase = require("pocketbase/cjs")

const pb = new PocketBase(config.default.pocketBaseUrl)
pb.autoCancellation(false)
const redisClient = createClient({
  url: config.default.redisUrl,
})
redisClient.on("error", (err) => console.log("Redis Client Error", err))

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
export async function crawlCategory() {
  let source
  try {
    source = await pb
      .collection("sources")
      .getFirstListItem('status="LIVE" && type="WEBSITE"&& isCrawl=true && isTopic=true', {
        sort: "lastCrawledAt",
      })
  } catch (error) {
    console.log("Errorfffffff", error)
  }

  if (
    source &&
    new Date().getTime() - new Date(source.lastCrawledAt).getTime() > config.default.minTimeCrawlWeb * 60 * 1000
  ) {
    await pb.collection("sources").update(source.id, {
      lastCrawledAt: new Date(),
    })
    const url = new URL(source.link)
    console.log(`${new Date()}: ${source.link}`)
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
          if (mainContent) {
            if (await redisClient.get(mainContent.link)) {
            } else {
              await redisClient.set(mainContent.link, 1, {
                EX: 60 * 60 * 24 * 7,
              })
              if (mainContent.textContent !== "") {
                try {
                  await pb.collection("contents").create({
                    title: mainContent.title,
                    renderedContent: mainContent.renderedContent,
                    textContent: mainContent.textContent,
                    imageContents: mainContent.imageContents,
                    summaryDescription: mainContent.excerpt,
                    sourceInfo: source.id,
                    postedAt: mainContent.postedAt,
                    link: mainContent.link,
                    views: 0,
                    likes: 0,
                    share: 0,
                    isAIProcess: false,
                  })
                } catch (error) {
                  console.log("Error when save content", error)
                }
              }
            }
            // if (false && mainContent.postedAt < source.lastCrawledAt && mainContent.textContent !== "") {
            //   // checkToBreak = true
            // } else
          }
        }
      }
    }
  }

  setTimeout(() => {
    crawlCategory()
  }, 30 * 1000)
}
;(async () => {
  console.log("Start")

  await redisClient.connect()

  try {
    const promises: Array<Promise<void>> = []
    for (let i = 0; i < config.default.numThreadWebCate; i++) {
      try {
        promises.push(crawlCategory())
      } catch (error) {
        console.log(`Error with process ${i}`, error)
      }
    }
    await Promise.all(promises)
  } catch (error) {
    console.log("Error in while loop: ", error)
    await redisClient.disconnect()
  }
})()
