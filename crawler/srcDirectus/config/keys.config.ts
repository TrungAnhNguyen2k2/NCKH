import dotenv from "dotenv"
dotenv.config()

export default {
  dataBaseUrl: process.env.DATABASE_URL || "postgresql://postgres:W%2mN7&WkF@localhost:5432/postgres?schema=smcc",
  socketSecretToken: process.env.SOCKET_SECRET_TOKEN || "0thisisasecrettoken$$$forwebsocketconnection0",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  apiServer: process.env.API_SERVER || "http://localhost:8000",
  listProxy: process.env.LIST_PROXY || "",
  severIP: process.env.SERVER_IP || "",
  kafkaTopic: process.env.KAFKA_TOPIC || "SMCC",
  numThreadWebCate: Number(process.env.NUM_THREAD_WEB_CATE) || 20,
  numThreadYouShort: Number(process.env.NUM_THREAD_YOUTUBE_SHORT) || 20,
  numThreadYouVideo: Number(process.env.NUM_THREAD_YOUTUBE_VIDEO) || 20,
  isSearchFacebook: process.env.IS_SEACH_FACEOOK == "true" || false,
  isScreenShot: process.env.SCREEN_SHORT == "true" || false,
  useKafka: process.env.SEND_DATA_TO_KAFKA == "true" || false,
  isCheckContentPositiveOrNegative: process.env.IS_CHECK_CONTENT_POSITIVE_NEGATIVE == "true" || false,
  minTimeCrawlWeb: Number(process.env.MIN_CRAWL_WEB) || 30,
  minTimeCrawlYouTube: Number(process.env.MIN_CRAWL_YOUTUBE) || 30,
  minTimeCrawlFacebook: Number(process.env.MIN_CRAWL_FACEBOOK) || 30,
  pocketBaseUrl: process.env.POCKET_BASE_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  directusUrl: process.env.DIRECTUS_URL || "",
  directusStaticToken: process.env.DIRECTUS_TOKEN || "",
}
