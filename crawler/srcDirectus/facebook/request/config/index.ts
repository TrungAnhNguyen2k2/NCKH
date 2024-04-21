import {SOURCE_TYPE} from "@prisma/client"
import {BrowserConfig} from "../types"
import {BrowserContext} from "playwright"

type RequestConfig = {
  [key: string]: {
    firstHeaders?: any
    nextHeaders?: any
    firstBody?: any
    nextBody?: any
    firstVariables?: any
    nextVariables?: any
  }
}

const cachedRequestConfigs: {
  [key: string]: {
    requestConfig: RequestConfig
    expire: number
  }
} = {}

export const getRequestOptions = async (
  sourceType: string,
  targetId: string,
  userId: string,
  token: string,
  browserConfig: BrowserConfig = {context: null, defaultBody: {}, defaultHeaders: {}},
  cursor: string = "",
) => {
  cachedRequestConfigs[userId] = cachedRequestConfigs[userId] || {requestConfig: {}, expire: Date.now() - 1}
  cachedRequestConfigs[userId]
  if (cachedRequestConfigs[userId].expire < Date.now() || !cachedRequestConfigs[userId].requestConfig) {
    cachedRequestConfigs[userId].requestConfig = await getNewRequestOptions(browserConfig.context, userId)
    cachedRequestConfigs[userId].expire = Date.now() + 1000 * 60 * 60 * 24
  }
  let config = undefined
  let variables = undefined
  switch (sourceType) {
    case SOURCE_TYPE.FB_ACCOUNT:
    case "profile":
      config = cachedRequestConfigs[userId].requestConfig["profile"]
      variables = {userID: targetId}
      break

    case SOURCE_TYPE.FB_PAGE:
    case "page":
      config = cachedRequestConfigs[userId].requestConfig["page"]
      variables = {pageID: targetId}
      break

    case SOURCE_TYPE.FB_GROUP:
    case "group":
      config = cachedRequestConfigs[userId].requestConfig["group"]
      variables = {groupID: targetId}
      break

    case "groupList":
      config = cachedRequestConfigs[userId].requestConfig["groupList"]
      variables = {}
      break

    default:
      break
  }

  if (config) {
    return {
      method: "POST",
      headers: {
        ...browserConfig.defaultHeaders,
        ...config.firstHeaders,
        ...(cursor ? {...config.nextHeaders} : null),
      },
      form: {
        ...browserConfig.defaultBody,
        ...config.firstBody,
        ...(cursor ? {...config.nextBody} : null),
        variables: JSON.stringify({
          ...config.firstVariables,
          ...(cursor
            ? {
                ...config.nextVariables,
                id: targetId,
                cursor,
              }
            : null),
          ...variables,
        }),
      },
    }
  } else {
    return null
  }
}

