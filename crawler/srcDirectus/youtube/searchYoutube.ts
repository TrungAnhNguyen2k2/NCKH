import got from "got"
// import {HttpsProxyAgent} from "hpagent"
import {Socket} from "socket.io-client"
import {filterAndSaveContent} from "../filterAndSaveContent"
import {getReqHeaderSearchYoutube, getReqBodySearchYoutube, renderPostedAt} from "./libYoutube"
import {getSubtitle} from "./getSubtitle"
import {DirectusClient, RestClient, StaticTokenClient, updateItem, updateItems} from "@directus/sdk"
import {SmccSchema, Topic} from "../schema/schema"

export async function searchYoutube(
  clientDirectus: DirectusClient<SmccSchema> & RestClient<SmccSchema> & StaticTokenClient<SmccSchema>,
  redisClient: any,
  socket: Socket,
  listTopics: Topic[],
  topic: Topic,
) {
  console.log(`${new Date()} crawl topic: ${topic.name}`)
  const nextSearchYoutubeAt =
    new Date(new Date(topic.nextSearchYoutubeAt).getTime() + 60 * 60 * 1000) > new Date()
      ? new Date(new Date(topic.nextSearchYoutubeAt).getTime() + 60 * 60 * 1000)
      : new Date(new Date().getTime() + 60 * 60 * 1000)
  await clientDirectus.request(
    updateItem("topics", topic.id, {
      nextSearchYoutubeAt: nextSearchYoutubeAt,
    }),
  )

  let keywords = topic.searchKeywords.map((e) => e.trim())
  let searchList: string[][] = []
  let tempList: string[] = []
  keywords.forEach((e, i) => {
    if (i % 3 !== 0) {
      tempList.push(e)
    } else {
      searchList.push(tempList)
      tempList = []
      tempList.push(e)
    }
  })
  if (tempList.length > 0) {
    searchList.push(tempList)
  }
  searchList.shift()
  const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
  const linkReq =
    "https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false"
  for (const keySearchs of searchList) {
    const keyword = keySearchs.map((e) => '"' + e + '"').join("OR")
    let countVideo = 0
    let checkFirst = true
    let continuation = null
    let estimatedResults = 0
    let contents: any[] = []

    let debugData2 = ""
    try {
      while (countVideo < 100) {
        let data1
        if (checkFirst) {
          data1 = await got.post(linkReq, {
            headers: getReqHeaderSearchYoutube(keyword),

            body: getReqBodySearchYoutube(keyword, null),
            method: "POST",
            // mode: 'cors',
            // credentials: 'include',
            timeout: {
              request: 120000,
            },
            retry: {
              limit: 2,
            },
          })
          await sleep(1000)
        } else {
          data1 = await got.post(linkReq, {
            headers: getReqHeaderSearchYoutube(keyword),

            body: getReqBodySearchYoutube(keyword, continuation),
            method: "POST",
            // mode: 'cors',
            // credentials: 'include',
            timeout: {
              request: 1200000,
            },
            retry: {
              limit: 2,
            },
          })
        }

        const data2 = JSON.parse(data1.body)
        debugData2 = JSON.stringify(data2)
        estimatedResults = data2?.estimatedResults || 0
        let listContents = []

        if (checkFirst) {
          if (estimatedResults == 0) {
            break
          }
          const listContents1 =
            data2?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || []
          const listContents2 =
            data2?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents
              ?.map((e: any) => e?.itemSectionRenderer?.contents || [])
              ?.flat(1) || []
          listContents = [...listContents1, ...listContents2]

          continuation =
            data2?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.find(
              (e: any) => e.continuationItemRenderer,
            )?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || ""
          checkFirst = false
        } else {
          listContents =
            data2?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]
              ?.itemSectionRenderer?.contents || []
          continuation =
            data2?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems?.[1]
              ?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || ""
        }
        if (listContents.length > 0) {
          let tempListContents = []
          for (const content of listContents) {
            const infor = content.videoRenderer
            const videoId = infor?.videoId || null

            if (videoId) {
              if (await redisClient.get(videoId)) {
                console.log("Videos youtube visited: ", videoId)
                continue
              }
              await redisClient.set(videoId, 1, {
                EX: 60 * 60,
              })
              console.log("New video: ", videoId)
              const link = `https://www.youtube.com/watch?v=${videoId}`
              const imageContents = [infor?.thumbnail?.thumbnails?.pop()?.url || ""]
              const title = infor?.title?.runs?.[0]?.text || ""
              const sourceId = infor?.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || ""
              const sourceTitle = infor?.longBylineText?.runs?.[0]?.text || ""
              const sourceLogo =
                infor?.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]
                  ?.url || ""
              const discription =
                infor?.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((e: any) => e?.text || "").join("") || ""
              const textJson = await getSubtitle(videoId, "localhost")
              let renderedContent = ""
              let textContent = discription
              if (textJson) {
                renderedContent = `<h3>${title}</h3><p>${discription}</p>`
                textJson?.transcript?.text?.forEach((e: any) => {
                  if (!e?._?.startsWith("[")) {
                    const totalSeconds = Math.floor(Number(e?.start?.[0])) || 0
                    const totalMinutes = Math.floor(totalSeconds / 60)
                    const seconds = totalSeconds % 60
                    const hours = Math.floor(totalMinutes / 60)
                    const minutes = totalMinutes % 60
                    const time = hours + ":" + minutes + ":" + seconds
                    renderedContent += `<p>${time} | ${e?._ || ""}</p>`
                  }
                })
                textContent = (textJson?.transcript?.text || []).map((e: any) => e?._ || []).join(" ")
              } else {
                renderedContent = `<h3>${title}</h3><p>${discription}</p></p>`
              }

              let videoLength = infor?.lengthText?.simpleText
              let postedAt = renderPostedAt(infor?.publishedTimeText?.simpleText || "", new Date("01/01/2000"))
              tempListContents.push({
                id: videoId,
                renderedContent,
                textContent,
                imageContents,
                videoContents: [link],
                title,
                excerpt: discription,
                favicon: sourceLogo,
                link,
                postedAt: postedAt.postedAt,
                type: "YOUTUBE",
                metaInfo: {
                  videoLength,
                },
                views: Number(infor?.viewCountText?.simpleText?.replace(",", "")?.match(/\d+/g)?.[0] || 0),
                sourceInfo: {
                  sourceUrl: "https://www.youtube.com/channel/" + sourceId,
                  sourceTitle,
                  sourceLogo,
                  sourceId,
                },
              })
            }
          }
          countVideo += tempListContents.length
          contents = contents.concat(tempListContents.filter((e: any) => e.title))
        } else {
          break
        }
        if (contents.length >= 10) {
          while (contents.length >= 10) {
            const contentProcess = contents.splice(0, 10)
            await filterAndSaveContent(contentProcess, socket, listTopics, null, clientDirectus, "YOUTUBE_SEARCH")
          }
        }
        if (countVideo == estimatedResults) {
          break
        }
      }
      if (contents.length > 0) {
        await filterAndSaveContent(contents, socket, listTopics, null, clientDirectus, "YOUTUBE_SEARCH")
      } else if (contents.length > 0) {
        console.log("Debug xem tại sao contents lại bằng 0")
        console.log("keyword", keyword)
        console.log("checkFirst: ", checkFirst)
        console.log(debugData2)
      }
    } catch (error) {
      console.log("Error when crawl youtube", error)
    }
  }
}
