import {fbAccounts, PrismaClient, STATUS} from "@prisma/client"
import {chromium, Response} from "playwright"
import {getGroupsOfAccount} from "../request"
import {BrowserConfig} from "../request/types"
import {addStealth} from "../../browser/spoofing/stealth"
import login from "./login"

export const startAccount = async (prisma: PrismaClient, account: fbAccounts) => {
  let browser
  try {
    browser = await chromium.launch({
      headless: false,
    })

    let storageState = account.cookies ? JSON.parse(account.cookies) : undefined
    let context = await browser.newContext({
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

    let browserConfig: BrowserConfig = {
      context,
      defaultHeaders: {},
      defaultBody: {},
      browser,
    }

    const getDefaultRequestConfig = async (res: Response) => {
      if (res.url().startsWith("https://www.facebook.com/api/graphql")) {
        context.off("response", getDefaultRequestConfig)
        const allHeaders = await res.request().allHeaders()
        for (const key in allHeaders) {
          if (key.startsWith(":") || ["cookie", "x-fb-friendly-name"].includes(key)) {
            delete allHeaders[key]
          }
        }
        browserConfig.defaultHeaders = allHeaders
        browserConfig.defaultBody = res.request().postDataJSON()
      }
    }
    if (!account.firstRunAt) {
      context.on("response", getDefaultRequestConfig)
    }

    const loginResult = await login(context, account)
    if (loginResult.success) {
      let groupIds: any = []
      if (account.fbId && !account.firstRunAt) {
        groupIds = (await getGroupsOfAccount(browserConfig, account, account.fbId)) || []
      }
      const updatedAccount = await prisma.fbAccounts.update({
        where: {
          id: account.id,
        },
        data: {
          cookies: JSON.stringify(loginResult.state),
          status: STATUS.LIVE,
          lastRunAt: new Date(),
          ...(!account.firstRunAt && {firstRunAt: new Date()}),
          ...(groupIds?.length > 0 && {groupIds}),
          ...loginResult.info,
        },
      })
      if (!account.firstRunAt) {
        await context.close()
        await browser.close()
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

        browserConfig = {
          context,
          defaultHeaders: {},
          defaultBody: {},
          browser,
        }
      }
      const page = context.pages()[0]
      await page.goto("https://www.facebook.com/notifications", {timeout: 180000})
      // page.on("websocket", (ws) => {
      //   console.log(`WebSocket opened: ${ws.url()}>`)
      //   if (ws.url().startsWith("wss://gateway.facebook.com/ws/realtime")) {
      //     // ws.on('framesent', event => console.log(event.payload))
      //     // ws.on('framereceived', event => console.log(event.payload))
      //     ws.on("close", () => console.log("WebSocket closed"))
      //   }
      // })
      return {browserConfig, updatedAccount}
    } else {
      await prisma.fbAccounts.update({
        where: {
          id: account.id,
        },
        data: {
          // cookies: JSON.stringify(loginResult.state),
          status: STATUS.ERROR,
          lastRunAt: new Date(),
          // ...loginResult.info,
        },
      })
      await browser.close()
      return null
    }
  } catch (error) {
    console.log("Error when start an account: ", account.fbId, error)
    if (browser) {
      await browser.close()
    }
    return null
  }
}
