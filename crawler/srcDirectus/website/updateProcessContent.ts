import {STATUS, PrismaClient, SOURCE_TYPE, contents} from "@prisma/client"
import {getMainContent} from "./getMainContent"

;(async () => {
  const prisma = new PrismaClient()
  console.log("Start")
  try {
    while (true) {
      const listContents = await prisma.contents.findMany({
        where: {
          process: true,
          updatedAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
          status: STATUS.LIVE,
        },
      })
      await Promise.all(
        listContents.map(async (e: contents) => {
          const result = await getMainContent(e.link)
          if (result.textContent == "") {
            await prisma.contents.update({
              where: {
                id: e.id,
              },
              data: {
                status: STATUS.DEAD,
              },
            })
          }
        }),
      )
      await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000))
    }
  } catch (error) {}
})()
