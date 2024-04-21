import {Prisma} from "../../lib/index.js"
import {PrismaClient} from "@prisma/client"
import {findByContentId} from "./Comment.repo.js"
import * as TopicRepo from "./Topic.repo.js"
import * as TagRepo from "./Tag.repo.js"
import * as ProfileRepo from "./Profile.repo.js"
import * as SourceRepo from "./Source.repo.js"
import * as AuthorRepo from "./Author.repo.js"
import {updateHandledTelegramMessage, deleteTelegramMessage} from "../util/Notify.js"
import checkTextSimilarity from "libts/lib/textSimilarity/index.js"
const prisma = new PrismaClient()

export const findAll = async (query, fromRecord, pageSize, sortBy, desc) => {
  let contentsResult

  const fieldSearch = ["link", "textContent", "title"]
  const arrSearch = []
  if (query.search) {
    fieldSearch.forEach((e) => {
      // Bỏ cái này vì nó nặng quá load lâu, search đơn giản thôi
      // arrSearch.push({
      //   [e]: {
      //     search: query?.search.split(' ').join(' & '),
      //   },
      // })
      arrSearch.push({
        [e]: {
          contains: query?.search,
          mode: "insensitive",
        },
      })
    })
  }

  try {
    const whereCondition = {
      ...(query?.search
        ? {
            OR: arrSearch,
          }
        : {}),
      ...(query?.contentIds ? {id: {in: query?.contentIds.split(",")}} : {}),
      ...(query?.tagIds ? {tagIds: {hasSome: query?.tagIds.split(",")}} : {}),
      ...(query?.profileIds ? {profileIds: {hasSome: query?.profileIds.split(",")}} : {}),
      ...(query?.topicIds ? {topicIds: {hasSome: query?.topicIds.split(",")}} : {}),
      ...(query?.authorId ? {authorId: {in: query?.authorId.split(",")}} : {}),
      ...(query?.sourceId ? {sourceId: {in: query?.sourceId.split(",")}} : {}),
      ...(query?.type ? {type: {in: query?.type.split(",")}} : {}),
      ...(query?.fromDate && query?.toDate
        ? {
            postedAt: {
              gte: new Date(query?.fromDate),
              lte: new Date(query?.toDate),
            },
          }
        : {}),
      ...(query?.fromDate && !query?.toDate
        ? {
            postedAt: {
              gte: new Date(query?.fromDate),
            },
          }
        : {}),
      ...(!query?.fromDate && query?.toDate
        ? {
            postedAt: {
              lte: new Date(query?.toDate),
            },
          }
        : {}),
      ...(query?.process ? {process: eval(query?.process)} : {}),
      ...(query?.userHandle ? {userHandle: {in: query?.userHandle.split(",")}} : {}),
    }
    contentsResult = await prisma.$transaction([
      prisma.contents.count({
        where: whereCondition,
      }),
      prisma.contents.findMany({
        where: whereCondition,
        skip: fromRecord,
        take: pageSize,
        orderBy: [{[sortBy]: desc}],
        include: {
          sources: {
            select: {
              id: true,
              name: true,
              link: true,
              avatar: true,
              type: true,
              status: true,
              isQuality: true,
              metaInfo: true,
            },
          },
          authors_authorsTocontents_authorId: {
            select: {
              id: true,
              name: true,
              link: true,
              avatar: true,
            },
          },
        },
      }),
    ])
  } catch (error) {
    console.log("Error when get content from db", error)
  }

  // const contents = await prisma.$queryRaw`
  //     SELECT
  //         c.id,
  //         c."sourceId",
  //         s.name as "sourceName",
  //         s.link as "sourceLink",
  //         s.avatar as "sourceAvatar",
  //         s.type as "sourceType",
  //         s.status as "sourceStatus",
  //         c."authorId",
  //         a.name as "authorName",
  //         a.link as "authorLink",
  //         a.avatar as "authorAvatar",
  //         c."topicIds",
  //         c.link,
  //         c.type,
  //         c."textContent",
  //         c."editedTextContent",
  //         c."tagIds",
  //         c."imageContents",
  //         c."videoContents",
  //         c.likes,
  //         c.shares,
  //         c.comments as "commentCount",
  //         c."totalReactions",
  //         c."reactionsPerHour",
  //         c."commentIds",
  //         c.status,
  //         c."postedAt",
  //         c."process",
  //         c."userHandle",
  //         c."tagIds",
  //         c."profileIds",
  //         c."violationContent",
  //         c."violationEnactment",
  //         c.title,
  //         c."screenShot",
  //         c."meta",
  //         c."renderedContent",
  //         c."createdAt",
  //         c."updatedAt"
  //     FROM SMCC.contents c LEFT JOIN SMCC.authors a ON c."authorId" = a.id LEFT JOIN SMCC.sources s ON c."sourceId" = s.id
  //     ${where}
  //     ORDER BY ${Prisma.raw('c."' + sortBy + '"' + ' ' + desc)}
  //     OFFSET ${fromRecord} LIMIT ${pageSize};
  //   `
  // const total = await prisma.$queryRaw`
  //     SELECT
  //         COUNT(*)
  //     FROM SMCC.contents c
  //     ${where};
  //   `
  if (contentsResult.length > 1 && contentsResult[1].length > 0) {
    const nomContents = []
    for (const content of contentsResult[1]) {
      const normalizeResult = await normalizeContentInfo(content)

      if (normalizeResult) {
        nomContents.push(normalizeResult)
      }
    }
    return {docs: nomContents, total: contentsResult[0]}
  }
  return {docs: [], total: 0}
}

