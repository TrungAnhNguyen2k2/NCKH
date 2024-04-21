import {getMainContent} from "./getMainContent"
import robotsParser from "robots-parser"
import {getHtml} from "libts/src"
import * as xml2js from "xml2js"
import {digjs} from "./digjs"

import {PrismaClient, STATUS, SOURCE_TYPE, sources as NewsSource, topics as Topic} from "@prisma/client"
import {BrowserContext} from "playwright"
import {Socket} from "socket.io-client"
import {Producer} from "kafkajs"
import {filterAndSaveContent} from "../filterAndSaveContent"
import {logger} from "./logger"

const CRAWL_INTERVAL_PER_SITE = 5 * 60 * 1000
const CRAWL_SPENT_TIME_LIMIT_PER_SITE = 60 * 60 * 1000

const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))

// store being crawled sites
const CrawlingSites = new Map<string, NewsSource>()

// store last compeleted crawl time of each site
const LastCrawledTime = new Map<string, number>()

export async function crawl(
  prisma: PrismaClient,
  socket: Socket,
  incognito: BrowserContext,
  redisClient: any,
  producer: Producer,
) {
  try {
    while (true) {
      let sources = await prisma.sources.findMany({
        where: {
          // link: "https://vnexpress.net", // To test only
          status: STATUS.LIVE,
          type: SOURCE_TYPE.WEBSITE,
          isCrawl: true,
          isTopic: false,
        },
      })

      if (sources === null) {
        // something wrong on access data sources
        logger.error("Cannot get crawling sources")
        sleep(1000)
        continue
      }

      // filter news sources: only ones those are not in the CrawlingSites and having last crawled time expired the crawling interval
      sources = sources.filter((s) => {
        if (CrawlingSites.has(s.link)) {
          return false
        }
        const now = new Date().getTime()
        const v1 = now - new Date(s.lastCrawledAt).getTime() > CRAWL_INTERVAL_PER_SITE
        const v2 = LastCrawledTime.has(s.link) ? now - LastCrawledTime.get(s.link) > CRAWL_INTERVAL_PER_SITE : true
        return v1 && v2
      })

      // load topics
      const topics = await prisma.topics.findMany({
        where: {
          isActiveCrawl: true,
        },
      })

      if (sources.length > 0) {
        logger.info(`Start crawling sites: ${JSON.stringify(sources.map((s) => s.link))}`)
      }

      for (var i = 0; i < sources.length; i++) {
        // !!! Note: do not use (var..in..) here because it will make wrong ref in the promise crawlOne's `finally` block
        const source = sources[i]
        CrawlingSites.set(source.link, source)
        crawlOne(source, topics, prisma, socket, incognito, redisClient, producer, CRAWL_SPENT_TIME_LIMIT_PER_SITE)
          .catch((e) => {
            logger.error(`crawlOne for ${source.link} exception: {e}`)
          })
          .finally(() => {
            logger.info(`crawlOne for ${source.link} ended`)
            CrawlingSites.delete(source.link)
            LastCrawledTime.set(source.link, new Date().getTime())
          })
      }

      sleep(1000)
    }
  } catch (e) {
    logger.error(`Error when crawling websites: ${e}`)
    CrawlingSites.clear()
  }
}

