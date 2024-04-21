import {fbAccounts, STATUS, sources, SOURCE_TYPE, PrismaClient} from '@prisma/client'
import {getGroupMembershipQuestions, getJoinGroupState, setJoinGroupAnswers, setRequestJoinGroup} from '../request'
import {BrowserConfig, MembershipQuestion} from '../request/types'

export const joinGroup = async (
  browserConfig: BrowserConfig,
  prisma: PrismaClient,
  account: fbAccounts,
  source: sources,
) => {
  if (source.type == SOURCE_TYPE.FB_GROUP) {
    const {joinStatus, ...groupInfo} = await getJoinGroupState(browserConfig, source.id)
    console.log('Join status: ', joinStatus, groupInfo)
    if (joinStatus == 'NOT_JOIN') {
      await setRequestJoinGroup(browserConfig, account, source.id)
    }
    if (joinStatus && joinStatus != 'JOINED') {
      const {name, avatar, questionsToJoin} = await getGroupMembershipQuestions(browserConfig, source.id)
      source.name = name
      source.avatar = avatar
      if (questionsToJoin && questionsToJoin.length) {
        if (source.questionsToJoin && source.questionsToJoin.length) {
          const answers = []
          for (let i = 0; i < source.questionsToJoin.length; i++) {
            const sourceQuestion = source.questionsToJoin[i] as MembershipQuestion
            const question = questionsToJoin[i] as MembershipQuestion
            if (
              (sourceQuestion.answer || sourceQuestion.selected_options?.length) &&
              sourceQuestion.question == question.question &&
              (sourceQuestion.question_type == 'PARAGRAPH' ||
                sourceQuestion.selected_options.every((o) => question.question_options.map((q) => q.id).includes(o)))
            ) {
              answers.push({
                question_id: question.id,
                answer: question.answer,
                selected_options: question.selected_options,
              })
            } else {
              source.questionsToJoin[i] = question
            }
          }
          if (answers.length == questionsToJoin.length) {
            await setJoinGroupAnswers(browserConfig, account, source.id, answers)
          } else {
            await prisma.sources.update({
              where: {
                id: source.id,
              },
              data: {
                questionsToJoin: source.questionsToJoin,
              },
            })
          }
        }
      }
    }
    await prisma.sources.update({
      where: {
        id: source.id,
      },
      data: {
        ...groupInfo,
      },
    })
  }
}