export const findById = async (id) => {
  // const contents = await prisma.$queryRaw`
  //   SELECT
  //       c.id,
  //       c."sourceId",
  //       s.name as "sourceName",
  //       s.link as "sourceLink",
  //       s.avatar as "sourceAvatar",
  //       s.type as "sourceType",
  //       s.status as "sourceStatus",
  //       c."authorId",
  //       a.name as "authorName",
  //       a.link as "authorLink",
  //       a.avatar as "authorAvatar",
  //       c."topicIds",
  //       c.link,
  //       c.type,
  //       c."textContent",
  //       c."editedTextContent",
  //       c."tagIds",
  //       c."imageContents",
  //       c."videoContents",
  //       c.likes,
  //       c.shares,
  //       c.comments as "commentCount",
  //       c."totalReactions",
  //       c."reactionsPerHour",
  //       c."commentIds",
  //       c.status,
  //       c."postedAt",
  //       c."process",
  //       c."userHandle"
  //       c."tagIds",
  //       c."profileIds",
  //       c."violationContent",
  //       c."violationEnactment",
  //       c.title,
  //       c."screenShot",
  //       c.meta,
  //       c."renderedContent",
  //       c."createdAt",
  //       c."updatedAt"
  //   FROM SMCC.contents c LEFT JOIN SMCC.authors a ON c."authorId" = a.id LEFT JOIN SMCC.sources s ON c."sourceId" = s.id
  //   WHERE c.id = ${id};
  // `
  let content
  try {
    content = await prisma.contents.findUnique({
      where: {
        id: id,
      },
      include: {
        sources: {
          select: {
            id: true,
            name: true,
            link: true,
            avatar: true,
            type: true,
            status: true,
          },
        },
        authors_authorsTocontents_authorId: {
          select: {
            id: true,
            name: true,
            link: true,
            avatar: true,
          },
        },
      },
    })
  } catch (error) {
    console.log("Error when get a content from db", error)
  }
  if (content) {
    return normalizeContentInfo(content)
  }
  return null
}

export const findByIds = async (ids) => {
  const contents = await prisma.$queryRaw`
    SELECT *
    FROM SMCC.contents
    WHERE id = ANY(${ids});
  `

  const total = await prisma.$queryRaw`
    SELECT 
      COUNT(*)
    FROM SMCC.contents
    WHERE id = ANY(${ids});
  `

  return contents && contents.length ? {docs: contents, total: total[0].count} : {docs: [], total: 0}
}

