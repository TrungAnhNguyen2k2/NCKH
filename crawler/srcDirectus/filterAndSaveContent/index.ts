import {Socket} from "socket.io-client"
import {BrowserContext} from "playwright"
import {crawlChannelInfo} from "../youtube/crawlChannelInfo"
import {removeAccents} from "libts"
import {parseBooleanQuery} from "boolean-parser"
import {checkMultiContent} from "libts"
import {MemoryLevel} from "memory-level"
import si from "search-index"
import {Topic, SmccSchema, Source} from "../schema/schema"
import * as config from "../config/keys.config"
import {
  DirectusClient,
  rest,
  readItems,
  readSingleton,
  StaticTokenClient,
  RestClient,
  updateItem,
  updateItems,
  createItem,
  readItem,
} from "@directus/sdk"
interface KeywordSetting {
  keywords: string
  notify?: string
}
export async function filterAndSaveContent(
  contents: any[],
  socket: Socket,
  listTopics: Topic[], // Tại sao cần truyền listopic vào vì để đỡ phải gọi db nhiều lần
  context: BrowserContext | null,
  clientDirectus: DirectusClient<SmccSchema> & RestClient<SmccSchema> & StaticTokenClient<SmccSchema>,
  type: string,
  source?: Source,
) {
  console.log("contents", contents)
  try {
    const idx = await si({
      // @ts-expect-error
      db: MemoryLevel,
      name: contents[0].link,
    })
    await idx.PUT(
      contents.map((c) => ({
        _id: c.link,
        text: c.title + c.textContent,
      })),
      {
        ngrams: {
          lengths: [1, 2, 3, 4, 5],
          join: " ",
          fields: undefined,
        },
      },
    )

    await Promise.all(
      listTopics.map(async (topic: Topic) => {
        topic.excludeKeywords = topic.excludeKeywords.map((e) => e.toLowerCase())
        let contentIdsInTopic: {[key: string]: Array<KeywordSetting>} = {}

        for (const keywordSetting of topic.keywords as unknown as KeywordSetting[]) {
          const queryRemoveAccents = removeAccents(keywordSetting.keywords)
            .replaceAll("&", " AND ")
            .replaceAll(",", " AND ")
            .replaceAll("|", " OR ")
          const queryNoRemoveAccents = keywordSetting.keywords
            .toLowerCase()
            .replaceAll("&", " AND ")
            .replaceAll(",", " AND ")
            .replaceAll("|", " OR ")
          let keywordsRemoveAccents
          let keywordsNoRemoveAccents
          try {
            keywordsRemoveAccents = parseBooleanQuery(queryRemoveAccents.trim())
          } catch (error) {
            console.error(`Error when parseBoolean remove ${error}`)
            console.error(queryRemoveAccents)
          }
          try {
            keywordsNoRemoveAccents = parseBooleanQuery(queryNoRemoveAccents.trim())
          } catch (error) {
            console.error(`Error when parseBoolean ${error}`)
            console.error(queryNoRemoveAccents)
          }

          const allKeyWords = [...new Set([...keywordsRemoveAccents, ...keywordsNoRemoveAccents])]
          let searchQuery = {
            OR: allKeyWords.map((ks) => ({AND: ks})),
          }

          const result = await idx.QUERY(searchQuery, {SCORE: "TFIDF"})
          if (result.RESULT_LENGTH) {
            for (const r of result.RESULT) {
              contentIdsInTopic[r._id] = contentIdsInTopic[r._id] || []
              contentIdsInTopic[r._id].push(keywordSetting)
            }
          }
        }

        if (Object.keys(contentIdsInTopic).length > 0) {
          for (const key in contentIdsInTopic) {
            const post = contents.find((p) => p.link == key)
            post.topics = post.topics || []
            if (config.default.pocketBaseUrl) {
              post.pbTopics = post.pbTopics || []
            }

            post.screenShot = post.screenShot || topic.screenShot
            post.matchKeywordSettings = post.matchKeywordSettings || []
            if (
              topic.excludeKeywords.length === 0 ||
              !topic.excludeKeywords.some(
                (e) =>
                  (post.title + post.textContent).toLowerCase().includes(e) ||
                  (post.title + post.textContent).toLowerCase().includes(removeAccents(e)),
              )
            ) {
              post.topics.push(topic.id)
              post.matchKeywordSettings.push(...contentIdsInTopic[key])
            }
          }
        }
      }),
    )
    await idx.FLUSH()
    contents = contents.filter((c) => c?.topics?.length > 0)
    let page
    if (context) {
      page = await context.newPage()
    }
    let countNewContent = 0
    let arrCheckContent: {id: string; text: string; matchKeywordSettings: any}[] = []
    //Update Source
    for (const post of contents) {
      try {
        const oldContent = (
          await clientDirectus.request(
            readItems("contents", {
              filter: {
                link: post.link,
              },
            }),
          )
        )?.[0]

        if (!oldContent) {
          countNewContent += 1

          await Promise.all(
            post.topics.map(async (topicId) => {
              await clientDirectus.request(
                updateItem("topics", topicId, {
                  total: (listTopics.find((e) => e.id === topicId)?.total || 0) + 1,
                }),
              )
            }),
          )

          // Check and save if new source

          if (type === "YOUTUBE_SEARCH") {
            source = (
              await clientDirectus.request(
                readItems("sources", {
                  filter: {
                    link: post.sourceInfo.sourceUrl,
                  },
                }),
              )
            )?.[0]

            const infoChannel = await crawlChannelInfo(post.sourceInfo.sourceUrl, "localhost")
            if (source) {
              await clientDirectus.request(
                updateItem("sources", source.id, {
                  metaInfo: infoChannel,
                  ...(post?.sourceInfo?.sourceLogo && {avatar: post?.sourceInfo?.sourceLogo}),
                  status: "LIVE",
                  name: post?.sourceInfo?.sourceTitle ?? source.name,
                  count_cant_access: 0,
                  total: source.total + 1,
                }),
              )
            } else {
              try {
                source = await clientDirectus.request(
                  createItem("sources", {
                    ...(post?.sourceInfo?.sourceId && {id: post?.sourceInfo?.sourceId}),
                    link: post?.sourceInfo?.sourceUrl,
                    name: post?.sourceInfo?.sourceTitle || "",
                    avatar: post?.sourceInfo?.sourceLogo || "",
                    type: "YOUTUBE",
                    status: "LIVE",
                    isCrawl: false,
                    total: 1,
                    count_cant_access: 0,
                    lastCrawledAt: new Date(),
                    metaInfo: infoChannel,
                  }),
                )
              } catch (error: any) {
                console.error("Error when create new source from Youtube search")
                console.error(source)
                console.error(error)
                console.error(post?.sourceInfo?.sourceUrl)
              }
            }
          } else if (type === "FACEBOOK_SEARCH") {
            if (post?.sourceInfo?.sourceType === "FB_GROUP") {
              const oldAuthor = await clientDirectus.request(readItem("authors", post.sourceInfo.authorId))
              if (oldAuthor) {
                await clientDirectus.request(
                  updateItem("authors", post.sourceInfo.authorId, {
                    name: post.sourceInfo.authorTitle,
                    avatar: post.sourceInfo.authorAvartar,
                  }),
                )
              } else {
                await clientDirectus.request(
                  createItem("authors", {
                    ...(post?.sourceInfo?.authorId && {id: post?.sourceInfo?.authorId}),
                    link: "https://facebook.com/" + post.sourceInfo.authorId,
                    name: post.sourceInfo.authorTitle,
                    avatar: post.sourceInfo.authorAvartar,
                  }),
                )
              }
            }
            source = (
              await clientDirectus.request(
                readItems("sources", {
                  filter: {
                    link: post.sourceInfo.sourceUrl,
                  },
                }),
              )
            )?.[0]

            if (source) {
              await clientDirectus.request(
                updateItem("sources", source.id, {
                  status: "LIVE",
                  count_cant_access: 0,
                  total: source.total + 1,
                  avatar: post.sourceInfo.sourceAvatar,
                }),
              )
            } else {
              try {
                source = await clientDirectus.request(
                  createItem("sources", {
                    id: post.sourceInfo.sourceId,
                    link: "https://facebook.com/" + post?.sourceInfo?.sourceId,
                    name: post?.sourceInfo?.sourceTitle || "",
                    avatar: post.sourceInfo.sourceAvatar,
                    type: post?.sourceInfo?.sourceType || "FB_PAGE",
                    status: "LIVE",
                    isCrawl: false,
                    total: 1,
                    count_cant_access: 0,
                    lastCrawledAt: new Date(),
                  }),
                )
              } catch (error: any) {
                console.error("Error when create new source from Facebook Search")
                console.error(source)
                console.error(error)
                console.error(post?.sourceInfo?.sourceUrl)
              }
            }
          } else if (type === "GOOGLE_SEARCH") {
            source = (
              await clientDirectus.request(
                readItems("sources", {
                  filter: {
                    link: {
                      _eq: new URL(post.link).origin,
                    },
                  },
                }),
              )
            )?.[0]

            if (source) {
              await clientDirectus.request(
                updateItem("sources", source.id, {
                  status: "LIVE",
                  count_cant_access: 0,
                  total: source.total + 1,
                }),
              )
            } else {
              try {
                source = await clientDirectus.request(
                  createItem("sources", {
                    link: new URL(post.link).origin,
                    name: new URL(post.link).hostname,
                    avatar: "https://icon.horse/icon/" + new URL(post.link).hostname,
                    type: "WEBSITE",
                    status: "LIVE",
                    isCrawl: false,
                    count_cant_access: 1,
                    lastCrawledAt: new Date(),
                  }),
                )
              } catch (error: any) {
                console.error("Error when create new source from Youtube search")
                console.error(source)
                console.error(error)
                console.error(post?.sourceInfo?.sourceUrl)
              }
            }
          } else if (type === "FACEBOOK") {
            if (post.sourceInfo?.authorId) {
              const oldAuthor = await clientDirectus.request(readItem("authors", post.sourceInfo.authorId))
              if (oldAuthor) {
                await clientDirectus.request(
                  updateItem("authors", post.sourceInfo.authorId, {
                    name: post.sourceInfo.authorTitle,
                    avatar: post.sourceInfo.authorAvartar,
                  }),
                )
              } else {
                await clientDirectus.request(
                  createItem("authors", {
                    ...(post?.sourceInfo?.authorId && {id: post?.sourceInfo?.authorId}),
                    link: "https://facebook.com/" + post.sourceInfo.authorId,
                    name: post.sourceInfo.authorTitle,
                    avatar: post.sourceInfo.authorAvartar,
                  }),
                )
              }
            }
            await clientDirectus.request(
              updateItem("sources", source?.id || "", {
                avatar: post.sourceInfo.sourceAvatar,
              }),
            )
          }
          // Save new content
          try {
            const newContent = await clientDirectus.request(
              createItem("contents", {
                ...(post?.id && {id: post.id}),
                sourceInfo: source?.id,
                authorInfo: post?.sourceInfo?.authorId || null,
                topicIds: post.topics,

                link: post.link,
                type: post?.type || "WEBSITE_POST",
                text_content: post?.textContent || "",
                title: post?.title || "",
                summary_desciption: post?.excerpt || "",
                renderedContent: post.renderedContent,
                image: post?.imageContents?.[0] || "",
                likes: post?.likes || 0,
                shares: post?.shares || 0,
                comments: post?.comments || 0,
                metaInfo: post?.metaInfo,
                views: post?.views || 0,
                status: "LIVE",
                posted_at: post?.postedAt || new Date(),
              }),
            )

            arrCheckContent.push({
              id: newContent.id,
              text: newContent.title + " " + newContent.text_content,
              matchKeywordSettings: post.matchKeywordSettings,
            })
            if (newContent && post.screenShot && page) {
              await page.goto(post.link, {
                waitUntil: "networkidle",
                timeout: 180000,
              })

              post.screenShotBuffer = await page.screenshot({
                fullPage: true,
                type: "jpeg",
              })
            }
            // socket.emit('new_content', {...post, ...newContent})
          } catch (error) {
            console.error(`Error when save new content: ${error}`)
            console.error(`postError ${post}`)
          }
        } else {
          const updatedNewContent = await clientDirectus.request(
            updateItem("contents", oldContent.id, {
              topicIds: post.topics,
              text_content: post.textContent,
              renderedContent: post.renderedContent,
              title: post.title,
              status: "LIVE",
              summary_desciption: post?.excerpt || "",
              image: post.imageContents?.[0] || "",
              // videoContents: post.videoContents,
            }),
          )
        }
        // if (config.default.isCheckContentPositiveOrNegative && arrCheckContent.length >= 10) {
        //   while (arrCheckContent.length >= 10) {
        //     const contentProcess = arrCheckContent.splice(0, 10)
        //     const postArrCheckContent = contentProcess.map((e) => ({id: e.id, text: e.text}))
        //     const resultCheckContent = await checkMultiContent(postArrCheckContent)
        //     if (resultCheckContent != null && resultCheckContent?.length > 0 && typeof resultCheckContent == "object") {
        //       await Promise.all(
        //         // @ts-ignore
        //         resultCheckContent.map(async (e: any) => {
        //           let metaNum = 0
        //           if (e[2].probability == 100) {
        //             metaNum = 99
        //           } else {
        //             metaNum = e[2].probability
        //           }
        //           if (e[1].label == "tieu cuc") {
        //             const updatedNewContent = await prisma.contents.update({
        //               where: {
        //                 id: e[0].id,
        //               },
        //               data: {
        //                 tagIds: ["878aa7a3-8691-49b9-8018-2159a8b55175"],
        //                 meta: metaNum,
        //               },
        //             })
        //             const socketMapUpate = {
        //               ...updatedNewContent,
        //               matchKeywordSettings: contentProcess.find((e) => e.id === updatedNewContent.id)
        //                 .matchKeywordSettings,
        //             }

        //             socket.emit("new_content", socketMapUpate)
        //           } else if (e[1].label == "tich cuc") {
        //             await prisma.contents.update({
        //               where: {
        //                 id: e[0].id,
        //               },
        //               data: {
        //                 tagIds: ["bafe7c3e-106c-4ebd-89c8-27f64de0c668"],
        //                 meta: metaNum,
        //               },
        //             })
        //           } else if (e[1].label == "binh thuong") {
        //             await prisma.contents.update({
        //               where: {
        //                 id: e[0].id,
        //               },
        //               data: {
        //                 tagIds: ["105a72e6-7a82-47ad-b383-e46252ae95f3"],
        //                 meta: metaNum,
        //               },
        //             })
        //           }
        //         }),
        //       )
        //     }
        //   }
        // }
      } catch (error) {
        console.error(`Error when save post ${error}`)
      }
    }
    // if (config.default.isCheckContentPositiveOrNegative && arrCheckContent.length > 0) {
    //   const postArrCheckContent = arrCheckContent.map((e) => ({id: e.id, text: e.text}))
    //   const resultCheckContent = await checkMultiContent(postArrCheckContent)
    //   if (resultCheckContent !== null && resultCheckContent?.length > 0 && typeof resultCheckContent == "object") {
    //     await Promise.all(
    //       //@ts-ignore
    //       resultCheckContent.map(async (e: any) => {
    //         let metaNum = 0
    //         if (e[2].probability == 100) {
    //           metaNum = 99
    //         } else {
    //           metaNum = e[2].probability
    //         }
    //         if (e[1].label == "tieu cuc") {
    //           const updatedNewContent = await prisma.contents.update({
    //             where: {
    //               id: e[0].id,
    //             },
    //             data: {
    //               tagIds: ["878aa7a3-8691-49b9-8018-2159a8b55175"],
    //               meta: metaNum,
    //             },
    //           })
    //           const socketMapUpate = {
    //             ...updatedNewContent,
    //             matchKeywordSettings: arrCheckContent.find((e) => e.id === updatedNewContent.id).matchKeywordSettings,
    //           }

    //           socket.emit("new_content", socketMapUpate)
    //         } else if (e[1].label == "tich cuc") {
    //           await prisma.contents.update({
    //             where: {
    //               id: e[0].id,
    //             },
    //             data: {
    //               tagIds: ["bafe7c3e-106c-4ebd-89c8-27f64de0c668"],
    //               meta: metaNum,
    //             },
    //           })
    //         } else if (e[1].label == "binh thuong") {
    //           await prisma.contents.update({
    //             where: {
    //               id: e[0].id,
    //             },
    //             data: {
    //               tagIds: ["105a72e6-7a82-47ad-b383-e46252ae95f3"],
    //               meta: metaNum,
    //             },
    //           })
    //         }
    //       }),
    //     )
    //   }
    // }
    if (type === "YOUTUBE" || type === "FACEBOOK" || type === "WEBSITE") {
      const sourceUpdated = await clientDirectus.request(
        updateItem("sources", source?.id || "", {
          count_cant_access: 0,
          total: source?.total || 0 + countNewContent,
        }),
      )
    }
    if (context) {
      await page.close()
    }
  } catch (error) {
    console.error(`Error when save data to db ${error}`)
  }
}
