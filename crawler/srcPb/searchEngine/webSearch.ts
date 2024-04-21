import {getHtml} from "libts"
import {getMainContent} from "../../src/website/getMainContent"

import * as config from "../../src/config/keys.config"

export async function webSearch(cate: any, redisClient: any, listCategories: any[], pb: any) {
  try {
    const nextSearchGoogleAt =
      new Date(new Date(cate.nextSearchGoogleAt).getTime() + cate.intervalSearch) > new Date()
        ? new Date(new Date(cate.nextSearchGoogleAt).getTime() + cate.intervalSearch)
        : new Date(new Date().getTime() + cate.intervalSearch)
    await pb.collection("categories").update(cate.id, {
      nextSearchGoogleAt: nextSearchGoogleAt,
    })
    let keywords = cate.keywords
    keywords = keywords.map((e: string) => e.trim())
    const countKeywords = keywords.join(" ").split(" ").length
    const searchTime = Math.floor(countKeywords / 20) + 1
    const wordPerSearch = Math.round(countKeywords / searchTime)
    let searchList: string[][] = []
    let tempList: string[] = []
    let count = 0
    let links: string[] = []
    if (countKeywords <= 20) {
      searchList = [keywords]
    } else {
      keywords.forEach((e: string, i: number) => {
        if (count + e.split(" ").length < wordPerSearch) {
          tempList.push(e)
          count += e.split(" ").length
        } else {
          searchList.push(tempList)
          tempList = [e]
          count = 0
        }
        if (i == keywords.length - 1) {
          searchList.push(tempList)
        }
      })
    }
    searchList = searchList.filter((e) => e !== null && e.length > 0)

    const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
    for (const keySearchs of searchList) {
      //handle proxy
      let listProxy = config.default.listProxy?.trim()?.split(",") || []
      listProxy.push("localhost")
      let listProxyLastRun: {proxy: string; lastRun: Date}[] = []

      for (const proxy of listProxy) {
        const lastRun = new Date(await redisClient.get(proxy))
        listProxyLastRun.push({proxy, lastRun})
      }
      listProxyLastRun.sort(function (a, b) {
        return a.lastRun.getTime() - b.lastRun.getTime()
      })
      //Handle search
      const keysearch = keySearchs.map((e) => '"' + e + '"').join("OR")
      const timeSpace = new Date().getTime() - listProxyLastRun[0].lastRun.getTime()
      if (timeSpace < 5 * 60 * 1000) {
        await sleep(5 * 60 * 1000 - timeSpace)
      }

      let result = await searchGoogle(cate.intervalSearch, keysearch, listProxyLastRun[0].proxy, redisClient)

      if (result.blocked) {
        result = await searchGoogle(cate.intervalSearch, keysearch, listProxyLastRun[1].proxy, redisClient)
        if (result.blocked) {
          await sleep(60 * 60 * 1000)
        }
      }
      for (const link of result.links) {
        if (await redisClient.get(link)) {
        } else {
          // await sleep(5 * 1000)
          console.log("link", link)
          const mainContent = await getMainContent(link, false)
          if (mainContent) {
            if (await redisClient.get(mainContent.link)) {
            } else {
              await redisClient.set(mainContent.link, 1, {
                EX: 60 * 60 * 24 * 7,
              })
              if (mainContent.textContent !== "") {
                let source
                try {
                  source = await pb.collection("sources").getFirstListItem(`link=${new URL(link).origin}`)
                } catch (error) {
                  console.log("Error when get source", source)
                }

                if (!source) {
                  source = await pb.collection("sources").create({
                    link: new URL(link).origin,
                    name: new URL(link).host,
                    type: "WEBSITE",
                    total: 0,
                    avatar: "https://icon.horse/icon/" + new URL(link).host,
                    status: "LIVE",
                    isCrawl: false,
                    isTopic: false,
                    lastCrawledAt: new Date(),
                  })
                }
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
                  await pb.collection("sources").update(source.id, {
                    total: source.total + 1,
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
  } catch (error) {
    console.log("Error when webSearch", error)
  }
}
export async function searchGoogle(interval: number, keysearch: string, proxy: string, redisClient: any) {
  console.log("Start search:", new Date())
  console.log("proxy", proxy)
  const url = "https://google.com/search?q="
  let param = "&ie=UTF-8&num=100&lr=lang_vi&gl=vn&tbs=sbd:lang_1vi,qdr:d"

  if (interval <= 60 * 60 * 1000) {
    param = "&ie=UTF-8&num=100&lr=lang_vi&gl=vn&tbs=sbd:lang_1vi,qdr:h"
  }
  const fullUrl = url + encodeURIComponent(keysearch) + param
  console.log("FullUrl", fullUrl)
  let html = ""
  try {
    const reqHtml = await getHtml(fullUrl, "", proxy)
    await redisClient.set(proxy, new Date().toISOString())
    html = reqHtml.html
  } catch (error) {
    console.log("Error when get and parse HTML in websearch function: ")
    console.log(error)
    return {links: [], blocked: false}
  }

  const links = getLinksByRegex(html)
  let blocked = false
  if (links.length == 0) {
    console.log("Error when search google, no link")
    if (html.indexOf("Our systems have detected unusual traffic") > -1) {
      console.log(`${new Date()}: Đã bị google chặn proxy ${proxy}`)
      blocked = true
    }
  }

  return {links, blocked}
}
export async function googleStranslateWeb(keywords: Array<Array<string>>, interval: number) {
  const keysearch = keywords.map((ks) => `(${ks.map((k) => `"${k}"`).join(" AND ")})`).join(" OR ")
  let queryParams =
    "&ie=UTF-8&num=100&lr=lang_vi&gl=vn&tbs=sbd:lang_1vi,qdr:d&_x_tr_sl=auto&_x_tr_tl=vi&_x_tr_hl=vi&_x_tr_pto=wapp"
  if (interval <= 3600000) {
    queryParams = "&ie=UTF-8&num=100&lr=lang_vi&gl=vn&tbs=sbd:lang_1vi,qdr:h"
  }
  const url = "https://www-google-com.translate.goog/search?q="
  const fullUrl = url + encodeURIComponent(keysearch) + queryParams
  try {
    const html = await getHtml(fullUrl, "", "")
    const allLinks = getLinksByRegex(html.html)
    if (allLinks.length == 0) {
      console.log("Error when search google translate, no link")
      console.log("fullLinkSearchGoogleTranslate: ", fullUrl)
      if (html.html.indexOf("Our systems have detected unusual traffic") > -1) {
        console.log("Đã bị google translate chặn")
      }
    }
    console.log("fullLinkSearchGoogleTranslate: ", fullUrl)
    return allLinks
  } catch (error) {
    console.log("Error when get links from google translate in websearch function: ")
    console.log(error)
    console.log("fullLinkSearchGoogleTranslate: ", fullUrl)
    return []
  }
}
export function getLinksByRegex(textSearch: string) {
  // let linkRegex = /(http|ftp|https):\/\/([w-]+(?:(?:.[w-]+)+))([w.,@?^=%&:/~+#-]*[w@?^=%&/~+#-])/g
  let linkRegex =
    /(http|https):\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi

  let allLinks = Array.from(textSearch.matchAll(linkRegex), (m) => m[0])
  allLinks = allLinks.filter((e) => {
    const checkLink =
      e.indexOf("google") == -1 &&
      e.indexOf("schema.org") == -1 &&
      e.indexOf("google") == -1 &&
      e.indexOf("gstatic") == -1 &&
      e.indexOf("w3.org") == -1 &&
      e.indexOf("tim-kiem") == -1 &&
      e.indexOf("danh-muc") == -1 &&
      e.indexOf("search?") == -1 &&
      e.indexOf("categor") == -1 &&
      e.indexOf("tag") == -1 &&
      e.indexOf("product") == -1 &&
      e.indexOf("event") == -1 &&
      e.indexOf("topic") == -1 &&
      e.indexOf("collections/vendors") == -1 &&
      e.indexOf(".webp") == -1 &&
      e.indexOf("youtube.com") == -1 &&
      e.indexOf("tiktok.com") == -1 &&
      e.indexOf("facebook.com") == -1 &&
      e.indexOf(".png") == -1 &&
      e.indexOf(".jpg") == -1 &&
      e.indexOf(".jpeg") == -1
    const url = new URL(e)

    return checkLink && url.pathname != "/"
  })
  allLinks = allLinks.map((e) => e.replace("&amp", ""))
  allLinks = [...new Set(allLinks)]
  return allLinks || []
}
