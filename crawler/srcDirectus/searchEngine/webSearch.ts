import {getHtml} from "libts"
import {getMainContent} from "../website/getMainContent"
import {Socket} from "socket.io-client"
import {filterAndSaveContent} from "../filterAndSaveContent"

import * as config from "../config/keys.config"

import {BrowserContext} from "playwright"
import {SmccSchema, Topic} from "../schema/schema"
import {DirectusClient, RestClient, StaticTokenClient, updateItem} from "@directus/sdk"

export async function webSearch(
  topic: Topic,
  redisClient: any,
  socket: Socket,

  topics: Topic[],
  incognito: BrowserContext,
  clientDirectus: DirectusClient<SmccSchema> & RestClient<SmccSchema> & StaticTokenClient<SmccSchema>,
) {
  try {
    const nextSearchGoogleAt =
      new Date(new Date(topic.nextSearchGoogleAt).getTime() + topic.intervalSearch) > new Date()
        ? new Date(new Date(topic.nextSearchGoogleAt).getTime() + topic.intervalSearch)
        : new Date(new Date().getTime() + topic.intervalSearch)
    await clientDirectus.request(
      updateItem("topics", topic.id, {
        nextSearchGoogleAt: nextSearchGoogleAt,
      }),
    )

    let keywords = topic.searchKeywords.map((e) => e.trim())
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
      keywords.forEach((e, i) => {
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
      let listProxyLastRun = []

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

      let result = await searchGoogle(topic.intervalSearch, keysearch, listProxyLastRun[0].proxy, redisClient)

      if (result.blocked) {
        result = await searchGoogle(topic.intervalSearch, keysearch, listProxyLastRun[1].proxy, redisClient)
        if (result.blocked) {
          await sleep(60 * 60 * 1000)
        }
      }
      links = links.concat(result.links)
      if (links.length >= 10) {
        while (links.length >= 10) {
          const processLink = links.splice(0, 10)
          let contents = await Promise.all(
            processLink.map(async (link) => {
              if (await redisClient.get(link)) {
                console.log("Link visited: ", link)
                return null
              } else {
                let content = await getMainContent(link, false)
                if (content?.textContent) {
                  console.log("New link: ", link)
                }
                await redisClient.set(link, 1, {
                  EX: 60 * 60 * 24,
                })
                // const checkText = content.title.toLowerCase() + " " + content.textContent.toLowerCase()
                if (
                  content.textContent &&
                  content.textContent != "undefined"
                  // &&
                  // checkText.indexOf("cá cược uy tín") == -1 &&
                  // checkText.indexOf("kèo nhà cái") == -1 &&
                  // checkText.indexOf("tỷ lệ kèo") == -1 &&
                  // (checkText.indexOf("casino") == -1 || checkText.indexOf("bóng đá") == -1) &&
                  // checkText.indexOf("bet kèo") == -1 &&
                  // checkText.indexOf("casino trực tuyến") == -1
                ) {
                  return content
                } else {
                  return null
                }
              }
            }),
          )
          contents = contents.filter((c) => c?.textContent)
          if (contents.length > 0) {
            await filterAndSaveContent(contents, socket, topics, incognito, clientDirectus, "GOOGLE_SEARCH")
          }
        }
      }
    }
    if (links.length > 0) {
      let contents = await Promise.all(
        links.map(async (link) => {
          if (await redisClient.get(link)) {
            console.log("Link visited: ", link)
            return null
          } else {
            let content = await getMainContent(link, false)
            if (content?.textContent) {
              console.log("New link: ", link)
            }
            await redisClient.set(link, 1, {
              EX: 60 * 60 * 24,
            })
            return content
          }
        }),
      )
      contents = contents.filter((c) => c?.textContent)
      if (contents.length > 0) {
        await filterAndSaveContent(contents, socket, topics, incognito, clientDirectus, "GOOGLE_SEARCH")
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
