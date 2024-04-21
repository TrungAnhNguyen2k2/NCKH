import {getMainContent} from "./getMainContent"
import robotsParser from "robots-parser"
import {getHtml} from "libts/src"
import * as xml2js from "xml2js"
import {digjs} from "./digjs"

import {PrismaClient, STATUS, SOURCE_TYPE} from "@prisma/client"
import {BrowserContext} from "playwright"
import {Socket} from "socket.io-client"
import {Producer} from "kafkajs"
import {filterAndSaveContent} from "../filterAndSaveContent"
import * as config from "../config/keys.config"
const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
export async function crawl(
  prisma: PrismaClient,
  socket: Socket,
  incognito: BrowserContext,
  redisClient: any,
  producer: Producer,
) {
  try {
    const source = await prisma.sources.findFirst({
      where: {
        status: STATUS.LIVE,
        type: SOURCE_TYPE.WEBSITE,
        isCrawl: true,
        isTopic: false,
      },

      orderBy: {
        lastCrawledAt: "asc",
      },
    })
    if (source) {
      if (
        new Date().getTime() - new Date(source.lastCrawledAt).getTime() >
        config.default.minTimeCrawlWeb * 60 * 1000
      ) {
        await prisma.sources.update({
          where: {
            id: source.id,
          },
          data: {
            lastCrawledAt: new Date(),
          },
        })
        const topics = await prisma.topics.findMany({
          where: {
            isActiveCrawl: true,
          },
        })
        let {link, lastCrawledAt} = source
        const now = new Date()
        now.setDate(now.getDate() - 2)
        const lastCrawl = lastCrawledAt > now ? lastCrawledAt : now
        console.log("lastCrawl", lastCrawl)
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
            console.log("Error when new URL", error)
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
        let links: {link: string; postedAt: Date; image: string; video: string}[] = []
        for (let i = 0; i < siteMaps.length; i++) {
          console.log("Sitemap: ", siteMaps[i])
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
                  console.log("Error when parse sitemap xml", error, error1)
                  result = null
                }
              }

              if (result !== null) {
                newSiteMaps = digjs(result, "sitemap")
                urls = digjs(result, "url")

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
                            let d1 = `${dateArr[0].substring(0, 4)}/${dateArr[0].substring(
                              4,
                              6,
                            )}/${dateArr[0].substring(6, 8)}`
                            let d2 = `${dateArr[0].substring(4, 8)}/${dateArr[0].substring(
                              2,
                              4,
                            )}/${dateArr[0].substring(0, 2)}`
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
                            let d1 = `${dateArr[0].substring(0, 4)}/${dateArr[0].substring(
                              4,
                              6,
                            )}/${dateArr[0].substring(6, 8)}/${dateArr[0].substring(8, 10)}:${dateArr[0].substring(
                              10,
                              12,
                            )}:${dateArr[0].substring(12, 14)}`
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
                      if (
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
                        })
                      } else if (
                        new Date(checkDate) >= lastCrawl &&
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
                        })
                      }
                      if (new Date(checkDate) < lastCrawl) {
                        throw BreakError
                      }
                    })
                  } catch (error) {
                    if (error !== BreakError) {
                      console.log("Error when push link checkDate", error)
                    }
                  }
                }
                if (links.length >= 10) {
                  while (links.length >= 10) {
                    try {
                      const processLinks = links.splice(0, 10)
                      let contents = await Promise.all(
                        processLinks.map(async (e: {link: string; postedAt: Date; image: string; video: string}) => {
                          if (await redisClient.get(e.link)) {
                            console.log("Link visited: ", e.link)
                            return null
                          } else {
                            let content = await getMainContent(e.link, !!source.useProxy)
                            if (content?.textContent) {
                              console.log("New link: ", e.link)
                              if (e.image != "") content.imageContents = [...content.imageContents, e.image]
                              if (e.video != "") content.videoContents = [...content.videoContents, e.video]
                              if (content.postedAt === null) {
                                content.postedAt = e.postedAt
                              }
                            }
                            await redisClient.set(e.link, 1, {
                              EX: 60 * 60 * 24,
                            })
                            return content
                          }
                        }),
                      )
                      contents = contents.filter((c) => c?.textContent)
                      if (contents.length > 0) {
                        await filterAndSaveContent(
                          contents,
                          socket,
                          topics,
                          incognito,
                          prisma,
                          "WEBSITE",
                          producer,
                          source,
                        )
                      }
                    } catch (error) {
                      console.log("Error when crawl link website", error)
                    }
                  }
                }
              }
            }
          }
        }

        let contents = await Promise.all(
          links.map(async (e: {link: string; postedAt: Date; image: string; video: string}) => {
            if (await redisClient.get(e.link)) {
              console.log("Link visited: ", e.link)
              return null
            } else {
              let content = await getMainContent(e.link, !!source.useProxy)
              if (content?.textContent) {
                console.log("New link: ", e.link)
                if (e.image != "") content.imageContents = [...content.imageContents, e.image]
                if (e.video != "") content.videoContents = [...content.videoContents, e.video]
                if (content.postedAt === null) {
                  content.postedAt = e.postedAt
                }
              }

              await redisClient.set(e.link, 1, {
                EX: 60 * 60 * 24,
              })
              if (content && content?.postedAt < lastCrawl) {
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
      }
    }
    setTimeout(() => {
      crawl(prisma, socket, incognito, redisClient, producer)
    }, 15 * 1000)
  } catch (error) {
    console.log("Error when crawl website", error)
  }
}