async function crawlOne(
  source: NewsSource,
  topics: Topic[],
  prisma: PrismaClient,
  socket: Socket,
  incognito: BrowserContext,
  redisClient: any,
  producer: Producer,
  timeout: number,
) {
  if (!source || !source.link) {
    logger.error(`crawlOne error: null or invalid source`)
    return
  }

  logger.info(`Crawling ${source.link}...`)
  var startTime = Date.now()

  var isTimeOut = false

  setTimeout(() => {
    isTimeOut = true
  }, timeout)

  try {
    await prisma.sources.update({
      where: {
        id: source.id,
      },
      data: {
        lastCrawledAt: new Date(),
      },
    })
    // const topics = await prisma.topics.findMany({
    //   where: {
    //     isActiveCrawl: true,
    //   },
    // })
    let {link, lastCrawledAt} = source
    const now = new Date()
    now.setDate(now.getDate() - 2)
    const lastCrawl = lastCrawledAt > now ? lastCrawledAt : now
    //logger.info(`lastCrawl: ${lastCrawl}`)
    // Get all sitemap link
    if (!link.startsWith("http")) {
      link = "https://" + link
    }
    const domainOrigin = new URL(link)

    const userAgent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

    const {html} = await getHtml("https://" + domainOrigin.hostname + "/robots.txt", userAgent, "")

    const robots = robotsParser("https://" + domainOrigin.hostname + "/robots.txt", [html].join("\n"))

    let siteMaps = robots
      .getSitemaps()
      ?.map((e) => e.trim())
      .filter(
        (e) =>
          !e.toLowerCase().includes("tag") &&
          !e.toLowerCase().includes("category") &&
          !e.toLowerCase().includes("product") &&
          !e.toLowerCase().includes("categories") &&
          !e.toLowerCase().includes("topic") &&
          !e.toLowerCase().includes("event") &&
          !e.toLowerCase().includes("video"),
      )
    let tempUrl = new URL(link)
    if (siteMaps.length > 0) {
      try {
        if (!siteMaps[0].startsWith("http")) {
          siteMaps[0] = "http://" + siteMaps[0]
        }
        tempUrl = new URL(siteMaps[0])
        if (tempUrl.origin !== domainOrigin.origin) {
          await prisma.sources.update({
            where: {
              id: source.id,
            },
            data: {
              link: tempUrl.origin,
            },
          })
        }
      } catch (error) {
        logger.error(`Error when new URL ${error}`)
      }
    }
    const affixs = [
      tempUrl.origin + "/sitemap.xml",
      tempUrl.origin + "/sitemaps.xml",
      tempUrl.origin + "/sitemap_index.xml",
      tempUrl.origin + "/sitemap.php",
      tempUrl.origin + "/sitemap.txt",
      tempUrl.origin + "/sitemap.xml.gz",
      tempUrl.origin + "/sitemap/sitemap.xml",
      tempUrl.origin + "/sitemaps/sitemap-index.xml",
      tempUrl.origin + "/sitemapindex.xml",
      tempUrl.origin + "/sitemap/index.xml",
      tempUrl.origin + "/sitemap1.xml",
      tempUrl.origin + "/rss.xml",
      tempUrl.origin + "/atom.xml",
      tempUrl.origin + "/sitemaps/google-news.xml",
      tempUrl.origin + "/sitemaps/newsindex.xml",
      tempUrl.origin + "/sitemaps/index.rss",
      tempUrl.origin + "/sitemap/sitemap_news.xml",
    ]

    siteMaps = [...new Set([...siteMaps, ...affixs])]

    let countCantAccessSitemap = 0 // Count Cant Acess Website to check if website is Dead
    //From all sitemap get all link
    let links: {link: string; postedAt: Date; image: string; video: string; hasPostedTime: boolean}[] = []

    // Added on 20 Sep 2023
    let crawlFromTime = new Date()
    crawlFromTime.setDate(crawlFromTime.getDate() - 2)
    //crawlFromTime.setHours(0)
    //crawlFromTime.setMinutes(0)
    //crawlFromTime.setMinutes(0)

    for (let i = 0; i < siteMaps.length; i++) {
      if (isTimeOut) {
        logger.info(`Crawler time out at sitemap link: ${siteMaps[i]}`)
        break
      }

      logger.info(`Sitemap: ${siteMaps[i]}`)
      await sleep(1000 + Math.floor(Math.random() * 3) * 1000)
      let {html: tempHtml, redirectUrl} = await getHtml(siteMaps[i], userAgent, "")

      if (tempHtml === "") {
        countCantAccessSitemap = countCantAccessSitemap + 1
      } else {
        countCantAccessSitemap = 0
        if (
          (tempHtml.indexOf("<?xml") != -1 ||
            tempHtml.indexOf("<sitemapindex") != -1 ||
            tempHtml.indexOf("urlset") != -1) &&
          tempHtml.indexOf("<head") == -1 &&
          tempHtml.indexOf("<body") == -1 &&
          tempHtml.indexOf("<p>") == -1 &&
          tempHtml.indexOf("style=") == -1
        ) {
          //logger.info(`tempHtml: ${tempHtml}`)
          //Check if redirect 404 page
          let newSiteMaps: any = []
          let result: any = null
          let urls: any = []
          try {
            result = await xml2js.parseStringPromise(tempHtml, {mergeAttrs: true})
          } catch (error) {
            try {
              const tempObj = await getHtml(siteMaps[i], userAgent, "")
              tempHtml = tempObj.html
              if (
                tempHtml.indexOf("<?xml") != -1 &&
                tempHtml.indexOf("<head") == -1 &&
                tempHtml.indexOf("<body") == -1 &&
                tempHtml.indexOf("<p>") == -1 &&
                tempHtml.indexOf("style=") == -1
              ) {
                //Check if redirect 404 page
                result = await xml2js.parseStringPromise(tempHtml, {
                  mergeAttrs: true,
                })
              }
            } catch (error1) {
              logger.error(`Error when parse sitemap xml ${error} ${error1}`)
              result = null
            }
          }

          if (result !== null) {
            newSiteMaps = digjs(result, "sitemap")
            urls = digjs(result, "url")

            //console.log(`urls: ${JSON.stringify(urls?.map((url: any) => url.loc))}`)

            if (newSiteMaps !== undefined && newSiteMaps?.length > 0) {
              newSiteMaps = newSiteMaps.filter((e: any) => e != null)
              for (const e of newSiteMaps) {
                if (
                  !siteMaps.includes(e.loc[0].trim()) &&
                  ((e.lastmod && new Date(e.lastmod[0]) > lastCrawl) || !e.lastmod) &&
                  !e.loc[0].toLowerCase().includes("tag") &&
                  !e.loc[0].toLowerCase().includes("category") &&
                  !e.loc[0].toLowerCase().includes("product") &&
                  !e.loc[0].toLowerCase().includes("categories") &&
                  !e.loc[0].toLowerCase().includes("topic") &&
                  !e.loc[0].toLowerCase().includes("event") &&
                  !e.loc[0].toLowerCase().includes("video")
                ) {
                  let dateArr = Array.from(new URL(e?.loc[0])?.pathname?.match(/\d+/g) || [])
                  if (dateArr) {
                    let date = new Date()
                    const year = date.getFullYear()
                    const month = date.getMonth()
                    const day = date.getDay()
                    let d = new Date(lastCrawl)
                    d.setDate(d.getDate() - 2)
                    d.setHours(0)
                    d.setMinutes(0)
                    d.setMinutes(0)

                    if (dateArr.length == 3 || dateArr.length > 3) {
                      dateArr = dateArr.slice(0, 3)
                      if (dateArr[0].length === 4 || dateArr[2].length === 4) {
                        date = new Date(dateArr.join("/"))
                        if (date.toString() == "Invalid Date") {
                          if (Number(dateArr[0].length === 4 ? dateArr[0] : dateArr[2]) < year) {
                            continue
                          } else {
                            siteMaps.push(e.loc[0].trim())
                          }
                        }
                      } else if (dateArr[1].length === 4) {
                        date = new Date(dateArr[1] + "/" + dateArr[0] + "/" + dateArr[2])
                      }
                      if (date.toString() == "Invalid Date" || date < new Date("2010")) {
                        siteMaps.push(e.loc[0].trim())
                      } else {
                        if (date >= d) {
                          siteMaps.push(e.loc[0].trim())
                        }
                      }
                    } else if (dateArr.length == 2) {
                      if (dateArr[0].length === 4) {
                        date = new Date(dateArr[0])
                      } else if (dateArr[1].length === 4) {
                        date = new Date(dateArr[1])
                      } else {
                        date = new Date("ff")
                      }

                      if (date.toString() === "Invalid Date") {
                        siteMaps.push(e.loc[0].trim())
                      } else {
                        if (date.getFullYear() === year) {
                          siteMaps.push(e.loc[0].trim())
                        }
                      }
                    } else if (dateArr.length == 1) {
                      if (dateArr[0].length === 4) {
                        date = new Date(dateArr[0])
                        if (date.getFullYear() === year) {
                          siteMaps.push(e.loc[0].trim())
                        }
                      } else if (dateArr[0].length === 8) {
                        let d1 = `${dateArr[0].substring(0, 4)}/${dateArr[0].substring(4, 6)}/${dateArr[0].substring(
                          6,
                          8,
                        )}`
                        let d2 = `${dateArr[0].substring(4, 8)}/${dateArr[0].substring(2, 4)}/${dateArr[0].substring(
                          0,
                          2,
                        )}`
                        if (new Date(d1).toString() != "Invalid Date") {
                          if (new Date(d1) >= d) {
                            siteMaps.push(e.loc[0].trim())
                          }
                        } else if (new Date(d2).toString() != "Invalid Date") {
                          if (new Date(d2) >= d) {
                            siteMaps.push(e.loc[0].trim())
                          }
                        } else {
                          siteMaps.push(e.loc[0].trim())
                        }
                      } else if (dateArr[0].length === 14) {
                        let d1 = `${dateArr[0].substring(0, 4)}/${dateArr[0].substring(4, 6)}/${dateArr[0].substring(
                          6,
                          8,
                        )}/${dateArr[0].substring(8, 10)}:${dateArr[0].substring(10, 12)}:${dateArr[0].substring(
                          12,
                          14,
                        )}`
                        if (new Date(d1).toString() != "Invalid Date") {
                          if (new Date(d1) >= lastCrawl) {
                            siteMaps.push(e.loc[0].trim())
                          }
                        }
                      }
                    } else {
                      siteMaps.push(e.loc[0].trim())
                    }
                  } else {
                    siteMaps.push(e.loc[0].trim())
                  }
                }
              }
            }

            if (urls !== undefined && urls?.length > 0) {
              let checkDate0 = urls[0]?.lastmod?.[0] ? urls[0]?.lastmod?.[0] : null // Bien nay vs bien duoi de check xem thu tu cua list url, neu sai thu tu thi dao nguoc
              if (!checkDate0) {
                if (
                  urls[0]?.["news:news"] &&
                  urls[0]?.["news:news"]?.[0]?.["news:publication_date"] &&
                  urls[0]?.["news:news"]?.[0]?.["news:publication_date"]?.length > 0
                ) {
                  checkDate0 = urls?.[0]?.["news:news"]?.[0]?.["news:publication_date"]?.[0] || null
                } else if (
                  urls[0]?.["video:video"] &&
                  urls[0]?.["video:video"]?.[0]?.["video:publication_date"] &&
                  urls[0]?.["video:video"]?.[0]?.["video:publication_date"]?.length > 0
                ) {
                  checkDate0 = urls[0]?.["video:video"]?.[0]?.["video:publication_date"]?.[0] || null
                }
              }
              let checkDateLast = urls[urls.length - 1]?.lastmod?.[0] ? urls[urls.length - 1]?.lastmod?.[0] : null
              if (!checkDateLast) {
                if (
                  urls[0]?.["news:news"] &&
                  urls[0]?.["news:news"]?.[0]?.["news:publication_date"] &&
                  urls[0]?.["news:news"]?.[0]?.["news:publication_date"]?.length > 0
                ) {
                  checkDateLast = urls?.[0]?.["news:news"]?.[0]?.["news:publication_date"]?.[0] || null
                } else if (
                  urls[0]?.["video:video"] &&
                  urls[0]?.["video:video"]?.[0]?.["video:publication_date"] &&
                  urls[0]?.["video:video"]?.[0]?.["video:publication_date"]?.length > 0
                ) {
                  checkDateLast = urls[0]?.["video:video"]?.[0]?.["video:publication_date"]?.[0] || null
                }
              }
              if (new Date(checkDateLast) > new Date(checkDate0)) {
                urls.reverse()
              }
              const BreakError = {}
              // TODO:
              try {
                urls.forEach((e: any) => {
                  let checkDate: any = e.lastmod?.[0] ? e.lastmod?.[0] : null
                  if (!checkDate) {
                    if (
                      e?.["news:news"] &&
                      e?.["news:news"]?.[0]?.["news:publication_date"] &&
                      e?.["news:news"]?.[0]?.["news:publication_date"]?.length > 0
                    ) {
                      checkDate = e?.["news:news"]?.[0]?.["news:publication_date"]?.[0] || null
                    } else if (
                      e?.["video:video"] &&
                      e?.["video:video"]?.[0]?.["video:publication_date"] &&
                      e?.["video:video"]?.[0]?.["video:publication_date"]?.length > 0
                    ) {
                      checkDate = e?.["video:video"]?.[0]?.["video:publication_date"]?.[0] || null
                    }
                  }

                  // 2023-06-19: add logic to avoid link duplicate
                  const linkExisted = links.find((item) => item.link === e.loc[0])

                  if (
                    !linkExisted &&
                    !checkDate &&
                    e.loc[0] &&
                    !e.loc[0].includes("tim-kiem") &&
                    !e.loc[0].includes("danh-muc") &&
                    !e.loc[0].includes("search") &&
                    !e.loc[0].includes("categor") &&
                    !e.loc[0].includes("event")
                  ) {
                    links.push({
                      link: e.loc[0],
                      postedAt: new Date(),
                      image: e?.["image:image"]?.[0]?.["image:loc"] || "",
                      video: e?.["video:video"]?.[0]?.["video:content_loc"] || "",
                      hasPostedTime: false,
                    })
                    console.log(`Link without checkDate: ${e.loc[0]}`)
                  } else if (
                    !linkExisted &&
                    new Date(checkDate) >= crawlFromTime &&
                    e.loc[0] &&
                    !e.loc[0].includes("tim-kiem") &&
                    !e.loc[0].includes("danh-muc") &&
                    !e.loc[0].includes("search") &&
                    !e.loc[0].includes("categor") &&
                    !e.loc[0].includes("event")
                  ) {
                    links.push({
                      link: e.loc[0],
                      postedAt: new Date(checkDate),
                      image: e?.["image:image"]?.[0]?.["image:loc"] || "",
                      video: e?.["video:video"]?.[0]?.["video:content_loc"] || "",
                      hasPostedTime: true,
                    })
                  }
                  if (new Date(checkDate) < crawlFromTime) {
                    throw BreakError
                  }
                })
              } catch (error) {
                if (error !== BreakError) {
                  logger.error(`Error when push link checkDate ${error}`)
                }
              }
            }

            //console.log(`Links: ${JSON.stringify(links)}`)

            if (links.length >= 10) {
              while (links.length >= 10) {
                try {
                  const processLinks = links.splice(0, 10)
                  let contents = await Promise.all(
                    processLinks.map(
                      async (e: {
                        link: string
                        postedAt: Date
                        image: string
                        video: string
                        hasPostedTime: boolean
                      }) => {
                        if (await redisClient.get(e.link)) {
                          logger.info(`Link visited (case 1): ${e.link}`)
                          return null
                        } else {
                          let content = await getMainContent(e.link, !!source.useProxy)
                          if (content?.textContent) {
                            logger.info(`New link crawled: ${e.link}`)
                            if (e.image != "") content.imageContents = [...content.imageContents, e.image]
                            if (e.video != "") content.videoContents = [...content.videoContents, e.video]
                            if (content.postedAt === null) {
                              content.postedAt = e.postedAt
                            }
                          } else {
                            logger.info(`Get content for link ${e.link} failed`)
                          }
                          if (e.hasPostedTime) {
                            await redisClient.set(e.link, 1, {
                              EX: 60 * 60 * 24,
                            })
                          } else {
                            // if link has not the posted time, we cache it forever
                            await redisClient.set(e.link, 1)
                          }
                          return content
                        }
                      },
                    ),
                  )
                  contents = contents.filter((c) => c?.textContent)
                  if (contents.length > 0) {
                    await filterAndSaveContent(contents, socket, topics, incognito, prisma, "WEBSITE", producer, source)
                  }
                } catch (error) {
                  logger.error(`Error when crawl link website ${error}`)
                }
              }
            }
          }
        }
      }
    }

    //logger.info(`sitemap: ${siteMaps}`)
    //logger.info(`links: ${links}`)
    //return

    let contents = await Promise.all(
      links.map(async (e: {link: string; postedAt: Date; image: string; video: string; hasPostedTime: boolean}) => {
        if (await redisClient.get(e.link)) {
          logger.info(`Link visited (case 2): ${e.link}`)
          return null
        } else {
          let content = await getMainContent(e.link, !!source.useProxy)
          if (content?.textContent) {
            logger.info(`New link crawled (2): ${e.link}`)
            if (e.image != "") content.imageContents = [...content.imageContents, e.image]
            if (e.video != "") content.videoContents = [...content.videoContents, e.video]
            if (content.postedAt === null) {
              content.postedAt = e.postedAt
            }
          } else {
            logger.info(`Get content for link ${e.link} failed 2`)
          }

          if (e.hasPostedTime) {
            await redisClient.set(e.link, 1, {
              EX: 60 * 60 * 24,
            })
          } else {
            // if link has not the posted time, we cache it forever
            await redisClient.set(e.link, 1)
          }
          if (content && content?.postedAt < crawlFromTime) {
            return null
          } else if (!content) {
            return null
          }
          return content
        }
      }),
    )
    contents = contents.filter((c) => c?.textContent)
    if (contents.length > 0) {
      await filterAndSaveContent(contents, socket, topics, incognito, prisma, "WEBSITE", producer, source)
    }

    if (countCantAccessSitemap === siteMaps.length) {
      const updatedSource = await prisma.sources.update({
        where: {
          id: source.id,
        },
        data: {
          countCantAccess: {increment: 1},
        },
      })
      if (updatedSource.countCantAccess > 50) {
        await prisma.sources.update({
          where: {
            id: source.id,
          },
          data: {
            status: STATUS.DEAD,
          },
        })
      }
    } else {
      await prisma.sources.update({
        where: {
          id: source.id,
        },
        data: {
          countCantAccess: 0,
        },
      })
    }

    logger.info(`Crawl ${source.link} done in ${Date.now() - startTime} millis`)
  } catch (error) {
    logger.error(`Error when crawl website ${source.link}: ${error}`)
  }
}

;(async () => {
  const html = await getHtml("https://www.youtube.com/@nextsports/videos", "", "")
  console.log(html.html)
})()
