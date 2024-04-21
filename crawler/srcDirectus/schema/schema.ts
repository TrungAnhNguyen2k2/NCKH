// The main schema type containing all collections available
export interface SmccSchema {
  topics: Topic[]
  contents: Content[] // regular collections are array types
  sources: Source[]
  authors: Author[]
  facebok_accounts: FacebookAccount[]
}

// collection A
export interface Topic {
  id: string
  name: string
  total: number
  searchKeywords: string[]
  excludeKeywords: string[]
  keywords: {keywords: string}[]
  is_active_crawl: boolean
  last_search_at: Date
  intervalSearch: number
  screenShot: boolean
  nextSearchYoutubeAt: Date
  nextSearchGoogleAt: Date
  nextSearchFacebookAt: Date
  date_created: Date
  date_updated: Date
}
export interface FacebookAccount {
  id: string
  fbId: string
  status: string
  email: string
  avatar: string
  link: string
  token: string
  cookies: string
  name: string
  lastRunAt: Date
  phone: string
  location: string
  otp: string
  firstRunAt: Date
  groupIds: string[]
  username: string
  password: string
}
export interface Content {
  id: string
  title: string
  text_content: string
  link: string
  views: number
  comments: number
  shares: number
  likes: number
  tags: JSON
  summary_desciption: string
  posted_at: Date
  sourceInfo: string
  authorInfo: string
  topicIds: string[]
  categoryInfo: string
  trendInfo: string
  clusterInfo: string
  topicInfo: string
  image: string
  type: string
  metaInfo: JSON
  last_search_at: Date
  renderedContent: string
  interval_search: number
}
export interface Source {
  id: string
  name: string
  link: string
  type: string
  total: number
  avatar: string
  status: string
  isCrawl: boolean
  isTopic: boolean
  isCrawlVideo: boolean
  isCrawlShort: boolean
  lastCrawledAt: Date
  metaInfo: JSON
  count_cant_access: number
}
export interface Author {
  id: string
  name: string
  link: string
  avatar: string
}