const getNewRequestOptions = async (context: BrowserContext, userId: string) => {
  cachedRequestConfigs[userId] = cachedRequestConfigs[userId] || {requestConfig: {}, expire: Date.now() - 1}
  const requestConfig = cachedRequestConfigs[userId].requestConfig || {}
  const page = await context.newPage()

  try {
    page.on("response", async (res) => {
      if (res.url().match(/https:\/\/www\.facebook\.com\/api\/graphql/)) {
        const req = res.request()
        const body = req.postDataJSON()
        console.log(body.fb_api_req_friendly_name)

        if (body?.fb_api_req_friendly_name === "CometGroupDiscussionRootSuccessQuery") {
          requestConfig["group"] = {
            ...requestConfig["group"],
            firstHeaders: {
              "x-fb-friendly-name": "CometGroupDiscussionRootSuccessQuery",
            },
            firstBody: body,
            firstVariables: {
              ...JSON.parse(body.variables),
              sortingSetting: "CHRONOLOGICAL",
            },
          }
        }
        if (body?.fb_api_req_friendly_name === "GroupsCometFeedRegularStoriesPaginationQuery") {
          requestConfig["group"] = {
            ...requestConfig["group"],
            nextHeaders: {
              "x-fb-friendly-name": "GroupsCometFeedRegularStoriesPaginationQuery",
            },
            nextBody: body,
            nextVariables: {
              ...JSON.parse(body.variables),
              sortingSetting: "CHRONOLOGICAL",
            },
          }
        }

        if (body?.fb_api_req_friendly_name === "CometSinglePageContentContainerFeedQuery") {
          requestConfig["page"] = {
            ...requestConfig["page"],
            firstHeaders: {
              "x-fb-friendly-name": "CometSinglePageContentContainerFeedQuery",
            },
            firstBody: body,
            firstVariables: JSON.parse(body.variables),
          }
        }

        if (body?.fb_api_req_friendly_name === "CometModernPageFeedPaginationQuery") {
          requestConfig["page"] = {
            ...requestConfig["page"],
            nextHeaders: {
              "x-fb-friendly-name": "CometModernPageFeedPaginationQuery",
            },
            nextBody: body,
            nextVariables: JSON.parse(body.variables),
          }
        }

        if (body?.fb_api_req_friendly_name === "GroupsCometTabGroupMembershipDialogQuery") {
          requestConfig["groupList"] = {
            ...requestConfig["groupList"],
            firstHeaders: {
              "x-fb-friendly-name": "GroupsCometTabGroupMembershipDialogQuery",
            },
            firstBody: body,
            firstVariables: JSON.parse(body.variables),
          }
        }

        if (body?.fb_api_req_friendly_name === "GroupsCometTabGroupMembershipListPaginationQuery") {
          requestConfig["groupList"] = {
            ...requestConfig["groupList"],
            nextHeaders: {
              "x-fb-friendly-name": "GroupsCometTabGroupMembershipListPaginationQuery",
            },
            nextBody: body,
            nextVariables: JSON.parse(body.variables),
          }
        }

        if (body?.fb_api_req_friendly_name === "ProfileCometTimelineFeedQuery") {
          requestConfig["profile"] = {
            ...requestConfig["profile"],
            firstHeaders: {
              "x-fb-friendly-name": "ProfileCometTimelineFeedQuery",
            },
            firstBody: body,
            firstVariables: JSON.parse(body.variables),
          }
        }

        if (
          body?.fb_api_req_friendly_name === "ProfileCometTimelineFeedPaginationQuery" ||
          body?.fb_api_req_friendly_name === "ProfileCometTimelineFeedRefetchQuery"
        ) {
          requestConfig["profile"] = {
            ...requestConfig["profile"],
            nextHeaders: {
              "x-fb-friendly-name": body.fb_api_req_friendly_name,
            },
            nextBody: body,
            nextVariables: JSON.parse(body.variables),
          }
        }
      }
    })

    // get group list requests
    await page.goto("https://www.facebook.com/groups", {
      waitUntil: "domcontentloaded",
    })

    const groupSettingBtn = page.locator('[role="navigation"] [role="button"]', {
      has: page.locator("i"),
      hasText: /^$/,
    })

    await groupSettingBtn.click()

    const menuBtn = page.locator('[role="menu"] [role="menuitem"]')

    await menuBtn.last().click()

    const groupItem = page.locator('[role="dialog"] a[href^="/groups/"]')
    await groupItem.first().hover()
    for (let i = 0; i < 100; i++) {
      await page.waitForTimeout(1000)
      await page.mouse.wheel(0, 1000)
      await page.waitForTimeout(1000)
      if (requestConfig["groupList"]?.nextVariables) {
        break
      }
    }

    // get group requests
    await Promise.all([groupItem.first().click(), page.waitForLoadState("networkidle")])
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("PageDown")
      await page.waitForTimeout(1000)
      if (requestConfig["group"]?.nextVariables) {
        break
      }
    }

    // get page requests
    await page.goto("https://www.facebook.com/search/top/?q=vtv24", {
      waitUntil: "domcontentloaded",
    })
    const pageLink = page.locator('a[href*="tintucvtv24"]')

    await Promise.all([pageLink.first().click(), page.waitForLoadState("networkidle")])

    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("PageDown")
      await page.waitForTimeout(1000)
      if (requestConfig["page"]?.nextVariables) {
        break
      }
    }

    // get profile requests
    await page.goto("https://www.facebook.com/friends", {
      waitUntil: "domcontentloaded",
    })

    await page.waitForSelector('a[href^="https://www.facebook.com/profile.php?id="]')
    const profileLinks = await page.$$('a[href^="https://www.facebook.com/profile.php?id="]')
    const profileHrefs = await Promise.all(profileLinks.map((link) => link.getAttribute("href")))
    const validProfileLink = profileHrefs[0]

    await Promise.all([page.click(`a[href="${validProfileLink}"]`), page.waitForLoadState("networkidle")])

    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("PageDown")
      await page.waitForTimeout(1000)
      if (requestConfig["profile"]?.nextVariables) {
        break
      }
    }
    return requestConfig
  } catch (error) {
    console.log("Error when get new requests config: ", error)
  } finally {
    await page.close()
  }
}
