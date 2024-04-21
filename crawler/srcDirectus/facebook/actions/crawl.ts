import {STATUS, SOURCE_TYPE, topics, PrismaClient} from "@prisma/client"
import {getJoinGroupState, getPostInfor, getVideoInfor, getPostsFromSourceMbasic, searchFacebook} from "../request"
import * as config from "../../config/keys.config"
import {chromium} from "playwright"
import {addStealth} from "../../browser/spoofing/stealth"
import {Socket} from "socket.io-client"
import {joinGroup} from "./joinGroup"
import {BrowserConfig} from "../request/types"
import {Producer} from "kafkajs"
import {DirectusClient, RestClient, StaticTokenClient} from "@directus/sdk"
import {SmccSchema, Topic} from "../../schema/schema"
export const crawlSingleAccount = async ({
  browserConfig,
  account,
  clientDirectus,
  socket,

  redisClient,
  topics,
}: {
  browserConfig: BrowserConfig
  account: any
  clientDirectus: DirectusClient<SmccSchema> & RestClient<SmccSchema> & StaticTokenClient<SmccSchema>
  socket: Socket

  redisClient: any
  topics: Topic[]
}) => {
  try {
    console.log("Crawl single account: ", account.id)
    let {context, browser} = browserConfig
    let page
    // const page = await context.newPage()
    if (config.default.isSearchFacebook) {
      for (const keyword of account.listKeyword) {
        await searchFacebook(context, account, socket, topics, keyword, clientDirectus, redisClient)
        try {
          await context.close()
          await browser.close()
        } catch (error) {
          console.log("Error when close browser: ", error)
        }
        browser = await chromium.launch({
          headless: false,
        })

        let storageState = account.cookies ? JSON.parse(account.cookies) : undefined
        context = await browser.newContext({
          storageState,
          viewport: {
            width: 1920,
            height: 1007,
          },
          screen: {
            width: 1920,
            height: 1080,
          },
        })

        await addStealth(context)
        page = await context.newPage()
        await page.goto("https://www.facebook.com/notifications", {timeout: 180000})
        if (page.url().toLocaleLowerCase().includes("checkpoint")) {
          await prisma.fbAccounts.update({
            where: {
              id: account.id,
            },
            data: {
              status: "DEAD",
            },
          })
          await context.close()
          await browser.close()
          return
        }
      }
    }

    // const facebookSources = await prisma.sources.findMany({
    //   where: {
    //     status: STATUS.LIVE,
    //     isCrawl: true,
    //     OR: [{type: SOURCE_TYPE.FB_ACCOUNT}, {type: SOURCE_TYPE.FB_GROUP}, {type: SOURCE_TYPE.FB_PAGE}],
    //     accountId: account.fbId,
    //   },
    //   orderBy: {
    //     lastCrawledAt: "asc",
    //   },
    //   take: 10,
    // })

    // const newFacebookSources = await prisma.sources.findMany({
    //   where: {
    //     AND: [
    //       {
    //         OR: [{status: STATUS.WAITING}, {accountId: null}, {accountId: ""}],
    //       },
    //       {
    //         OR: [{type: SOURCE_TYPE.FB_ACCOUNT}, {type: SOURCE_TYPE.FB_GROUP}, {type: SOURCE_TYPE.FB_PAGE}],
    //       },
    //     ],
    //   },
    //   orderBy: {
    //     lastCrawledAt: "asc",
    //   },
    //   take: 2,
    // })
    // const newFacebookSources = await prisma.sources.findMany({
    //   where: {
    //     isCrawl: true,
    //     AND: [
    //       {
    //         OR: [{status: STATUS.WAITING}, {accountId: null}, {accountId: ""}],
    //       },
    //       {
    //         OR: [{type: SOURCE_TYPE.FB_ACCOUNT}, {type: SOURCE_TYPE.FB_PAGE}, {type: SOURCE_TYPE.FB_GROUP}],
    //       },
    //     ],
    //   },
    //   orderBy: {
    //     lastCrawledAt: "asc",
    //   },
    //   take: 2,
    // })

    const dataSources = [...account.listSource]

    await prisma.sources.updateMany({
      where: {
        id: {
          in: dataSources.map((s) => s.id),
        },
      },
      data: {
        accountId: account.fbId,
        updatedAt: new Date(),
        lastCrawledAt: new Date(),
      },
    })
    let count = 0
    for (const source of dataSources) {
      count = count + 1
      if (count % 10 == 0) {
        try {
          await context.close()
          await browser.close()
        } catch (error) {
          console.log("Error when close browser: ", error)
        }
        browser = await chromium.launch({
          headless: false,
        })

        let storageState = account.cookies ? JSON.parse(account.cookies) : undefined
        context = await browser.newContext({
          storageState,
          viewport: {
            width: 1920,
            height: 1007,
          },
          screen: {
            width: 1920,
            height: 1080,
          },
        })

        await addStealth(context)
        page = await context.newPage()
        await page.goto("https://www.facebook.com/notifications", {timeout: 180000})
        if (page.url().toLocaleLowerCase().includes("checkpoint")) {
          await prisma.fbAccounts.update({
            where: {
              id: account.id,
            },
            data: {
              status: "DEAD",
            },
          })
          await context.close()
          await browser.close()
          return
        }
      }
      let isJoinedGroup = true
      // if (source.type == SOURCE_TYPE.FB_GROUP) {
      //   const {joinStatus, avatar} = await getJoinGroupState(browserConfig, source.id)
      //   source.avatar = avatar
      //   if (joinStatus == "JOINED") {
      //     isJoinedGroup = true
      //   }
      // }

      if (source.type != SOURCE_TYPE.FB_GROUP || isJoinedGroup) {
        await getPostsFromSourceMbasic(context, account, source, socket, topics, prisma, producer, redisClient)
        await new Promise((r) => setTimeout(r, 20000))
      } else if (source.type == SOURCE_TYPE.FB_GROUP) {
        await joinGroup(browserConfig, prisma, account, source)
      }
      await prisma.fbAccounts.update({
        where: {
          id: account.id,
        },
        data: {
          lastRunAt: new Date(),
        },
      })

      // await Promise.allSettled([
      //   prisma.fbAccounts.update({
      //     where: {
      //       id: account.id,
      //     },
      //     data: {...account, meta: account.meta || {}},
      //   }),
      //   prisma.sources.update({
      //     where: {
      //       id: source.id,
      //     },
      //     data: source,
      //   }),
      // ])
    }
    // await page.close()
    await context.close()
    await browser.close()
    const sleepMinutes = 1 + 2 * Math.random()
    console.log(`End crawl single account: ${account.fbId}, sleep ${sleepMinutes}m`)
    // setTimeout(() => {
    //   crawlSingleAccount({browserConfig, account, prisma, socket, producer, redisClient, topics})
    // }, sleepMinutes * 60 * 1000)
  } catch (error) {
    console.log("Error when crawl", error)
  }
}
