import * as config from "../../src/config/keys.config"
// import "cross-fetch/polyfill"
const PocketBase = require("pocketbase/cjs")

const pb = new PocketBase(config.default.pocketBaseUrl)
pb.autoCancellation(false)
const {GoogleGenerativeAI, HarmCategory, HarmBlockThreshold} = require("@google/generative-ai")

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
;(async () => {
  console.log("Start")
  const genAI = new GoogleGenerativeAI(config.default.geminiApiKey)
  const model = genAI.getGenerativeModel({model: "gemini-pro"})
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  }
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ]
  let dateCheck = new Date().getTime()
  while (true) {
    if (new Date().getTime() - dateCheck > 1000) {
      dateCheck = new Date().getTime()
      try {
        let post
        try {
          post = await pb.collection("contents").getFirstListItem("isAIProcess=false", {
            sort: "created",
          })
          await pb.collection("contents").update(post.id, {
            isAIProcess: true,
          })
        } catch (error) {}
        if (post) {
          // Thể loại
          const listCategory = await pb.collection("categories").getFullList()
          const parts = [
            {text: " "},
            {
              text: ` ${
                post.textContent
              }  - Tìm các từ khóa chính của bài viết \n- Đánh giá bài viết là tích cực tiêu cực hay bình thường \n- Bài viết thuộc chủ đề nào trong các chủ để ${listCategory
                .map((e: {name: any}) => e.name)
                .toString()} \n- Tóm tắt bài viết`,
            },
            {text: "output: "},
          ]
          let result: any
          try {
            result = await model.generateContent({
              contents: [{role: "user", parts}],
              generationConfig,
              safetySettings,
            })
          } catch (error) {
            console.log("Error gemini", error, parts)
          }
          if (result) {
            const response = result?.response
            let data: any
            try {
              data = response
                ?.text()
                ?.split("\n-")
                ?.filter((e: any) => e)
            } catch (error) {
              if (response?.promptFeedback?.safetyRatings) {
                const hight = response?.promptFeedback?.safetyRatings?.find(
                  (e: {probability: string}) => e.probability === "HIGH",
                )
                const medium = response?.promptFeedback?.safetyRatings?.find(
                  (e: {probability: string}) => e.probability === "MEDIUM",
                )
                const low = response?.promptFeedback?.safetyRatings?.find(
                  (e: {probability: string}) => e.probability === "LOW",
                )
                let cate: any
                if (hight) {
                  if (hight.category === "HARM_CATEGORY_SEXUALLY_EXPLICIT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Khêu gợi tình dục")
                  } else if (hight.category === "HARM_CATEGORY_HATE_SPEECH") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Phát ngôn thù hận")
                  } else if (hight.category === "HARM_CATEGORY_HARASSMENT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Quấy rối")
                  } else if (hight.category === "HARM_CATEGORY_DANGEROUS_CONTENT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Nội dung nguy hiểm")
                  }
                } else if (medium) {
                  if (medium.category === "HARM_CATEGORY_SEXUALLY_EXPLICIT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Khêu gợi tình dục")
                  } else if (medium.category === "HARM_CATEGORY_HATE_SPEECH") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Phát ngôn thù hận")
                  } else if (medium.category === "HARM_CATEGORY_HARASSMENT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Quấy rối")
                  } else if (medium.category === "HARM_CATEGORY_DANGEROUS_CONTENT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Nội dung nguy hiểm")
                  }
                } else if (low) {
                  if (low.category === "HARM_CATEGORY_SEXUALLY_EXPLICIT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Khêu gợi tình dục")
                  } else if (low.category === "HARM_CATEGORY_HATE_SPEECH") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Phát ngôn thù hận")
                  } else if (low.category === "HARM_CATEGORY_HARASSMENT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Quấy rối")
                  } else if (low.category === "HARM_CATEGORY_DANGEROUS_CONTENT") {
                    cate = listCategory.find((e: {name: string}) => e.name === "Nội dung nguy hiểm")
                  }
                }
                try {
                  await pb.collection("contents").update(post.id, {
                    categoryInfo: cate.id,
                    isAIProcess: true,
                  })
                  await pb.collection("categories").update(cate.id, {
                    total: cate.total + 1,
                  })
                } catch (error) {
                  console.log("Error", error)
                  console.log("cate", cate)
                  console.log("listCategory", listCategory)
                  console.log("response?.promptFeedback?.safetyRatings", response?.promptFeedback?.safetyRatings)
                }
              } else {
                await pb.collection("contents").update(post.id, {
                  // categoryInfo: category.id,
                  isAIProcess: true,
                  // keyword: listKeyWords,
                  // tag: checkContent,
                  // ...(post.summaryDescription && {summaryDescription: summaryContent}),
                })
                console.log("Error", error)
                console.log(typeof error)
                console.log(response)
                console.log("JSON.stringify(response)", JSON.stringify(response))
                console.log("parts", parts)
              }
            }

            let listKeyWords =
              data?.[0]
                ?.replace("-", "")
                ?.replace("Từ khóa chính:", "")
                ?.replace("Từ khóa chính của bài viết:", "")
                ?.split(",")
                ?.map((e: string) => e.trim().toLowerCase()) || []
            let checkContent = data?.[1]?.toLowerCase()?.includes("binh thuong")
              ? "Bình thường"
              : data?.[1]?.toLowerCase()?.includes("tieu cuc") && !data?.[1]?.toLowerCase()?.includes("tich cuc")
              ? "Tiêu cực"
              : "Tích cực"
            let category = listCategory.find((e: {name: string}) => data?.[2]?.includes(e.name.trim()))
            if (!category) {
              category = listCategory.find((e: {name: string}) => e.name.toLowerCase().includes("khác"))
            }
            let summaryContent = data?.[3]?.replace("Tóm tắt:", "")
            let listKeywordId: string[] = []
            for (const keyWord of listKeyWords) {
              if (keyWord) {
                let oldKeyWord
                try {
                  oldKeyWord = await pb.collection("keywords").getFirstListItem(`name="${keyWord}"`)
                } catch (error) {}

                if (oldKeyWord) {
                  listKeywordId.push(oldKeyWord.id)
                  await pb.collection("keyWordByTime").create({
                    keywordId: oldKeyWord.id,
                  })
                  await pb.collection("keywords").update(oldKeyWord.id, {
                    total: oldKeyWord.total + 1,
                  })
                } else {
                  try {
                    const newKeyword = await pb.collection("keywords").create({
                      name: keyWord,
                      total: 1,
                    })
                    await pb.collection("keyWordByTime").create({
                      keywordId: newKeyword.id,
                    })
                    listKeywordId.push(newKeyword.id)
                  } catch (error) {
                    console.log("Error add keywoird", keyWord)
                  }
                }
              }
            }
            try {
              await pb.collection("contents").update(post.id, {
                categoryInfo: category.id,
                isAIProcess: true,
                keywords: listKeywordId,
                tag: checkContent,
                ...(post.summaryDescription && {summaryDescription: summaryContent}),
              })
              await pb.collection("categories").update(category.id, {
                total: category.total + 1,
              })
            } catch (error) {
              console.log("Error when create content", error)
              console.log("listKeyWords", listKeyWords)
            }
          }
        }
      } catch (error) {
        console.log("Error when gen ai", error)
      }
    }
  }
})()
