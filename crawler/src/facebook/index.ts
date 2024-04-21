import {PrismaClient, STATUS, SOURCE_TYPE, fbAccounts} from "@prisma/client"
import {io} from "socket.io-client"
import * as _ from "lodash"
import {crawlSingleAccount} from "./actions/crawl"
import {getSourceFromUrl, getSourceFromUrlMbasic} from "./request"
import {createClient} from "redis"
import {BrowserConfig} from "./request/types"
import {startAccount} from "./actions/start"

import * as config from "../config/keys.config"

const socket = io(config.default.apiServer, {
  path: "/ws",
  auth: {
    token: config.default.socketSecretToken,
  },
})
const redisClient = createClient({
  url: config.default.redisUrl,
})

redisClient.on("error", (err) => console.log("Redis Client Error", err))

// let accounts: fbAccounts[] = []
// const accountContexts: {
//   [key: string]: {browserConfig: BrowserConfig; account: fbAccounts}
// } = {}

const prisma = new PrismaClient()
;(async () => {
  await redisClient.connect()
  const sleep = (time: number) => new Promise((res) => setTimeout(res, time, "done sleeping"))
  while (true) {
    await sleep(10000)
    let accounts = await prisma.fbAccounts.findMany({
      where: {
        status: STATUS.LIVE,
        OR: [
          {
            lastRunAt: {lte: new Date(new Date().setHours(new Date().getHours() - 6))},
          },
          {
            lastRunAt: null,
          },
        ],
      },
      orderBy: {
        lastRunAt: "asc",
      },
      take: 2,
    })
    if (!accounts || accounts?.length == 0) {
      continue
    }
    const topics = await prisma.topics.findMany({
      where: {
        isActiveCrawl: true,
      },
      orderBy: {
        nextSearchFacebookAt: "asc",
      },
    })
    const listSource = await prisma.sources.findMany({
      where: {
        status: STATUS.LIVE,
        isCrawl: true,
        lastCrawledAt: {
          lte: new Date(new Date().setHours(new Date().getHours() - 2)),
        },
        OR: [{type: SOURCE_TYPE.FB_ACCOUNT}, {type: SOURCE_TYPE.FB_GROUP}, {type: SOURCE_TYPE.FB_PAGE}],
      },
    })

    let listAccounts = accounts.map((e) => {
      return {
        ...e,
        listSource: listSource.filter((f) => f.accountId == e.fbId && f.type == "FB_GROUP"),
        listKeyword: [],
      }
    })

    let listSourceNotGroup = listSource.filter((e) => e.type != "FB_GROUP")
    let listGroupNotAccountId = listSource.filter(
      (e) => e.type === "FB_GROUP" && (e.accountId === null || e.accountId === ""),
    )
    const numberGroupNotAccountPerAcc = Math.round(listGroupNotAccountId.length / listAccounts.length)
    const numberSourcePerAccount = Math.round(listSourceNotGroup.length / listAccounts.length)
    if (topics.length > 0) {
      try {
        await prisma.topics.update({
          where: {
            id: topics?.[0].id,
          },
          data: {
            nextSearchFacebookAt: new Date(new Date().getTime() + topics?.[0]?.intervalSearch),
          },
        })
      } catch (error) {}
    }

    const searchTopic = topics?.[0]?.nextSearchFacebookAt < new Date() ? topics[0] : null
    let listKeywords = searchTopic?.searchKeywords || []
    const numberKeywordPerAccount = Math.round(listKeywords.length / listAccounts.length)

    for (let i = 0; i < listAccounts.length; i++) {
      let tempSourceList
      let tempKeywordList
      let tempGroupList
      if (i !== listAccounts.length - 1) {
        tempSourceList = listSourceNotGroup.splice(0, numberSourcePerAccount)
        tempKeywordList = listKeywords.splice(0, numberKeywordPerAccount)
        tempGroupList = listGroupNotAccountId.splice(0, numberGroupNotAccountPerAcc)
      } else {
        tempSourceList = listSourceNotGroup
        tempKeywordList = listKeywords
        tempGroupList = listGroupNotAccountId
      }
      listAccounts[i].listSource = listAccounts[i].listSource.concat(tempSourceList)
      listAccounts[i].listKeyword = tempKeywordList
      listAccounts[i].listSource = listAccounts[i].listSource.concat(tempGroupList)
    }
    listAccounts = listAccounts.filter((e) => e.listKeyword.length + e.listSource.length > 0)

    if (listAccounts.length > 0) {
      await Promise.all(
        listAccounts.map(async (account) => {
          const runAcc = await startAccount(prisma, account)
          if (runAcc) {
            const {browserConfig, updatedAccount} = runAcc
            if (browserConfig && account.fbId) {
              account = {...account, token: updatedAccount.token, firstRunAt: updatedAccount.firstRunAt}

              await crawlSingleAccount({browserConfig, account, prisma, socket, redisClient, topics})
            }
          }
        }),
      )
    }
  }
  // accounts = await prisma.fbAccounts.findMany({
  //   where: {
  //     status: STATUS.LIVE,
  //   },
  // })
  // let listTopics = await prisma.topics.findMany({
  //   where: {
  //     isActiveCrawl: true,
  //   },
  // })
  // let listKeywords: string[] = []
  // listTopics.forEach((e: any) => {
  //   e.keywords.forEach((f: any) => {
  //     const stringKeyword = f?.keywords.replaceAll(")", "").replaceAll("(", "").split("&")[0].split("|")
  //     listKeywords = [...new Set([...listKeywords, ...stringKeyword])]
  //   })
  // })
  // await Promise.all(
  //   accounts.map(async (account) => {
  //     const runAcc = await startAccount(prisma, account)
  //     if (runAcc) {
  //       const {browserConfig, updatedAccount} = runAcc
  //       if (browserConfig && account.fbId) {
  //         account = {...account, token: updatedAccount.token}
  //         accountContexts[account.fbId] = {browserConfig, account}
  //         crawlSingleAccount({browserConfig, account, prisma, socket, listKeywords, producer, redisClient})
  //       }
  //     }
  //   }),
  // )
})()

