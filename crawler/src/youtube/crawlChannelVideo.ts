import got from "got"
import {HttpsProxyAgent} from "hpagent"
import {PrismaClient, topics, STATUS, sources} from "@prisma/client"
import {Socket} from "socket.io-client"
import {filterAndSaveContent} from "../filterAndSaveContent"
import {getReqHeaderCrawlChannelVideo, getReqBodyCrawlChannelVideo, renderPostedAt} from "./libYoutube"
import {Producer} from "kafkajs"
import {getSubtitle} from "./getSubtitle"
export async function crawlChannelVideo(
  prisma: PrismaClient,
  socket: Socket,
  listTopics: topics[],
  lastCrawledAt: Date,
  source: sources,
  proxy: string,
  producer: Producer,
  redisClient: any,
) {
  console.log(`${new Date()} proxy: ${proxy} crawl channelId: ${source.id}`)
  try {
    const linkReq = `https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false`
    const data = await got.post(linkReq, {
      headers: getReqHeaderCrawlChannelVideo(),

      body: getReqBodyCrawlChannelVideo(source.id, null),
      method: "POST",
      // mode: 'cors',
      // credentials: 'include',
      timeout: {
        request: 120000,
      },
      retry: {
        limit: 2,
      },
      ...(proxy !== "localhost"
        ? {
            agent: {
              https: new HttpsProxyAgent({
                keepAlive: true,
                keepAliveMsecs: 1000,
                maxSockets: 256,
                maxFreeSockets: 256,
                scheduling: "lifo",
                proxy: proxy,
              }),
            },
          }
        : {}),
    })
    const dataParse = JSON.parse(data?.body)
    if (dataParse) {
      let listContents = dataParse?.contents?.twoColumnBrowseResultsRenderer?.tabs
        ?.find((e: {tabRenderer: {title: string}}) => e?.tabRenderer?.title === "Videos")
        ?.tabRenderer?.content?.richGridRenderer?.contents?.map(
          (e: {richItemRenderer: {content: {videoRenderer: any}}}) => e?.richItemRenderer?.content?.videoRenderer,
        )
      if (listContents?.length == 0) {
        listContents =
          dataParse?.contents?.twoColumnBrowseResultsRenderer?.[1]?.tabRenderer?.content?.richGridRenderer?.contents ||
          []
      }
      const sourceInfo = {
        sourceLogo: dataParse?.metadata?.channelMetadataRenderer?.avatar?.thumbnails?.[0]?.url || "",
        sourceTitle: dataParse?.header?.c4TabbedHeaderRenderer?.title || "",
        sourceUrl: `https://www.youtube.com/channel/${source.id}`,
      }
      await prisma.sources.update({
        where: {
          id: source.id,
        },
        data: {
          avatar: sourceInfo.sourceLogo || source.avatar,
          name: sourceInfo.sourceTitle || source.name,
        },
      })
      if (listContents?.length > 0) {
        let contentResult = []
        for (const content of listContents) {
          const link = "https://www.youtube.com/watch?v=" + (content?.videoId || "")
          const title = content?.title?.runs?.[0]?.text || ""
          const discription = content?.descriptionSnippet?.runs?.[0]?.text || ""
          const textJson = await getSubtitle(content?.videoId || "", proxy)
          let renderedContent = ""
          let textContent = discription
          if (textJson) {
            renderedContent = `<h3>${title}</h3><p>${discription}</p>`
            textJson?.transcript?.text?.forEach((e: any) => {
              const totalSeconds = Math.floor(Number(e?.start?.[0])) || 0
              const totalMinutes = Math.floor(totalSeconds / 60)
              const seconds = totalSeconds % 60
              const hours = Math.floor(totalMinutes / 60)
              const minutes = totalMinutes % 60
              const time = hours + ":" + minutes + ":" + seconds
              renderedContent += `<p>${time} | ${e?._ || ""}</p>`
            })
            textContent = (textJson?.transcript?.text || []).map((e: any) => e?._ || []).join(" ")
          } else {
            renderedContent = `<h3>${title}</h3><p>${discription}</p></p>`
          }
          const thumbnail = content?.thumbnail?.thumbnails?.at(-1)?.url

          const metaInfo = {
            lengthVideo: content?.lengthText?.simpleText || "",
            view: content?.viewCountText?.simpleText || "",
          }
          let postedAt = renderPostedAt(content?.publishedTimeText?.simpleText || "", lastCrawledAt)
          if (await redisClient.get(content?.videoId || "")) {
            console.log("Videos youtube visited: ", content?.videoId)
          } else {
            await redisClient.set(content?.videoId || "", 1, {
              EX: 30 * 24 * 60 * 60,
            })
            if (postedAt.crawl) {
              contentResult.push({
                id: content?.videoId || "",
                renderedContent,
                textContent,
                imageContents: [thumbnail],
                videoContents: [link],
                title,
                excerpt: discription,
                link,
                type: "YOUTUBE",
                metaInfo,
                views: Number(content?.viewCountText?.simpleText?.replace(",", "")?.match(/\d+/g)?.[0] || 0),
                postedAt: postedAt.postedAt,
                status: STATUS.LIVE,
                userHandle: "notHandle",
              })
            }
          }
        }
        contentResult = contentResult.filter((e) => e !== null && e.id != "")
        if (contentResult.length > 0) {
          await filterAndSaveContent(
            contentResult.filter((e: any) => e.title && e.title !== ""),
            socket,
            listTopics,
            null,
            prisma,
            "YOUTUBE",
            producer,
            source,
          )
        }
      } else {
        console.log(`Debug listContent = 0`)
        console.log("dataParse", JSON.stringify(dataParse))
      }
    }
  } catch (error) {
    console.log("Error when crawl youtube Channel: ", error)
  }
}
