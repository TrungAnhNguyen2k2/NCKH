export type CrawledWebsitePost = {
  renderedContent: string
  textContent: string
  title: string
  excerpt: string
  favicon: string
  topics: string[]
  screenShot?: boolean
  screenShotBuffer?: Buffer
  matchKeywordSettings: Array<KeywordSetting>
  renderedContent?: string
  link: string
  imageContents: string[]
  videoContents: string[]
  postedAt: Date | null
}
