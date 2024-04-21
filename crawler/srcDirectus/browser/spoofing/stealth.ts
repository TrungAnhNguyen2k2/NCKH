import * as fs from 'fs'
import * as path from 'path'
import { BrowserContext } from 'playwright'

const scriptsContent: { [key: string]: string } = {}

export const addStealth = async (browserContext: BrowserContext) => {
  const fileNames = ['js-stealth/chrome.hairline.js', 'webdriver']

  await Promise.all(
    fileNames.map(async (filename) => {
      let script = ''
      if (filename === 'webdriver') {
        script = 'delete Object.getPrototypeOf(navigator).webdriver'
      } else {
        scriptsContent[filename] =
          scriptsContent[filename] ||
          (await fs.promises.readFile(
            path.resolve(__dirname, filename),
            'utf-8'
          ))
        script = scriptsContent[filename]
      }
      await browserContext.addInitScript(script)
    })
  )

  return browserContext
}