socket.on("connect", () => {
  console.log(`Client connected: ${socket.id}`)
  socket.emit("new_fb_crawler")
})

socket.on("disconnect", () => {
  console.log(`Client disconnected`)
})

socket.on("connect_error", (e) => {
  console.log("Connect error: ", e)
})

// socket.on("check_source_req", async (urls: string[]) => {
//   console.log("New source urls: ", urls)
//   const totalAccounts = accounts.length
//   const urlChunk = _.chunk(urls, Math.ceil(urls.length / totalAccounts))
//   const newSources: Array<{[key: string]: any}> = []
//   const invalidUrls: string[] = []
//   const results = await Promise.allSettled(
//     urlChunk.map(async (urls: string[], index: number) => {
//       const account = accounts[index]
//       console.log("account: ", account.fbId)
//       if (account.fbId) {
//         const {
//           browserConfig: {context},
//         } = accountContexts[account.fbId]
//         for (const url of urls) {
//           try {
//             const result = await getSourceFromUrlMbasic(context, url)
//             const urlLink = new URL(url)
//             console.log("result from url: ", url, result)
//             if (result) {
//               newSources.push({
//                 ...result,
//                 link: result.link,
//                 status: STATUS.LIVE,
//                 accountId: account.fbId,
//               })
//             } else {
//               invalidUrls.push(url)
//             }
//           } catch (error) {
//             console.log("Error when get URL link", error)
//           }
//         }
//       }
//       return newSources
//     }),
//   )

//   for (const source of newSources.filter((source) => source.type == SOURCE_TYPE.FB_GROUP)) {
//     for (const account of accounts) {
//       if (account.groupIds.includes(source.id)) {
//         source.accountId = account.fbId
//         break
//       }
//     }
//   }

//   socket.emit("check_source_res", {newSources, invalidUrls})
// })

// // Todo: Add socket handle take screenShot

// socket.on("add_account", async () => {
//   const newAccounts = await prisma.fbAccounts.findMany({
//     where: {
//       status: STATUS.WAITING,
//     },
//   })
//   await Promise.all(
//     newAccounts.map(async (account) => {
//       const {browserConfig, updatedAccount} = await startAccount(prisma, account)
//       if (browserConfig && account.fbId) {
//         account = {...account, token: updatedAccount.token}
//         accountContexts[account.fbId] = {browserConfig, account}
//         accounts.push(account)
//       }
//     }),
//   )
// })
