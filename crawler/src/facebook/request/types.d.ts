import {BrowserContext, Browser} from "playwright"
import {KeywordSetting} from "../../types"

export type BrowserConfig = {
  context?: BrowserContext
  defaultHeaders: {[key: string]: string}
  defaultBody: {[key: string]: string}
  browser?: Browser
}

export type MembershipQuestion = {
  id: string
  can_viewer_report: boolean
  question: string
  question_type: "CHECKBOXES" | "PARAGRAPH" | "MULTIPLE_CHOICE" // multiple_choice is single_choice
  question_options: Array<{id: string; question_option: string}>
  answer: string | null
  selected_options: Array<string> | null
}

export type FacebookImage = {
  uri: string
  width: number
  height: number
}

export type CrawledFacebookPost = {
  id: string
  topics: string[]
  screenShot?: boolean
  screenShotBuffer?: Buffer
  matchKeywordSettings: Array<KeywordSetting>
  author: {
    id: string
    name: string
    url: string
    profile_picture: string
  }
  textContent: string
  renderedContent?: string
  link: string
  images: Array<{id: string; previewImage: FaceBookImage; fullImage: FaceBookImage}>
  videos: Array<{id: string; previewImage: FaceBookImage; videoUrl: string; videoUrlHD: string}>
  likes: number
  comments: number
  shares: number
  postedAt: Date
  isPublic: boolean
}
