import {getHtml} from "libts/src/getHtml"
import {Readability} from "@mozilla/readability"
import {JSDOM, VirtualConsole} from "jsdom"
import {parse} from "node-html-parser"
import {compareTwoStrings} from "string-similarity"
import {CrawledWebsitePost} from "./types"
import * as config from "../config/keys.config"

export async function getMainContent(url: string, useProxy: boolean = false) {
  const userAgent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
  let proxy_URL: string = ""
  if (useProxy) {
    proxy_URL = config.default.listProxy ?? ""
  }
  if (!url.startsWith("http")) {
    url = "https://" + url
  }
  let urlLink
  try {
    urlLink = new URL(url)
  } catch (error) {
    return null
  }

  const html = await getHtml(url, userAgent, proxy_URL)
  let document: any
  try {
    document = parse(html.html)
  } catch (error) {
    console.log("Error when parse html with url: " + url)
  }
  if (!document) {
    return null
  }
  const h1 = document.querySelector("h1")?.textContent?.trim().toLowerCase() || ""
  const meta = document.querySelectorAll("meta")
  let imageLink = ""
  let postedAt = new Date()
  let checkIsNews = true
  let listJsonLdHtmlElement = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  if (listJsonLdHtmlElement.length > 0) {
    let listJsonLd = listJsonLdHtmlElement.map((e: any) => {
      const textJson = (e as HTMLElement)?.innerText
      let result = null
      try {
        result = JSON.parse(JSON.stringify(textJson))
      } catch (error1) {
        try {
          result = JSON.parse(JSON.stringify(textJson.replaceAll("'", "`")))
        } catch (error2) {
          try {
            result = JSON.parse(JSON.stringify(textJson.replaceAll("'", '"')))
          } catch (error3) {
            console.log("Error when parse JSONLD", error1, error2, error3)
            console.log("url", url)
          }
        }
      }
      return result
    })
    let jsonPublishDate = listJsonLd.find((e) => e?.datePublished)
    if (!jsonPublishDate) {
      try {
        jsonPublishDate = listJsonLd.find((e) => JSON.parse(e)?.datePublished)
      } catch (error) {
        try {
          jsonPublishDate = listJsonLd.find((e) => JSON.parse(JSON.stringify(e))?.datePublished)
        } catch (error2) {
          console.log("errror a", error, error2)
          console.log("listJsonLd", listJsonLd)
        }
      }
    }
    if (jsonPublishDate) {
      postedAt = new Date(
        jsonPublishDate.datePublished?.replaceAll(" ", "") ||
          JSON.parse(jsonPublishDate)?.datePublished?.replaceAll(" ", "") ||
          JSON.parse(JSON.stringify(jsonPublishDate))?.datePublished?.replaceAll(" ", "") ||
          new Date(),
      )
    }
    const jsonImage = listJsonLd.find((e) => e?.image)
    if (jsonImage) {
      imageLink = jsonImage.image?.url || null
      if (typeof imageLink !== "string" && imageLink !== null) {
        imageLink = imageLink?.[imageLink.length - 1] || null
      }
    }
    try {
      let jsonType = listJsonLd.map((e) => JSON.parse(JSON.stringify(e))?.["@type"])
      jsonType = jsonType.filter((e) => e !== undefined && e !== null)
      if (jsonType.length > 0 && jsonType.find((e) => e === "NewsArticle") === undefined) {
        checkIsNews = false
      }
    } catch (error) {
      console.log("Error when check type", error)
    }
  }
  if (!postedAt || postedAt.toString() === "Invalid Date") {
    const arrDate = Array.from(document.querySelectorAll("meta"))
      .filter(
        (e: any) =>
          new Date(e?.getAttribute("content")?.replaceAll(" ", "")).toString() !== "Invalid Date" &&
          e.getAttribute("content")?.length >= 10 &&
          e.getAttribute("content")?.length <= 50 &&
          new Date(e?.getAttribute("content")) > new Date("2010"),
      )
      .map((e: any) => new Date(e?.getAttribute("content")))
    if (arrDate.length > 0) {
      postedAt = new Date(arrDate[0])
    }
  }
  if (postedAt > new Date()) {
    postedAt.setHours(postedAt.getHours() - 7)
  }

  let favicon = urlLink?.hostname ? "https://icon.horse/icon/" + urlLink.hostname : "https://icon.horse/icon/google.com"

  let excerpt = ""

  imageLink = meta.find((e: any) => e.getAttribute("property") == "og:image")?.getAttribute("content") || ""

  const virtualConsole = new VirtualConsole()
  virtualConsole.on("error", () => {
    // No-op to skip console errors.
    console.log("Error when parse css with jsdom")
  })
  // const dom = new JSDOM(``, { virtualConsole });
  let article: {
    title: string
    byline: string
    dir: string
    content: string
    textContent: string
    length: number
    excerpt: string
    siteName: string
  } | null = null
  try {
    const doc = new JSDOM(html.html, {virtualConsole})
    const reader = new Readability(doc.window._document)
    article = reader.parse()
  } catch (error) {
    console.log("Error when getmaincontent")
    console.log(error)
  }
  excerpt = article?.excerpt ? article?.excerpt : ""
  let renderedContent: string = "",
    title: string = "",
    textContent: string = ""
  if (
    (h1 || h1 === "") &&
    article?.title &&
    (compareTwoStrings(h1, article?.title) > 0.6 || h1 === "") &&
    checkIsNews &&
    article.textContent.length > 800 &&
    parse(article.content).querySelectorAll("a img")?.length < 2
  ) {
    title = article?.title
    textContent = article?.textContent.replaceAll("\t", " ").replaceAll("\n", " ").replace(/\s\s+/g, " ").trim()
    renderedContent = article?.content
    if (!imageLink) {
      const contentHTML = parse(article?.content)
      if (contentHTML !== undefined) {
        imageLink =
          contentHTML
            ?.querySelectorAll("img")
            ?.find((e) => (e.getAttribute("width") || "0") >= "300")
            ?.getAttribute("src") || ""
      }
    }
    if (imageLink.startsWith("//")) {
      imageLink = `${urlLink.protocol}${imageLink}`
    } else if (!imageLink.startsWith("http")) {
      imageLink = `${urlLink.origin}${imageLink.startsWith("/") ? "" : "/"}${imageLink}`
    }
  }
  const result: CrawledWebsitePost = {
    renderedContent,
    textContent,
    imageContents: [imageLink],
    title,
    excerpt,
    favicon,
    topics: [],
    link: html.redirectUrl !== "" ? html.redirectUrl : url,
    matchKeywordSettings: [],
    screenShot: false,
    postedAt,
    videoContents: [],
  }
  return result
}
