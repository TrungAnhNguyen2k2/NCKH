import moment from "moment"
import {getRequestOptions} from "./config"
import {getPostsFromResponse, normalizeResponse} from "./parser"
import {parse} from "node-html-parser"

import {SOURCE_TYPE, fbAccounts, sources, topics, STATUS, PrismaClient} from "@prisma/client"
import {BrowserContext} from "playwright"
import {BrowserConfig, CrawledFacebookPost} from "./types"
import {filterAndSaveContent} from "../../filterAndSaveContent"
import {Socket} from "socket.io-client"
import {Producer} from "kafkajs"
export const getPostsFromSource = async (
  browserConfig: BrowserConfig,
  account: fbAccounts,
  source: sources,
  cursor: string,
  callback: Function = console.log,
): Promise<null | undefined> => {
  let requestOptions = undefined,
    res = undefined,
    results: {posts: Array<CrawledFacebookPost>; nextCursors: string[]} = undefined
  let lastCrawlTime = source.lastCrawledAt || moment().add(-2, "days").toDate()
  const {context} = browserConfig
  const url = "https://www.facebook.com/api/graphql/"
  const facebookHome = "https://www.facebook.com"
  if (!source.type || !account.fbId || !account.token || !context) {
    return
  }
  console.log("Get posts from source")
  let page = context.pages().find((page) => page.url().startsWith(facebookHome))
  if (!page) {
    page = await context.newPage()
    console.log("vao new page 9")
    await page.goto(facebookHome, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    })
  }
  try {
    if (!cursor) {
      requestOptions = await getRequestOptions(source.type, source.id, account.fbId, account.token, browserConfig)
      console.log("requestOptions", requestOptions)
      res = await (await page.request.fetch(url, {...requestOptions, timeout: 180000})).text()

      res = normalizeResponse(res)
      console.log("resssssssssssss", res)
      if (res?.errorSummary) {
        console.log(res)
        return null
      }
      if (typeof res == "string") {
        return null
      }

      results = getPostsFromResponse(res)
      callback(results)
    } else {
      results = {posts: [], nextCursors: [cursor]}
    }
    while (!(results?.nextCursors?.length == 0 || results?.posts?.every((p) => p.postedAt < lastCrawlTime))) {
      requestOptions = await getRequestOptions(
        source.type,
        source.id,
        account.fbId,
        account.token,
        browserConfig,
        results?.nextCursors.pop(),
      )
      res = await (await page.request.fetch(url, {...requestOptions, timeout: 180000})).text()
      res = normalizeResponse(res)
      if (res?.errorSummary) {
        console.log(res)
        break
      }
      if (typeof res == "string") {
        console.log(res)
        break
      }
      results = getPostsFromResponse(res)
      callback(results)
    }
    account.cookies = JSON.stringify(await context.storageState())
    if (page.url() === facebookHome) {
      await page.request.dispose()
      await page.close()
    }
  } catch (error) {
    console.log(error)
    if (page.url() === facebookHome) {
      await page.request.dispose()
      await page.close()
    }
  }
}

