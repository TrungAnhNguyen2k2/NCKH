import {BrowserContext, Page} from "playwright"
import {fbAccounts} from "@prisma/client"
import {authenticator} from "otplib"

export default async (context: BrowserContext, account: fbAccounts) => {
  const page = await context.newPage()
  await page.goto("https://mbasic.facebook.com", {waitUntil: "domcontentloaded", timeout: 180000})
  await page.waitForTimeout(50 * 1000)
  const email = account.email || account.phone || account.id
  const password = account.password

  const tokenInput = 'form[action^="/composer/mbasic/"] input[name="fb_dtsg"]'
  const quickLoginBtn = 'form[action^="/login/device-based/validate-pin"]'
  const quickLoginBtnOneTap = 'form[action^="/login/device-based/update-nonce"]'
  const emailInput = 'input[name="email"]'
  const passInput = 'input[name="pass"][type="password"]'

  let step = ""
  let stepCount = 0
  let loginSuccess = false
  let loginState = null

  while (true) {
    stepCount += 1
    if (await page.$(tokenInput)) {
      loginSuccess = true
      break
    }

    if (stepCount > 10) {
      if (page.url().includes("checkpoint")) {
        loginSuccess = false
      } else {
        loginSuccess = true
      }
      break
    }
    if (await page.$(quickLoginBtn)) {
      await page.click(quickLoginBtn)
      step = "quickLoginBtn"
    }
    if (await page.$(emailInput)) {
      await page.fill(emailInput, email)
      step = "inputEmail"
    }
    if (await page.$(passInput)) {
      await page.fill(passInput, password)
      await page.click('input[type="submit"]')
      step = "inputPassword"
    }
    if (await page.$(quickLoginBtnOneTap)) {
      await page.click(`${quickLoginBtnOneTap} input[type="submit"]`)
      step = "confirmOneTap"
    }
    if (await page.$("#approvals_code")) {
      if (account.otp) {
        const code = authenticator.generate(account.otp)
        await page.fill("#approvals_code", code)
      } else {
        await Promise.any([
          page.waitForTimeout(60000),
          page.waitForNavigation({
            waitUntil: "domcontentloaded",
          }),
        ])
      }

      step = "inputCode"
      await page
        .click('#checkpointSubmitButton > input[type="submit"]')
        .catch((e) => console.log("Click submit after OTP error (but ok)"))
    }

    if (await page.$('input[value="save_device"]')) {
      await page.click('input[value="save_device"]')
      step = "saveDevice"
      await page.click('#checkpointSubmitButton > input[type="submit"]')
    }

    if (await page.$("td#checkpointSubmitButton input#checkpointSubmitButton-actual-button")) {
      if (await page.$('form[action="/login/checkpoint/"] ul > li > img')) {
        console.log("Wait for submit other device")
        await Promise.any([
          page.waitForTimeout(60 * 1000 * 5),
          page.waitForNavigation({
            waitUntil: "load",
          }),
        ])
        if (await page.$("td#checkpointSubmitButton input#checkpointSubmitButton-actual-button")) {
          await page.click("td#checkpointSubmitButton input#checkpointSubmitButton-actual-button")
        }
        await page.waitForLoadState("load", {
          timeout: 10000,
        })
        await page.goto("https://mbasic.facebook.com", {timeout: 180000})
      }
      if (await page.$("td#checkpointSubmitButton input#checkpointSubmitButton-actual-button")) {
        await page.waitForTimeout(60 * 1000)
        await page.click("td#checkpointSubmitButton input#checkpointSubmitButton-actual-button")
      }
      step = "checkPoint"
    }
    try {
      await page.waitForLoadState("load", {
        timeout: 10000,
      })
      console.log(`Wait for state after ${step}`)
    } catch (error) {
      console.log(`No load state change after ${step}`)
    }
  }
  let info: {
    token: any
    phone?: string
    email?: string
    fbId?: any
    link?: string
    avatar?: any
    name?: any
    location?: any
  } = undefined
  if (loginSuccess) {
    await page.goto("https://mbasic.facebook.com/me/about", {
      waitUntil: "domcontentloaded",
    })

    info = await page.evaluate(() => {
      const contactInfos = Array.from(document.querySelectorAll("#contact-info table tr td")).map((e) => e.textContent)
      // @ts-expect-error
      const location = document.querySelector('#living table td a[href^="/profile"]')?.innerText
      // @ts-expect-error
      const matchId = document.querySelector('a[href^="/photo"]')?.href?.match(/&id=(\d+)/)
      const matchLink = window.location.href.match("https://mbasic.facebook.com/(.+?)/")
      // @ts-expect-error
      const name = document.querySelector("#root > div > div span > strong")?.innerText
      // @ts-expect-error
      const token = document.querySelector('[name="fb_dtsg"]')?.value
      // @ts-expect-error
      const avatar = document.querySelector('#root > div > div > div:nth-child(2) a[href^="/photo"] img')?.src
      return {
        phone: contactInfos.find((e) => e?.match(/[0-9]+(\s?[0-9]+)+/g))?.replaceAll(" ", ""),
        email: contactInfos.find((e) => e?.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)),
        fbId: matchId && matchId[1],
        link: `https://www.facebook.com/${matchId && matchId[1]}`,
        avatar,
        token,
        name,
        location,
      }
    })
    // if (!info.token) {
    //   let check = true
    //   let linkRegex = new RegExp('fb_dtsg=' + '.*?' + '&', 'g')
    //   page.on('request', async (request) => {
    //     if (check) {
    //       if (request.url().includes('ajax/bulk-route-definitions')) {
    //         info.token = decodeURI(
    //           request.postDataBuffer().toString().match(linkRegex)[0].replace('fb_dtsg=', '').slice(0, -1),
    //         )
    //         check = false
    //       }
    //     }
    //   })
    // }
    await page.waitForTimeout(5000)
    await page.goto("https://www.facebook.com", {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    })

    if (!info.token) {
      info.token = await page.evaluate(() => {
        // @ts-expect-error
        return document.querySelector('[name="fb_dtsg"]')?.value || require("DTSGInitialData")?.token
      })
    }

    try {
      await page.locator('[role="button"][aria-label="OK"]').click({
        timeout: 5000,
      })
      console.log("Clicked OK remember password button")
    } catch (error) {
      console.log("No Remember Password OK button")
    }
    loginState = await context.storageState()
  }

  return {success: loginSuccess, state: loginState, info}
}

export const isLoggedIn = async (page: Page) => {
  return await page.evaluate(() => {
    return !!Array.from(document.querySelectorAll("a")).filter((a) => a.innerText.match(/login|log in/gi))?.length
  })
}
