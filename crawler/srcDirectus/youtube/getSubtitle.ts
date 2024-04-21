import {getHtml} from "libts/src/getHtml"
import * as xml2js from "xml2js"
export async function getSubtitle(videoId: string, proxy: string) {
  const html = await getHtml(`https://www.youtube.com/watch?v=${videoId}`, "", proxy)
  if (html) {
    let prefix1 = "https://www.youtube.com/api/timedtext?"
    let suffix1 = '"'
    let linkRegex = new RegExp(prefix1 + ".*?" + suffix1, "g")

    const linkSub = html.html
      ?.match(linkRegex)
      ?.filter((e) => e?.includes("lang=vi"))?.[0]
      ?.replace('"', "")
      ?.replaceAll("\\u0026", "&")

    if (linkSub) {
      const subData = await getHtml(linkSub, "", proxy)
      let resultJson = null
      resultJson = await xml2js.parseStringPromise(subData.html, {mergeAttrs: true})
      return resultJson
    }
    return null
  }
  return null
}