export const findTotalSourceHaveNewContent = async () => {
  const totalFacebookSource = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "sourceId") FROM SMCC.contents WHERE type = 'FB_POST' AND DATE("createdAt") = CURRENT_DATE
  `
  const totalWebsiteSource = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "sourceId") FROM SMCC.contents WHERE type = 'WEBSITE_POST' AND DATE("createdAt") = CURRENT_DATE
  `
  return {
    totalFacebookSource: totalFacebookSource[0] ? totalFacebookSource[0].count : 0,
    totalWebsiteSource: totalWebsiteSource[0] ? totalWebsiteSource[0].count : 0,
  }
}
export const getOutstanding = async (type) => {
  const list100 = await prisma.contents.findMany({
    where: {...(type ? {type: type} : {})},

    orderBy: {
      postedAt: "desc",
    },
    take: 100,
  })
  const postPayload = list100.map((e) => ({id: e.id, text: e.textContent}))

  const data = await checkTextSimilarity(postPayload)
  const listId = Object.values(data).map((e) => e[0])
  const result = await prisma.contents.findMany({
    where: {
      id: {in: listId},
    },
    orderBy: {
      postedAt: "desc",
    },
  })
  return result
}
export const update = async (id, teleId, content) => {
  let updated
  try {
    let updatedField = {}
    for (const e in content) {
      updatedField[e] = content[e]
    }
    updatedField.updatedAt = new Date()
    if (id) {
      updated = await prisma.contents.update({
        where: {
          id: id,
        },
        data: updatedField,
      })
      if (content?.userHandle === "skippedPost") {
        try {
          await deleteTelegramMessage(updated.idTeleGroup)
        } catch (error) {}
      } else if (content?.userHandle === "handledPost") {
        try {
          await SourceRepo.update(updated.sourceId, {isCrawl: true})
          if (updated?.authorId) {
            await AuthorRepo.update(updated.authorId, {process: true})
          }
        } catch (error) {}

        try {
          await updateHandledTelegramMessage(updated.idTeleGroup)
        } catch (error) {}
      }
    } else if (teleId) {
      updated = await prisma.contents.update({
        where: {
          idTeleGroup: teleId,
        },
        data: updatedField,
      })
    }
  } catch (error) {
    console.log("Error when update content:", error)
  }

  // const updated = await prisma.$queryRawUnsafe`
  //   UPDATE SMCC.contents
  //   SET "tagIds"             = ${content.tagIds},
  //       "topicIds"           = ${content.topicIds},
  //       "profileIds"         = ${content.profileIds},
  //       "editedTextContent"  = ${content.editedTextContent},
  //       ${content.title?'"title"= :content.title,':''}
  //       "violationContent"   = ${content.violationContent},
  //       "violationEnactment" = ${content.violationEnactment},
  //       "screenShot"         = ${content.screenShot},
  //       "process"         = ${content.process},
  //       meta                 = ${content.meta},
  //       "updatedAt"          = ${content.updatedAt ? new Date(content.updatedAt) : new Date()}
  //   WHERE id                 = ${id}
  //   RETURNING *;
  // `;

  return updated ? [updated] : null
}
export const updateMultil = async (ids, userHandleType) => {
  const contents = await prisma.contents.updateMany({
    where: {
      id: {in: ids},
    },
    data: {
      userHandle: userHandleType,
      ...(userHandleType === "handledPost" && {
        violationEnactment:
          "Vi phạm điểm a, d, e khoản 1, Điều 5 Nghị định 72/2013/NĐ-CP ngày 15/7/2013 của Chính phủ về quản lý, cung cấp, sử dụng dịch vụ Internet và thông tin trên mạng.",
      }),
    },
  })
  if (userHandleType == "skippedPost") {
    await Promise.all(
      contents.map(async (content) => {
        if (content.idTeleGroup) {
          await deleteTelegramMessage(content.idTeleGroup)
        }
      }),
    )
  }

  return contents || []
}
export const remove = async (id) => {
  let deleted
  try {
    deleted = await prisma.contents.delete({
      where: {
        id: id,
      },
    })
  } catch (error) {
    console.log("Error when delete contents", error)
  }
  // const deleted = await prisma.$queryRaw `
  //   DELETE
  //   FROM SMCC."contents"
  //   WHERE id = ${id}
  //   RETURNING *;
  // `;

  return deleted ? [deleted] : null
}

const normalizeContentInfo = async (content) => {
  // Get comments of content
  const comments = await findByContentId(content.id)

  // Get topics info
  const topicsInfo = []
  for (const id of content.topicIds) {
    const topic = await TopicRepo.findById(id)
    if (topic) {
      topicsInfo.push(topic)
    }
  }

  // If this content is not in topic, remove it
  if (!topicsInfo.length) {
    await remove(content.id).catch((err) => console.log("Error delete content"))

    return null
  }

  // Get tags info
  const tagsResult = await TagRepo.findByIds(content.tagIds)

  if (content.tagIds && tagsResult.docs.length != content.tagIds.length) {
    content.tagIds = tagsResult.docs.map((t) => t.id)

    await update(content.id, content)
  }

  // Get profiles info
  const profilesResult = await ProfileRepo.findByIds(content.profileIds)

  if (content.profileIds && profilesResult.docs.length != content.profileIds.length) {
    content.profileIds = profilesResult.docs.map((p) => p.id)

    await update(content.id, content)
  }

  return {
    id: content.id,
    sourceInfo: {
      id: content.sourceId,
      name: content.sources?.name,
      link: content.sources?.link,
      avatar: content.sources?.avatar,
      type: content.sources?.type,
      status: content.sources?.status,
      isQuality: content.sources?.isQuality,
      metaInfo: content.sources?.metaInfo,
    },
    authorInfo: {
      id: content.authorId,
      name: content.authors_authorsTocontents_authorId?.name,
      link: content.authors_authorsTocontents_authorId?.link,
      avatar: content.authors_authorsTocontents_authorId?.avatar,
    },
    topicsInfo: topicsInfo,
    link: content.link,
    type: content.type,
    category: content.category,
    textContent: content.textContent,
    imageContents: content.imageContents,
    videoContents: content.videoContents,
    likes: content.likes,
    shares: content.shares,
    views: content.views,
    commentCount: content.commentCount,
    commentInfos: comments || [],
    totalReactions: content.totalReactions,
    reactionsPerHour: content.reactionsPerHour,
    status: content.status,
    postedAt: content.postedAt,
    process: content.process,
    userHandle: content.userHandle,
    blockRequire: content.blockRequire,
    viettelBlocked: content.viettelBlocked,
    fptBlocked: content.fptBlocked,
    idTeleGroup: content.idTeleGroup,
    vnptBlocked: content.vnptBlocked,
    editedTextContent: content.editedTextContent,
    violationContent: content.violationContent,
    violationEnactment: content.violationEnactment,
    tagsInfo: tagsResult.docs || [],
    profilesInfo: profilesResult.docs || [],
    title: content.title,
    screenShot: content.screenShot,
    meta: content.meta,
    metaInfo: content.metaInfo,
    violationTimes: content.violationTimes,
    renderedContent: content.renderedContent,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  }
}