export const getPostsFromSourceMbasic = async (
  context: BrowserContext,
  account: fbAccounts,
  source: sources,
  socket: Socket,
  listTopics: topics[],
  prisma: PrismaClient,
  producer: Producer,
  redisClient: any,
) => {
  let lastCrawlTime = source?.lastCrawledAt || moment().add(-2, "days").toDate()
  let now = new Date()
  now.setDate(now.getDate() - 2)
  if (new Date(lastCrawlTime) < new Date(now)) {
    lastCrawlTime = new Date(now)
  }
  if (source.type && account.fbId && account.token && context) {
    console.log("Get posts from source", source.link, account.id)
    if (source.name === "Log in to Facebook" || !source.avatar) {
      const result = await getSourceFromUrlMbasic(context, source.link)
      await prisma.sources.update({
        where: {
          id: source.id,
        },
        data: {
          // id: result.id,
          type: (result?.type || "FB_PAGE") as SOURCE_TYPE,
          name: result?.name || "",
          avatar: result?.avatar || "",
        },
      })
    }
    let page = await context.newPage()
    try {
      await page.route("**/*", (route) => {
        return route.request()?.resourceType() === "image" ? route.abort() : route.continue()
      })
      let reqLink
      if (source.type === "FB_ACCOUNT" || source.type == "FB_PAGE") {
        reqLink =
          source.link
            .replace("https://www.facebook.com", "https://mbasic.facebook.com")
            .replace("https://facebook.com", "https://mbasic.facebook.com") + "?v=timeline"
      } else {
        reqLink =
          source.link
            .replace("https://www.facebook.com", "https://mbasic.facebook.com")
            .replace("https://facebook.com", "https://mbasic.facebook.com") +
          "/search?q=a&filters=eyJycF9jaHJvbm9fc29ydDowIjoie1wibmFtZVwiOlwiY2hyb25vc29ydFwiLFwiYXJnc1wiOlwiXCJ9IiwicnBfY3JlYXRpb25fdGltZTowIjoie1wibmFtZVwiOlwiY3JlYXRpb25fdGltZVwiLFwiYXJnc1wiOlwie1xcXCJzdGFydF95ZWFyXFxcIjpcXFwiMjAyM1xcXCIsXFxcInN0YXJ0X21vbnRoXFxcIjpcXFwiMjAyMy0xXFxcIixcXFwiZW5kX3llYXJcXFwiOlxcXCIyMDIzXFxcIixcXFwiZW5kX21vbnRoXFxcIjpcXFwiMjAyMy0xMlxcXCIsXFxcInN0YXJ0X2RheVxcXCI6XFxcIjIwMjMtMS0xXFxcIixcXFwiZW5kX2RheVxcXCI6XFxcIjIwMjMtMTItMzFcXFwifVwifSJ9"
      }
      let listPosts: any[] = []
      let countReq: number = 0
      await prisma.sources.update({
        where: {
          id: source.id,
        },
        data: {
          lastCrawledAt: new Date(),
        },
      })
      while (countReq < 7) {
        await page.goto(reqLink, {
          waitUntil: "domcontentloaded",
          timeout: 180000,
        })
        let resultEvaluate = await page.evaluate(() => {
          try {
            const listArticlesElement = document.querySelectorAll("article")
            let nextLink = document?.querySelector("section +div")?.querySelector("a")?.getAttribute("href") || ""
            if (nextLink == "") {
              nextLink = document?.querySelector("#recent +div")?.querySelector("a")?.getAttribute("href") || ""
            }
            if (!nextLink.startsWith("http")) {
              nextLink = "https://mbasic.facebook.com" + nextLink
            }
            return {
              listArticles: Array.from(listArticlesElement)?.map((article) => {
                try {
                  let postId =
                    Array.from((article?.childNodes?.[1] as HTMLElement)?.querySelectorAll("a"))
                      ?.find((e) => e.getAttribute("href")?.includes("reaction"))
                      ?.getAttribute("href")
                      ?.match(/ft_id.*?&/g)?.[0]
                      ?.slice(6, -1) || ""
                  if (postId !== "") {
                    const textContent = article?.childNodes?.[0]?.childNodes?.[1]?.textContent || ""
                    const renderedContent = (article?.childNodes?.[0] as HTMLElement)?.innerHTML || ""
                    const videoContents =
                      Array.from(article?.querySelectorAll("a"))
                        ?.map((a) => a?.getAttribute("href"))
                        ?.filter((e) => e?.startsWith("/video_redirect"))
                        ?.map((e) => decodeURI("https://mbasic.facebook.com" + e)) || []
                    const reaction = article?.childNodes?.[1]?.childNodes?.[1]?.textContent
                      ?.replaceAll(".", "")
                      ?.match(/\d+/g)
                      ?.map((e) => Number(e)) || [0, 0]
                    const totalReactions = (reaction?.[0] || 0) + (reaction?.[1] || 0) * 2
                    const checkLang = article?.childNodes?.[1]?.childNodes?.[0]?.textContent?.includes("Public")
                      ? "en"
                      : "vi" || "vi"
                    const postedAt = article?.childNodes?.[1]?.childNodes?.[0]?.childNodes?.[0]?.textContent || ""

                    return {
                      id: postId,
                      link: "https://www.facebook.com/" + postId,
                      type: "FB_POST",
                      textContent,
                      renderedContent,
                      title: "",
                      videoContents,
                      likes: reaction?.[0] || 0,
                      shares: 0,
                      comments: reaction?.[1] || 0,
                      totalReactions,
                      postedAt,
                      checkLang,
                    }
                  }
                  return null
                } catch (error) {
                  console.log("Error when map", error)
                  return null
                }
              }),
              nextLink,
            }
          } catch (error) {
            console.log("Error when evaluate", error)
            return null
          }
        })
        if (resultEvaluate) {
          let tempListPost = resultEvaluate.listArticles
            .filter((e) => e != null)
            .map((e) => {
              const convertPostedAt = convertTime(e.postedAt, e.checkLang)
              delete e.checkLang
              return {...e, postedAt: convertPostedAt}
            })
            .filter((e) => e != null)

          let tempListPostFilterTime = tempListPost.filter((e) => e.postedAt > lastCrawlTime)
          for (const post of tempListPostFilterTime) {
            if (await redisClient.get(post.id)) {
              console.log("Id visited: ", post.id)
            } else {
              if (post?.textContent) {
                console.log("New id: ", post.id)
                await redisClient.set(post.id, 1, {
                  EX: 60 * 60 * 24,
                })
                const result = await getPostInfor(post.link, context)
                if (result === null) {
                  page.waitForTimeout(5000)
                  console.log("Error null ne")
                }
                if (source.type === "FB_GROUP") {
                  listPosts.push({
                    ...post,
                    ...(result && result?.renderedContent !== "" && {renderedContent: result?.renderedContent}),
                    ...(result && result?.textContent !== "" && {textContent: result?.textContent}),
                    imageContents: result?.imageContents,
                    sourceInfo: {
                      authorAvartar: result?.sourceAvatar || "",
                      authorTitle: result?.sourceTitle || "",
                      sourceAvatar: result?.groupImage || "",
                      authorId: result?.sourceId || "",
                    },
                  })
                } else {
                  listPosts.push({
                    ...post,
                    ...(result && result?.renderedContent !== "" && {renderedContent: result.renderedContent}),
                    ...(result && result?.textContent !== "" && {textContent: result.textContent}),
                    imageContents: result?.imageContents || [],
                    sourceInfo: {sourceAvatar: result?.sourceAvatar || ""},
                  })
                }
              }
            }
          }
          if (listPosts.length >= 10) {
            while (listPosts.length >= 10) {
              try {
                const processLinks = listPosts.splice(0, 10)
                await filterAndSaveContent(
                  processLinks,
                  socket,
                  listTopics,
                  context,
                  prisma,
                  "FACEBOOK",
                  producer,
                  source,
                )
              } catch (error) {
                console.log("Error when crawl link website", error)
              }
            }
          }

          if (tempListPost.length - tempListPostFilterTime.length >= 3 && source.type !== "FB_GROUP") {
            break
          } else if (source.type === "FB_GROUP" && tempListPostFilterTime.length <= 1) {
            break
          } else {
            await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5000) + 3000))
            reqLink = resultEvaluate.nextLink
            if (reqLink === "https://mbasic.facebook.com" || reqLink.includes("timeend=")) {
              break
            }
          }
        } else if (resultEvaluate.listArticles.length == 0) {
          console.log("Maybe Block when go to source link")
        }
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 10000) + 30000))
        countReq += 1
      }

      await page.request.dispose()
      await page.close()

      if (listPosts.length > 0) {
        await filterAndSaveContent(listPosts, socket, listTopics, context, prisma, "FACEBOOK", producer, source)
      }
    } catch (error) {
      console.log("Error when crawl facebook from source: ", error)
      console.log("source", source)
      if (page) {
        await page.close()
      }
    }
  }
}
export const getPostInfor = async (link: string, context: BrowserContext) => {
  try {
    let page = await context.newPage()
    await page.route("**/*", (route) => {
      return route.request()?.resourceType() === "image" ? route.abort() : route.continue()
    })

    let allCss = ""
    try {
      page.on("response", async (response) => {
        if (response.url().includes(".css") && response.status() === 200) {
          try {
            allCss = allCss + (await response.body())
          } catch (error) {}
        }
      })
    } catch (error) {
      console.log("Error when get css page", error)
    }

    await page.goto(link, {
      waitUntil: "networkidle",
      timeout: 60000,
    })
    if (page.url().includes("facebook.com/watch/?v=")) {
      const result = await getVideoInfor(link, context)
      await page.request.dispose()
      await page.close()
      return {...result}
    }
    let resultEvaluate = await page.evaluate(() => {
      try {
        const article = document.querySelector('div[role="article"]')
        let sourceTitle =
          article.querySelector("h2")?.textContent?.replace("Tài khoản đã xác minh", "") ||
          article.querySelector("h3")?.textContent?.replace("Tài khoản đã xác minh", "") ||
          ""
        if (article && sourceTitle !== "") {
          const sourceAvatar = article.querySelector("image")?.getAttribute("xlink:href") || ""
          const linkSource =
            article?.querySelector("h2")?.querySelector("a")?.getAttribute("href") ||
            article?.querySelector("h3")?.querySelector("a")?.getAttribute("href")
          let sourceId = ""
          if (linkSource) {
            sourceId = linkSource?.match(new RegExp("user/" + "(.*)" + "/"))?.[1] || ""
          }
          const renderedContent =
            article.innerHTML.replaceAll("\\x3C!--$-->", "").replaceAll("\\x3C!--/$--> ", "") || ""
          const textContent = article.querySelector('div[dir="auto"]')?.textContent || ""
          const listLinks = Array.from(article.querySelectorAll("a"))
          const imageContentsParentElement = listLinks.filter(
            (e) => e.getAttribute("href").includes("/photo/?fbid=") || e.getAttribute("href").includes("/photos/a."),
          )
          const imageContents = imageContentsParentElement
            .map((e) => e.querySelector("img")?.getAttribute("src"))
            .filter((e) => e !== null)
          const groupImage =
            document.querySelector("img[data-imgperflogname='profileCoverPhoto']")?.getAttribute("src") || ""
          return {
            sourceAvatar,
            sourceTitle,
            sourceId,
            renderedContent,
            textContent,
            imageContents,
            groupImage,
          }
        }
        return null
      } catch (error) {
        console.log("Error when evaluate post", error)

        return null
      }
    })
    if (resultEvaluate) {
      await page.waitForTimeout(Math.random() * 10000 + 3000)
      await page.request.dispose()
      await page.close()
      const renderedContent =
        "<div>" +
        resultEvaluate.renderedContent +
        "<style>" +
        allCss.replaceAll("white-space:pre-wrap", "white-space:normal") +
        "</style>" +
        "</div>"
      return {...resultEvaluate, renderedContent: renderedContent}
    } else {
      resultEvaluate = await page.evaluate(() => {
        try {
          const article = Array.from(document.querySelectorAll("div[style^='border-radius']")).filter(
            (e) => e.querySelector("h2") || e.querySelector("h3"),
          )[0]
          if (article) {
            const sourceAvatar = article.querySelector("image")?.getAttribute("xlink:href") || ""
            const sourceTitle =
              article.querySelector("h2")?.textContent || article.querySelector("h3")?.textContent || ""
            const linkSource =
              article?.querySelector("h2")?.querySelector("a")?.getAttribute("href") ||
              article?.querySelector("h3")?.querySelector("a")?.getAttribute("href")
            let sourceId = ""
            if (linkSource) {
              sourceId = linkSource?.match(new RegExp("user/" + "(.*)" + "/"))?.[1] || ""
            }

            const renderedContent =
              article.innerHTML.replaceAll("\\x3C!--$-->", "").replaceAll("\\x3C!--/$--> ", "") || ""
            const textContent = article.querySelector('div[dir="auto"]')?.textContent || ""
            const listLinks = Array.from(article.querySelectorAll("a"))
            const imageContentsParentElement = listLinks.filter(
              (e) => e.getAttribute("href").includes("/photo/?fbid=") || e.getAttribute("href").includes("/photos/a."),
            )
            const imageContents = imageContentsParentElement
              .map((e) => e.querySelector("img")?.getAttribute("src"))
              .filter((e) => e !== null)
            const groupImage =
              document.querySelector("img[data-imgperflogname='profileCoverPhoto']")?.getAttribute("src") || ""
            return {
              sourceAvatar,
              sourceTitle,
              sourceId,
              renderedContent,
              textContent,
              imageContents,
              groupImage,
            }
          }
          return null
        } catch (error) {
          console.log("Error when evaluate post", error)
          return null
        }
      })
      await page.waitForTimeout(Math.random() * 10000 + 2000)
      await page.request.dispose()
      await page.close()
      if (resultEvaluate) {
        const renderedContent =
          "<div>" +
          resultEvaluate.renderedContent +
          "<style>" +
          allCss.replaceAll("white-space:pre-wrap", "white-space:normal") +
          "</style>" +
          "</div>"
        return {...resultEvaluate, renderedContent: renderedContent}
      } else {
        console.log("Error ne, keim tra di ")
        console.log(link)
        return null
      }
    }
  } catch (error) {
    console.log("Error when get post infor", error)
    return null
  }
}
export const getVideoInfor = async (link: string, context: BrowserContext) => {
  try {
    let page = await context.newPage()
    await page.route("**/*", (route) => {
      return route.request()?.resourceType() === "image" ? route.abort() : route.continue()
    })
    let allCss = ""
    try {
      page.on("response", async (response) => {
        if (response.url().includes(".css") && response.status() === 200) {
          try {
            allCss = allCss + (await response.body())
          } catch (error) {}
        }
      })
    } catch (error) {
      console.log("Error when get all css of page", error)
    }

    await page.goto(link, {
      waitUntil: "networkidle",
      timeout: 60000,
    })
    const resultEvaluate = await page.evaluate(() => {
      try {
        const watch_feed = document.querySelector("#watch_feed")
        const article = watch_feed?.querySelector("div[style]") || null
        if (article) {
          const sourceAvatar =
            article.querySelector('image[style="height: 40px; width: 40px;"]')?.getAttribute("xlink:href") ||
            article.querySelector('image[style="height: 40px; width: 40px;"]')?.getAttribute("href") ||
            ""
          const sourceTitle = article.querySelector("h2")?.textContent || ""

          const arrSeemore = Array.from(article.querySelectorAll('div[role="button"]')).filter(
            (e) => e.textContent === "See more" || e.textContent === "Xem thêm",
          )
          if (arrSeemore.length > 0) {
            //@ts-ignore
            arrSeemore[0].click()
          }
          const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
          sleep(1000)
          const renderedContent = article.innerHTML || ""
          let textContent = ""
          const arrTextContent =
            Array.from(article.querySelectorAll('span[dir="auto"][style]:not([rel=""]'))?.map((e) => {
              if (
                e?.textContent.toLowerCase() === "like" ||
                e?.textContent.toLowerCase() === "comment" ||
                e?.textContent.toLowerCase() === "share" ||
                e?.textContent.toLowerCase() === "following" ||
                e?.textContent.toLowerCase() === "overview" ||
                e?.textContent.toLowerCase() === "most relevant" ||
                e?.textContent.toLowerCase() === "thích" ||
                e?.textContent.toLowerCase() === "bình luận" ||
                e?.textContent.toLowerCase() === "chia sẻ" ||
                e?.textContent.toLowerCase() === "tổng quan" ||
                e?.textContent.toLowerCase() === "overview" ||
                e?.textContent.toLowerCase() === "phù hợp nhất"
              ) {
                return ""
              }
              return e?.textContent
            }) || null
          if (arrTextContent) {
            textContent = arrTextContent?.join(" ") || ""
          } else {
            textContent = article.querySelector('div[dir="auto"]')?.textContent || ""
          }
          return {
            sourceAvatar,
            sourceTitle,
            renderedContent,
            textContent,
            imageContents: [],
            groupImage: "",
            sourceId: "",
          }
        }
        return null
      } catch (error) {
        console.log("Error when evaluate video", error)
        return null
      }
    })

    if (resultEvaluate) {
      await page.waitForTimeout(Math.random() * 7000 + 2000)
      await page.request.dispose()
      await page.close()
      const renderedContent =
        "<div>" +
        resultEvaluate.renderedContent +
        "<style>" +
        allCss.replaceAll("white-space:pre-wrap", "white-space:normal") +
        "</style>" +
        "</div>"
      return {...resultEvaluate, renderedContent: renderedContent}
    } else {
      console.log("Check xem sao bi null ne")
      console.log(link)
      await page.waitForTimeout(1000)
      await page.waitForTimeout(Math.random() * 2000 + 1000)
      await page.request.dispose()
      await page.close()
    }
  } catch (error) {
    console.log("Error when get post infor", error)
    return null
  }
}
export const getSourceFromUrl = async (context: BrowserContext, account: fbAccounts, url: string) => {
  const pattern = /^(https?:\/\/)?((www|(m(basic)?))\.)?(facebook|fb)\.com\//gi
  if (url.match(pattern)) {
    const href = url.replace(pattern, "").split("?")[0]
    // console.log(href)
    const page = await context.newPage()
    console.log("vao new page 7")
    try {
      await page.goto(`https://m.facebook.com/${href}`, {
        waitUntil: "domcontentloaded",
        timeout: 180000,
      })

      const result = await page.evaluate((SOURCE_TYPE) => {
        const html = document
        const body = html.querySelector("*")?.outerHTML
        let profilePicture =
          html.querySelector("#timelineBody img.profpic.img")?.getAttribute("src") ||
          (html.querySelector("#m-timeline-cover-section a i.profpic") as any)?.style?.backgroundImage?.match(
            /url\("(.+)"/,
          )[1]
        let profileName =
          html.querySelector("#cover-name-root h3")?.textContent ||
          html.querySelector("#m-timeline-cover-section strong")?.textContent
        let name = html.querySelector("title")?.textContent
        const pagePicture = html.querySelector("#msite-pages-header-contents img")?.getAttribute("src")
        const pageName = html.querySelector('div[data-nt="FB:TEXT4"]')?.textContent

        let groupName = html.querySelector(".groupChromeView h1")?.textContent
        let groupPicture = html
          .querySelector(".groupChromeView a i")
          ?.getAttribute("style")
          ?.match(/url\('(.+)'/)![1]
          ?.replace(/\\3a/g, ":")
          .replace(/\\3d/g, "=")
          .replace(/\\26/g, "&")
          .replace(/\s/g, "")
          .replace(/\\/g, "")

        if (!profileName && !profilePicture && !groupName && !groupPicture && !pageName && !pagePicture) {
          const matchCodes = body?.match(/<!-- <div(.+?)<\/div> -->/g)
          if (matchCodes)
            for (let code of matchCodes) {
              code = code.replace("<!--", "").replace("-->", "").trim()
              const html = parse(code)
              profilePicture =
                html.querySelector("#timelineBody img.profpic.img")?.getAttribute("src") ||
                html
                  .querySelector("#m-timeline-cover-section a i.img.profpic")
                  ?.getAttribute("style")
                  ?.match(/url\('(.+)'/)![1]
                  ?.replace(/\\3a/g, ":")
                  .replace(/\\3d/g, "=")
                  .replace(/\\26/g, "&")
                  .replace(/\s/g, "")
                  .replace(/\\/g, "")
              profileName =
                html.querySelector("#cover-name-root h3")?.textContent ||
                html.querySelector("#m-timeline-cover-section strong")?.textContent

              groupName = html.querySelector(".groupChromeView h1")?.textContent
              groupPicture = html
                .querySelector(".groupChromeView a i")
                ?.getAttribute("style")
                ?.match(/url\('(.+)'/)![1]
                ?.replace(/\\3a/g, ":")
                .replace(/\\3d/g, "=")
                .replace(/\\26/g, "&")
                .replace(/\s/g, "")
                .replace(/\\/g, "")
              if ((profileName && profilePicture) || (groupName && groupPicture)) {
                break
              }
            }
        }

        const idPattern = /(?<=entity_id:)\d+/gi
        const idPattern2 = /(\/messages\/thread\/)\d+/gi
        const idPattern3 = /(\/add\?subject_id=)\d+/gi
        const idPattern4 = /(\/pages\/more\/)\d+/gi
        let matchId
        if (body?.match(idPattern)) {
          matchId = body?.match(idPattern)[0]
        } else if (body?.match(idPattern2)) {
          matchId = body?.match(idPattern2)[0].substring(17)
        } else if (body?.match(idPattern3)) {
          matchId = body?.match(idPattern3)[0].substring(16)
        } else if (body?.match(idPattern4)) {
          matchId = body?.match(idPattern4)[0].substring(12)
        }
        if (matchId) {
          return {
            id: matchId,
            type: profileName ? SOURCE_TYPE.FB_ACCOUNT : pageName ? SOURCE_TYPE.FB_PAGE : SOURCE_TYPE.FB_GROUP,
            avatar: profilePicture || pagePicture || groupPicture,
            name: profileName || pageName || groupName || name,
          }
        } else {
          return null
        }
      }, SOURCE_TYPE)

      account.cookies = JSON.stringify(await context.storageState())
      await page.close()
      return result
    } catch (error) {
      console.log(error)
      if (page) await page.close()
    }
  }
  return null
}
export const getSourceFromUrlMbasic = async (context: BrowserContext, url: string) => {
  const pattern = /^(https?:\/\/)?((www|(m(basic)?))\.)?(facebook|fb)\.com\//gi
  if (url.match(pattern)) {
    const href = url.replace(pattern, "").split("?")[0]
    // console.log(href)
    const page = await context.newPage()
    await page.route("**/*", (route) => {
      return route.request().resourceType() === "image" ? route.abort() : route.continue()
    })
    try {
      await page.goto(`https://mbasic.facebook.com/${href}`, {
        waitUntil: "domcontentloaded",
        timeout: 180000,
      })

      let result = await page.evaluate(() => {
        try {
          const body = document.querySelector("*")?.outerHTML
          let profilePicture =
            Array.from(document.querySelectorAll("img"))
              ?.filter(
                (e) =>
                  e.getAttribute("alt")?.toLowerCase()?.includes("profile picture") ||
                  e.getAttribute("alt")?.toLowerCase()?.includes("ảnh đại diện"),
              )[0]
              ?.getAttribute("src") || ""

          let profileName = document.querySelector("title").textContent

          const idPattern = /(?<=entity_id:)\d+/gi
          const idPattern2 = /(\/messages\/thread\/)\d+/gi
          const idPattern3 = /(\/add\?subject_id=)\d+/gi
          const idPattern4 = /(\/pages\/more\/)\d+/gi
          const idPattern5 = /(\/?group_id=)\d+/gi
          let matchId
          if (body?.match(idPattern)) {
            matchId = body?.match(idPattern)[0]
          } else if (body?.match(idPattern2)) {
            matchId = body?.match(idPattern2)[0].substring(17)
          } else if (body?.match(idPattern3)) {
            matchId = body?.match(idPattern3)[0].substring(16)
          } else if (body?.match(idPattern4)) {
            matchId = body?.match(idPattern4)[0].substring(12)
          } else if (body?.match(idPattern5)) {
            matchId = body?.match(idPattern5)[0].replace("group_id=", "")
          }
          let link = window?.location?.href?.replace("https://mbasic.facebook.com", "https://www.facebook.com") || null
          if (link.endsWith("/")) {
            link = link.substring(0, link.length - 1)
          }
          if (matchId) {
            return {
              id: matchId,
              link,
              type: body?.match(idPattern5)
                ? "FB_GROUP"
                : body.includes("Tìm hỗ trợ hoặc báo cáo trang cá nhân")
                ? "FB_ACCOUNT"
                : "FB_PAGE",
              avatar: profilePicture,
              name: profileName,
            }
          } else {
            return null
          }
        } catch (error) {
          console.log("Error when evaluate new source", error)
          return null
        }
      })
      if (result?.type == "FB_GROUP") {
        try {
          await page.goto(`https://www.facebook.com/${href}`, {
            waitUntil: "networkidle",
            timeout: 180000,
          })
          const coverImage = await page.evaluate(() => {
            return document.querySelector("img[data-imgperflogname='profileCoverPhoto']")?.getAttribute("src")
          })
          result.avatar = coverImage
        } catch (error) {
          console.log("Error when get coverImage Group: ", error)
        }
      }

      await page.close()
      return result
    } catch (error) {
      console.log(error)
      if (page) await page.close()
    }
  }
  return null
}

export const checkPostUrl = async (context: BrowserContext, account: fbAccounts, url: string) => {
  const pattern = /^(https?:\/\/)?((www|(m(basic)?))\.)?(facebook|fb)\.com\//gi
  if (url.match(pattern)) {
    const href = url.replace(pattern, "")
    const page = await context.newPage()
    try {
      await page.goto(`view-source:https://mbasic.facebook.com/${href}`, {
        waitUntil: "domcontentloaded",
        timeout: 180000,
      })
      const body = await page.evaluate(() => {
        return document.querySelector("*")?.outerHTML
      })
      account.cookies = JSON.stringify(await context.storageState())
      await page.close()
      if (body?.match(/#m_story_permalink_view/gi)) {
        return true
      } else {
        return false
      }
    } catch (error) {
      console.log(error)
      if (page) await page.close()
    }
  }
  return false
}

export const getGroupsOfAccount = async (browserConfig: BrowserConfig, account: fbAccounts, targetId: string) => {
  let requestOptions = undefined,
    res = undefined
  const url = "https://www.facebook.com/api/graphql/"
  const facebookHome = "https://www.facebook.com"
  const {context} = browserConfig
  if (!account.fbId || !account.token) {
    return []
  }
  let page = context.pages().find((page) => page.url().startsWith(facebookHome))
  if (!page) {
    page = await context.newPage()
    await page.goto(facebookHome, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    })
  }
  try {
    let cursor = ""
    let newGroups = []
    do {
      requestOptions = await getRequestOptions(
        "groupList",
        targetId,
        account.fbId,
        account.token,
        browserConfig,
        cursor,
      )
      const response = await page.request.fetch(url, {...requestOptions, timeout: 180000})
      const responseText = await response.text()
      res = normalizeResponse(responseText)[0]
      const groupIds = res?.data?.viewer?.groups_tab?.tab_groups_list?.edges?.map((e: any) => e?.node?.id) || []
      newGroups = groupIds.filter((id: string) => !account.groupIds?.includes(id))
      account.groupIds = Array.from(new Set([...account.groupIds, ...newGroups]))
      cursor =
        res?.data?.viewer?.groups_tab?.tab_groups_list?.page_info?.has_next_page &&
        res?.data?.viewer?.groups_tab?.tab_groups_list?.page_info?.end_cursor
    } while (newGroups && newGroups.length && cursor)

    account.cookies = JSON.stringify(await context.storageState())
    if (page.url() === facebookHome) {
      await page.request.dispose()
      await page.close()
    }
    return account.groupIds
  } catch (error) {
    console.log(error)
    if (page.url() === facebookHome) {
      await page.request.dispose()
      await page.close()
    }
    return null
  }
}

export const singleRequest = async (browserConfig: BrowserConfig, {friendlyName, docId, referer, variables}: any) => {
  const {context} = browserConfig
  const url = "https://www.facebook.com/api/graphql/"
  const facebookHome = "https://www.facebook.com"
  let res = undefined
  let page = context.pages().find((page) => page.url().startsWith(facebookHome))
  try {
    if (!page) {
      page = await context.newPage()
      await page.goto(facebookHome, {
        waitUntil: "domcontentloaded",
        timeout: 180000,
      })
    }
    const requestOptions = {
      headers: {
        ...browserConfig.defaultHeaders,
        "x-fb-friendly-name": friendlyName,
        Referer: `${facebookHome}${referer ? `/${referer}` : ""}`,
      },
      method: "POST",
      form: {
        ...browserConfig.defaultBody,
        fb_api_req_friendly_name: friendlyName,
        doc_id: docId,
        variables: JSON.stringify(variables),
      },
    }
    res = await (await page.request.fetch(url, {...requestOptions, timeout: 180000})).text()
    res = normalizeResponse(res)[0]
    if (page.url() === facebookHome) {
      await page.request.dispose()
      await page.close()
    }
    if (res?.errorSummary) {
      console.log(res)
      return null
    }
    if (typeof res == "string") {
      console.log("response string")
      return null
    }
    return res
  } catch (error) {
    console.log(error)
    if (page && page.url() === facebookHome) {
      await page.request.dispose()
      await page.close()
    }
  }
}

export const getHoverCardInfo = async (browserConfig: BrowserConfig, targetId: string) => {
  return await singleRequest(browserConfig, {
    friendlyName: "CometHovercardQueryRendererQuery",
    docId: "6304732502874815",
    referer: "",
    variables: {
      actionBarRenderLocation: "WWW_COMET_HOVERCARD",
      context: "DEFAULT",
      entityID: targetId,
      includeTdaInfo: false,
      scale: 1,
      __relay_internal__pv__GlobalPanelEnabledrelayprovider: false,
      __relay_internal__pv__CometGlobalPanelEMCopresencerelayprovider: false,
    },
  })
}

export const setNotificationForGroup = async (browserConfig: BrowserConfig, account: fbAccounts, groupId: string) => {
  return !!(await singleRequest(browserConfig, {
    friendlyName: "useGroupsCometUpdateSubscriptionLevelMutation",
    referer: `/groups/${groupId}`,
    docId: "4673436586101853",
    variables: {
      input: {
        client_mutation_id: "1",
        actor_id: account.fbId,
        group_id: groupId,
        setting: "ALL_POSTS",
        source: "groups_settings_tab",
      },
    },
  }))
}

export const setJoinGroupAnswers = async (
  browserConfig: BrowserConfig,
  account: fbAccounts,
  groupId: string,
  answers: Array<{
    answer: string | null
    question_id: string
    selected_options: Array<string> | null
  }>,
) => {
  return !!(await singleRequest(browserConfig, {
    friendlyName: "useGroupMembershipAnswersSaveMutation",
    referer: `/groups/${groupId}`,
    docId: "5453318931456900",
    variables: {
      input: {
        answers,
        group_id: groupId,
        rules_agreement_status: "ACCEPT_RULES",
        actor_id: account.fbId,
        client_mutation_id: "1",
      },
      inviteShortLinkKey: null,
      imageMediaType: "image/x-auto",
      isChainingRecommendationUnit: false,
      profileID: null,
      scale: 1,
      groupID: groupId,
      __relay_internal__pv__CometGlobalPanelEMCopresencerelayprovider: false,
      __relay_internal__pv__GroupsCometEntityMenuEmbeddedrelayprovider: false,
    },
  }))
}

export const getGroupMembershipQuestions = async (browserConfig: BrowserConfig, groupId: string) => {
  const res = await singleRequest(browserConfig, {
    friendlyName: "GroupsCometMembershipQuestionsDialogQuery",
    referer: `/groups/${groupId}`,
    docId: "6235798386436453",
    variables: {group_id: groupId, scale: 1},
  })

  const questionsToJoin = res?.data?.group?.if_viewer_can_see_membership_questions?.questions
  /*
  [
    {
      "id": "5852974308048327",
      "can_viewer_report": true,
      "question": "Are you a bot?",
      "question_type": "PARAGRAPH",
      "question_options": [],
      "answer": "Hello",
      "selected_options": null
    },
    {
      "id": "5852976748048083",
      "can_viewer_report": true,
      "question": "Some thing you love?",
      "question_type": "CHECKBOXES",
      "question_options": [
        {
          "id": "5852976744714750",
          "question_option": "Me"
        },
        {
          "id": "5852976751381416",
          "question_option": "You"
        },
        {
          "id": "5852976741381417",
          "question_option": "No one"
        }
      ],
      "answer": null,
      "selected_options": ["5852976744714750", "5852976751381416"]
    },
    {
      "id": "5852980138047744",
      "can_viewer_report": true,
      "question": "Select something more",
      "question_type": "MULTIPLE_CHOICE",
      "question_options": [
        {
          "id": "5852980141381077",
          "question_option": "OOnne oopttioonn"
        },
        {
          "id": "5852980148047743",
          "question_option": "MManyooppttion"
        },
        {
          "id": "5852980144714410",
          "question_option": "GGoodd ooption"
        },
        {
          "id": "5852980151381076",
          "question_option": "vveẻyy ggôggllee"
        }
      ],
      "answer": null,
      "selected_options": ["5852980151381076"]
    }
  ]
  */

  const name = res?.data?.group?.name
  const avatar = (res?.data?.group?.profile_pic || res?.data?.group?.profile_picture)?.uri

  return {
    name,
    avatar,
    questionsToJoin,
  }
}

export const setRequestJoinGroup = async (browserConfig: BrowserConfig, account: fbAccounts, groupId: string) => {
  return !!(await singleRequest(browserConfig, {
    friendlyName: "useGroupRequestToJoinMutation",
    docId: "5505651589531457",
    referer: `/groups/${groupId}`,
    variables: {
      feedType: "DISCUSSION",
      groupID: groupId,
      imageMediaType: "image/x-auto",
      input: {
        client_mutation_id: "1",
        actor_id: account.fbId,
        group_id: groupId,
        group_share_tracking_params: {
          app_id: "2220391788200892",
          exp_id: "null",
          is_from_share: false,
        },
        source: "group_mall",
      },
      inviteShortLinkKey: null,
      isChainingRecommendationUnit: false,
      isEntityMenu: false,
      scale: 1,
      renderLocation: "group_mall",
      __relay_internal__pv__CometGlobalPanelEMCopresencerelayprovider: false,
      __relay_internal__pv__GroupsCometEntityMenuEmbeddedrelayprovider: false,
    },
  }))
}

export const getJoinGroupState = async (browserConfig: BrowserConfig, groupId: string) => {
  const res = await getHoverCardInfo(browserConfig, groupId)
  const group = res?.data?.node?.comet_hovercard_renderer?.group
  const actionMenu = group?.join_action_with_menu
  const result = {
    id: group?.id || groupId,
    name: group?.name,
    link: group?.url,
    avatar: group?.profile_picture?.uri,
    joinStatus: "",
  }
  if (actionMenu) {
    if (actionMenu.group?.join_or_follow_button_shortened_cta_content) {
      if (actionMenu?.group?.viewer_join_state == "REQUESTED") {
        result.joinStatus = "REQUESTED"
      } else {
        result.joinStatus = "NOT_JOIN"
      }
    } else {
      result.joinStatus = "JOINED"
    }
  }
  return result
}
export const searchFacebook = async (
  context: BrowserContext,
  account: fbAccounts,
  socket: Socket,
  listTopics: topics[],
  keyword: string,
  prisma: PrismaClient,
  producer: Producer,
  redisClient: any,
) => {
  const basicLink = "https://mbasic.facebook.com"
  const postFilterParam =
    "eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9IiwicnBfY3JlYXRpb25fdGltZTowIjoie1wibmFtZVwiOlwiY3JlYXRpb25fdGltZVwiLFwiYXJnc1wiOlwie1xcXCJzdGFydF95ZWFyXFxcIjpcXFwiMjAyM1xcXCIsXFxcInN0YXJ0X21vbnRoXFxcIjpcXFwiMjAyMy0xXFxcIixcXFwiZW5kX3llYXJcXFwiOlxcXCIyMDIzXFxcIixcXFwiZW5kX21vbnRoXFxcIjpcXFwiMjAyMy0xMlxcXCIsXFxcInN0YXJ0X2RheVxcXCI6XFxcIjIwMjMtMS0xXFxcIixcXFwiZW5kX2RheVxcXCI6XFxcIjIwMjMtMTItMzFcXFwifVwifSJ9"
  const videoFilter =
    "eyJ2aWRlb3Nfc29ydF9ieTowIjoie1wibmFtZVwiOlwidmlkZW9zX3NvcnRfYnlcIixcImFyZ3NcIjpcIk1vc3QgUmVjZW50XCJ9IiwicnBfY3JlYXRpb25fdGltZTowIjoie1wibmFtZVwiOlwiY3JlYXRpb25fdGltZVwiLFwiYXJnc1wiOlwie1xcXCJzdGFydF95ZWFyXFxcIjpcXFwiMjAyM1xcXCIsXFxcInN0YXJ0X21vbnRoXFxcIjpcXFwiMjAyMy0wNVxcXCIsXFxcImVuZF95ZWFyXFxcIjpcXFwiMjAyM1xcXCIsXFxcImVuZF9tb250aFxcXCI6XFxcIjIwMjMtMDVcXFwiLFxcXCJzdGFydF9kYXlcXFwiOlxcXCIyMDIzLTA1LTE4XFxcIixcXFwiZW5kX2RheVxcXCI6XFxcIjIwMjMtMDUtMThcXFwifVwifSJ9"
  const videoDetail = "&eav=AfbJiCJEjPiGnCewTPGyg8y04Akaa7B3mHdYOEU7KwWFYoNxGqAepqykQ6VnjKv0e4c&__tn__=%2As&paipv=0"
  if (!account.fbId || !account.token || !context) {
    return
  }
  let now = new Date()
  now.setDate(now.getDate() - 2)
  let page = await context.newPage()
  try {
    await page.route("**/*", (route) => {
      return route.request().resourceType() === "image" ? route.abort() : route.continue()
    })

    console.log(`${new Date()} crawl keyword: ${keyword} by account ${account}`)

    keyword = keyword.replaceAll(" ", "+")
    let reqLink = `${basicLink}/search/posts/?q=${keyword}&filters=${postFilterParam}`
    let searchVideo = `${basicLink}/search/videos/?q=${keyword}&filters=${videoFilter}`
    let listPosts: any[] = []
    let countReq = 0
    let listVideos: any[] = []
    let countVideoReq = 0
    while (countReq < 5) {
      try {
        await page.goto(reqLink, {
          waitUntil: "domcontentloaded",
          timeout: 180000,
        })
        const resultEvaluate = await page.evaluate(() => {
          try {
            const listArticles = document.querySelectorAll("article")
            return {
              listArticles: Array.from(listArticles).map((article) => {
                try {
                  let postId =
                    Array.from((article?.childNodes?.[1] as HTMLElement)?.querySelectorAll("a"))
                      .find((e) => e.getAttribute("href")?.includes("reaction"))
                      ?.getAttribute("href")
                      ?.match(/ft_id.*?&/g)?.[0]
                      ?.slice(6, -1) || ""
                  if (postId != "") {
                    let sourceType = "FB_PAGE"
                    let sourceId = ""
                    let sourceTitle = ""
                    let authorId = ""
                    let authorTitle = ""
                    let headerLink =
                      Array.from(article?.querySelector("header")?.querySelectorAll("a"))?.map((e) =>
                        e.getAttribute("href"),
                      ) || []
                    if (headerLink.length === 1) {
                      if (headerLink[0].startsWith("/profile")) {
                        sourceType = "FB_ACCOUNT"
                        const prefix = "id="
                        const suffix = "&"
                        const idRegex = new RegExp(prefix + ".*?" + suffix, "g")
                        sourceId = headerLink?.[0]?.match(idRegex)?.[0] || ""
                        sourceId = sourceId.substring(3, sourceId.length - 1)
                      } else if (headerLink[0].includes("/albums/")) {
                        sourceType = "FB_ACCOUNT"
                        sourceId = headerLink[0].split("/")?.[1] || ""
                      } else {
                        sourceId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                      }
                      sourceTitle = article?.querySelector("header")?.querySelector("h3")?.textContent || ""
                    } else if (headerLink.length == 2) {
                      if (headerLink.some((e) => e.includes("groups"))) {
                        sourceType = "FB_GROUP"
                        authorId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                        sourceId = headerLink[1].split("/")?.[4] || ""
                        let titleArr =
                          article?.querySelector("header")?.querySelector("h3")?.textContent?.split(">") || []
                        sourceTitle = titleArr?.[1] || ""
                        authorTitle = titleArr?.[0] || ""
                      } else {
                        sourceId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                        sourceTitle =
                          article?.querySelector("header")?.querySelector("h3")?.querySelector("a")?.textContent || ""
                      }
                    } else {
                      sourceId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                    }

                    let textContent = article?.childNodes?.[0]?.childNodes?.[1]?.textContent || ""
                    const renderedContent = (article?.childNodes?.[0] as HTMLElement)?.innerHTML || ""
                    const imageContents =
                      Array.from((article?.childNodes?.[0] as HTMLElement)?.querySelectorAll("img"))?.map((e) =>
                        e.getAttribute("src"),
                      ) || []
                    const videoContents =
                      Array.from(article?.querySelectorAll("a"))
                        ?.map((a) => a?.getAttribute("href"))
                        ?.filter((e) => e?.startsWith("/video_redirect"))
                        ?.map((e) => decodeURI("https://mbasic.facebook.com" + e)) || []
                    const reaction = article?.childNodes?.[1]?.childNodes?.[1]?.textContent
                      ?.replaceAll(".", "")
                      ?.match(/\d+/g)
                      ?.map((e) => Number(e)) || [0, 0]

                    const totalReactions = reaction?.[0] || 0 + (reaction?.[1] || 0) * 2

                    const checkLang = article?.childNodes?.[1]?.childNodes?.[0]?.textContent?.includes("Công khai")
                      ? "vi"
                      : "en" || "vi"
                    const postedAt = article?.childNodes?.[1]?.childNodes?.[0]?.childNodes?.[0]?.textContent || ""
                    if (textContent.endsWith("Xem thêm") || textContent.endsWith("More")) {
                      const tempPostId = Array.from(article?.querySelectorAll("a"))
                        .find((e) => e?.getAttribute("href")?.includes("fb_id"))
                        ?.getAttribute("href")
                        ?.match(/fbid=.*?&/g)?.[0]
                        .slice(5, -1)
                      if (tempPostId) {
                        postId = tempPostId
                      }
                    }
                    return {
                      id: postId,
                      link: "https://www.facebook.com/" + postId,
                      type: "FB_POST",
                      textContent,
                      renderedContent,
                      title: "",
                      imageContents,
                      videoContents,
                      likes: reaction?.[0] || 0,
                      shares: 0,
                      comments: reaction?.[1] || 0,
                      totalReactions,
                      status: "LIVE",
                      postedAt,
                      sourceInfo: {
                        sourceId,
                        sourceUrl: "https://www.facebook.com/" + sourceId,
                        authorId,
                        authorAvartar: "",
                        sourceType,
                        sourceTitle,
                        sourceAvatar: "",
                        authorTitle,
                      },
                      checkLang,
                    }
                  }
                  return null
                } catch (error) {
                  console.log("Error when evaluate post 1", error)
                  return null
                }
              }),
              nextLink: document?.querySelector("#see_more_pager")?.querySelector("a")?.getAttribute("href") || "",
            }
          } catch (error) {
            console.log("Error when evaluate post 2", error)
          }
        })
        if (resultEvaluate?.listArticles?.length > 0) {
          const tempListPost = resultEvaluate.listArticles
            .filter((e) => e != null)
            .map((e) => {
              const convertPostedAt = convertTime(e.postedAt, e.checkLang)
              delete e.checkLang
              return {...e, postedAt: convertPostedAt}
            })
          const tempListVideoFilterTime = tempListPost.filter((e) => e.postedAt > new Date(now))

          for (const post of tempListVideoFilterTime) {
            if (await redisClient.get(post.id)) {
              console.log("Id visited: ", post.id)
            } else {
              if (post?.textContent) {
                console.log("New id: ", post.id)
                await redisClient.set(post.id, 1, {
                  EX: 60 * 60 * 24,
                })

                const result = await getPostInfor(post.link, context)
                await new Promise((r) => setTimeout(r, 5000))
                if (post.sourceInfo.sourceType === "FB_GROUP") {
                  listPosts.push({
                    ...post,
                    ...(result && result?.renderedContent !== "" && {renderedContent: result?.renderedContent}),
                    ...(result && result?.textContent !== "" && {textContent: result?.textContent}),
                    imageContents: result?.imageContents || [],
                    sourceInfo: {
                      sourceType: post.sourceInfo.sourceType,
                      sourceTitle: post.sourceInfo.sourceTitle,
                      sourceId: post.sourceInfo.sourceId,
                      authorAvartar: result?.sourceAvatar || "",
                      authorTitle: result?.sourceTitle || "",
                      sourceAvatar: result?.groupImage || "",
                      authorId: result?.sourceId || "",
                    },
                  })
                } else {
                  listPosts.push({
                    ...post,
                    ...(result && result?.renderedContent !== "" && {renderedContent: result?.renderedContent}),
                    ...(result && result?.textContent !== "" && {textContent: result?.textContent}),
                    imageContents: result?.imageContents,
                    sourceInfo: {
                      sourceAvatar: result?.sourceAvatar || "",
                      sourceType: post.sourceInfo.sourceType,
                      sourceTitle: post.sourceInfo.sourceTitle,
                      sourceId: post.sourceInfo.sourceId,
                    },
                  })
                }
              }
            }
          }
          if (listPosts.length >= 10) {
            while (listPosts.length >= 10) {
              try {
                const processLinks = listPosts.splice(0, 10)
                await filterAndSaveContent(
                  processLinks,
                  socket,
                  listTopics,
                  context,
                  prisma,
                  "FACEBOOK_SEARCH",
                  producer,
                )
              } catch (error) {
                console.log("Error when crawl link website", error)
              }
            }
          }
          reqLink = resultEvaluate.nextLink
          if (reqLink === "https://mbasic.facebook.com" || reqLink === "") {
            break
          }
        } else {
          console.log("Maybe Block when go search link")
          break
        }

        countReq += 1
        await new Promise((r) => setTimeout(r, (30 + Math.random() * 10) * 1000))
      } catch (error) {
        console.log(`Error when search post with keyword ${keyword} by account ${account.fbId}: `, error)
        break
      }
    }
    if (listPosts.length > 0) {
      try {
        await filterAndSaveContent(listPosts, socket, listTopics, context, prisma, "FACEBOOK_SEARCH", producer)
      } catch (error) {
        console.log("Error when filter and save content searchFacebook", error)
      }
    }

    await new Promise((r) => setTimeout(r, 130000))

    while (countVideoReq < 5) {
      try {
        await page.goto(searchVideo, {
          waitUntil: "domcontentloaded",
          timeout: 180000,
        })
        const resultEvaluate = await page.evaluate(() => {
          try {
            const listArticles = document.querySelectorAll("article")

            return {
              listArticles: Array.from(listArticles).map((article) => {
                try {
                  let postId =
                    Array.from((article?.childNodes?.[1] as HTMLElement)?.querySelectorAll("a"))
                      ?.find((e) => e.getAttribute("href")?.includes("reaction"))
                      ?.getAttribute("href")
                      ?.match(/ft_id.*?&/g)?.[0]
                      ?.slice(6, -1) || ""
                  if (postId != "") {
                    let sourceType = "FB_PAGE"
                    let sourceId = ""
                    let sourceTitle = ""
                    let authorId = ""
                    let authorTitle = ""
                    let headerLink =
                      Array.from(article?.querySelector("header")?.querySelectorAll("a"))?.map((e) =>
                        e.getAttribute("href"),
                      ) || []
                    if (headerLink.length === 1) {
                      if (headerLink[0].startsWith("/profile")) {
                        sourceType = "FB_ACCOUNT"
                        const prefix = "id="
                        const suffix = "&"
                        const idRegex = new RegExp(prefix + ".*?" + suffix, "g")
                        sourceId = headerLink?.[0]?.match(idRegex)?.[0] || ""
                        sourceId = sourceId.substring(3, sourceId.length - 1)
                      } else if (headerLink[0].includes("/albums/")) {
                        sourceType = "FB_ACCOUNT"
                        sourceId = headerLink[0].split("/")?.[1] || ""
                      } else {
                        sourceId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                      }
                      sourceTitle = article?.querySelector("header")?.querySelector("h3")?.textContent || ""
                    } else if (headerLink.length == 2) {
                      if (headerLink.some((e) => e.includes("groups"))) {
                        sourceType = "FB_GROUP"
                        authorId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                        sourceId = headerLink[1].split("/")?.[4] || ""
                        let titleArr =
                          article?.querySelector("header")?.querySelector("h3")?.textContent?.split(">") || []
                        sourceTitle = titleArr?.[1] || ""
                        authorTitle = titleArr?.[0] || ""
                      } else {
                        sourceId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                        sourceTitle =
                          article?.querySelector("header")?.querySelector("h3")?.querySelector("a")?.textContent || ""
                      }
                    } else {
                      sourceId = headerLink[0].split("?")?.[0]?.replace("/", "") || ""
                    }

                    let textContent = article?.childNodes?.[0]?.childNodes?.[1]?.textContent || ""
                    const renderedContent = (article?.childNodes?.[0] as HTMLElement)?.innerHTML || ""
                    const imageContents =
                      Array.from((article?.childNodes?.[0] as HTMLElement)?.querySelectorAll("img"))?.map((e) =>
                        e.getAttribute("src"),
                      ) || []
                    const videoContents =
                      Array.from(article?.querySelectorAll("a"))
                        ?.map((a) => a?.getAttribute("href"))
                        ?.filter((e) => e?.startsWith("/video_redirect"))
                        ?.map((e) => decodeURI("https://mbasic.facebook.com" + e)) || []
                    const reaction = article?.childNodes?.[1]?.childNodes?.[1]?.textContent
                      ?.replaceAll(".", "")
                      ?.match(/\d+/g)
                      ?.map((e) => Number(e)) || [0, 0]

                    const totalReactions = reaction?.[0] || 0 + (reaction?.[1] || 0) * 2

                    const checkLang = article?.childNodes?.[1]?.childNodes?.[0]?.textContent?.includes("Công khai")
                      ? "vi"
                      : "en" || "vi"
                    const postedAt = article?.childNodes?.[1]?.childNodes?.[0]?.childNodes?.[0]?.textContent || ""
                    return {
                      id: postId,
                      link: "https://www.facebook.com/" + postId,
                      type: "FB_POST",
                      textContent,
                      renderedContent,
                      title: "",
                      imageContents,
                      videoContents,
                      likes: reaction?.[0] || 0,
                      shares: 0,
                      comments: reaction?.[1] || 0,
                      totalReactions,
                      status: "LIVE",
                      postedAt,
                      userHandle: "notHandle",
                      sourceInfo: {
                        sourceId,
                        sourceTitle,
                        sourceUrl: "https://www.facebook.com/" + sourceId,
                        authorId,
                        authorAvartar: "",
                        sourceAvatar: "",
                        authorTitle,
                        sourceType,
                      },
                      checkLang,
                    }
                  }
                  return null
                } catch (error) {
                  console.log("Error when evaluate video1", error)
                  const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
                  sleep(1000000)
                  return null
                }
              }),
              nextLink: document?.querySelector("#see_more_pager")?.querySelector("a")?.getAttribute("href") || "",
            }
          } catch (error) {
            console.log("Error when evaluate video 2", error)
          }
        })
        if (resultEvaluate?.listArticles.length > 0) {
          let tempListVideo = resultEvaluate.listArticles
            .filter((e) => e != null)
            .map((e) => {
              const convertPostedAt = convertTime(e.postedAt, e.checkLang)
              delete e.checkLang
              return {...e, postedAt: convertPostedAt}
            })
          const listVideoSeeMore = tempListVideo.filter(
            (e) => e.textContent.endsWith("Xem thêm") || e.textContent.endsWith("See more"),
          )
          tempListVideo = tempListVideo.filter(
            (e) => !e.textContent.endsWith("Xem thêm") && !e.textContent.endsWith("See more"),
          )
          for (const video of listVideoSeeMore) {
            if (await redisClient.get(video.id)) {
              console.log("Id visited: ", video.id)
            } else {
              if (video?.textContent) {
                console.log("New id: ", video.id)
                await redisClient.set(video.id, 1, {
                  EX: 60 * 60 * 24,
                })
                const result = await getPostInfor(video.link, context)
                await new Promise((r) => setTimeout(r, 5000))
                tempListVideo.push({
                  ...video,
                  ...(result && {renderedContent: result?.renderedContent}),
                  ...(result && {textContent: result?.textContent}),
                  sourceInfo: {
                    sourceId: video.sourceInfo.sourceId,
                    sourceTitle: video.sourceInfo.sourceTitle,
                    sourceUrl: video.sourceInfo.sourceUrl,
                    authorId: video.sourceInfo.authorId,
                    authorAvartar: video.sourceInfo.authorAvartar,
                    sourceAvatar: result?.sourceAvatar || "",
                    authorTitle: video.sourceInfo.authorTitle,
                    sourceType: video.sourceInfo.sourceType,
                  },
                })
              }
            }
          }

          listVideos = listVideos.concat(tempListVideo)
          if (listVideos.length >= 10) {
            while (listVideos.length >= 10) {
              try {
                const processLinks = listVideos.splice(0, 10)
                await filterAndSaveContent(
                  processLinks,
                  socket,
                  listTopics,
                  context,
                  prisma,
                  "FACEBOOK_SEARCH",
                  producer,
                )
              } catch (error) {
                console.log("Error when crawl link facebook", error)
              }
            }
          }

          searchVideo = resultEvaluate.nextLink
          if (searchVideo === "https://mbasic.facebook.com" || searchVideo === "") {
            break
          }
        } else {
          console.log("Maybe Block when go search video link")
          break
        }
        countVideoReq += 1
        await new Promise((r) => setTimeout(r, (27 + Math.random() * 5) * 1000))
      } catch (error) {
        console.log(`Error when search video with keyword ${keyword} by account ${account.fbId}: ${error}`)
        break
      }
    }
    if (listVideos.length > 0) {
      await filterAndSaveContent(listVideos, socket, listTopics, context, prisma, "FACEBOOK_SEARCH", producer)
    }
    await new Promise((r) => setTimeout(r, 30000))
  } catch (error) {
    console.log("Error when search facebook", error)
  }
  await page.request.dispose()
  await page.close()
}

export const convertTime = (time: string, lang: string) => {
  let now = new Date()
  let result = new Date()
  if (lang == "vi") {
    if (time.includes("phút")) {
      const number = Number(time.replace("phút", ""))
      result.setMinutes(result.getMinutes() - number)
    } else if (time.includes("giờ")) {
      const number = Number(time.replace("giờ", ""))
      result.setHours(result.getHours() - number)
    } else if (time.includes("lúc")) {
      try {
        const [days, hours] = time.split("lúc")
        const [day, month] = days.split("tháng")
        if (month?.includes(",")) {
          return new Date("2010")
        }
        result.setMonth(Number(month) - 1)
        result.setDate(Number(day))
        const [hour, minute] = hours.match(/\d+/g).map((e) => Number(e))
        result.setHours(hour, minute)
      } catch (error) {
        console.log("Error when set converTime", error)
        console.log(time, lang)
      }
    }
  } else if (lang == "en") {
    if (time.includes("mins")) {
      const number = Number(time.replace("mins", ""))
      result.setMinutes(result.getMinutes() - number)
    } else if (time.includes("hr")) {
      const number = Number(time.replace("hr", ""))
      result.setHours(result.getHours() - number)
    } else if (time.includes("at")) {
      try {
        const [day, hours] = time.split("at")
        result = new Date(day)
        result.setFullYear(now.getFullYear())
        const [hour, minute] = hours.match(/\d+/g).map((e) => Number(e))
        result.setHours(hour, minute)
      } catch (error) {
        console.log("Error when set converTime", error)
        console.log(time, lang)
      }
    }
  }
  return result
}
