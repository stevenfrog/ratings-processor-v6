import _ from 'lodash'
import config from 'config'
import momentTZ from 'moment-timezone'
import axios from 'axios'
import { z } from 'zod'
import logger from '../common/logger'
import helper from '../common/helper'
import * as constants from '../constants'
import { Prisma } from '@prisma/client'
import PrismaService, { prisma } from './PrismaService'
import MockRatingService from './MockRatingService'
import {
  UserRegistrationPayload,
  ReviewPayload,
  ReviewSummationPayload,
  AutopilotReviewEndPayload,
  UserRegistrationEventSchema,
  ReviewEventSchema,
  ReviewSummationEventSchema,
  AutopilotReviewEndEventSchema
} from '../common/schemas'

const timeZone = 'America/New_York'

const apiClient = axios.create({
  baseURL: config.get('SUBMISSION_API_URL'),
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.get('M2M_TOKEN')}`
  },
  timeout: 30000
})

async function getSubmission (submissionId: string): Promise<any> {
  try {
    const response = await apiClient.get(`/submissions/${submissionId}`)
    return response.data
  } catch (error: any) {
    logger.error(`Failed to get submission ${submissionId}: ${error.message}`)
    if (error.response) {
      logger.error(`Response Data: ${JSON.stringify(error.response.data)}`)
    }
    throw error
  }
}

async function processRegistration (payload: UserRegistrationPayload): Promise<void> {
  logger.info('Process Marathon Match registration event.')
  const { challengeId, userId } = payload.data

  const challenge = await PrismaService.getChallengeByLegacyId(challengeId)
  if (!challenge) {
    logger.info(`Marathon Match with legacy ID: ${challengeId} not found, ignoring event.`)
    return
  }

  try {
    // This will now fail if the user doesn't exist, which is the desired behavior.
    await PrismaService.createRegistration(userId, challenge.id, challenge.ratedInd ?? 0)
    logger.info(`Completed processing registration for user ${userId} to challenge ${challengeId}.`)
  } catch (error: any) {
    // This catch block will handle potential foreign key constraint errors if the user does not exist in the User table.
    logger.error(`Failed to create registration for user ${userId} in challenge ${challengeId}. The user may not exist or another error occurred.`)
    logger.error(error.message)
  }
}

async function processReview (payload: ReviewPayload): Promise<void> {
  logger.info('Process Marathon Match review event.')

  const ignoredIds = helper.getIgnoredReviewTypeIds()
  if (_.includes(ignoredIds, payload.typeId)) {
    logger.info(`Review with typeId ${payload.typeId} is ignored.`)
    return
  }

  const submission = await getSubmission(payload.submissionId)
  const { challengeId, memberId: userId } = submission
  const submitTime = new Date(momentTZ.tz(submission.created, timeZone).format())

  const challenge = await PrismaService.getChallengeByLegacyId(challengeId)
  if (!challenge) {
    logger.info(`Marathon Match with legacy ID: ${challengeId} not found, ignoring event.`)
    return
  }

  await PrismaService.createSubmission({
    id: payload.submissionId,
    challengeId: challenge.id,
    userId,
    score: payload.score,
    initialScore: payload.score,
    submissionTime: submitTime,
    submissionNumber: 1,
    example: 0,
    openTime: new Date(),
    languageId: 9
  })
  logger.info(`Completed processing review for submission ${payload.submissionId}.`)
}

async function processReviewSummation (payload: ReviewSummationPayload): Promise<void> {
  logger.info('Process Marathon Match review summation event.')
  const submission = await getSubmission(payload.submissionId)
  const { challengeId, memberId: userId } = submission

  const challenge = await PrismaService.getChallengeByLegacyId(challengeId)
  if (!challenge) {
    logger.info(`Marathon Match with legacy ID: ${challengeId} not found, ignoring event.`)
    return
  }

  const dbSubmission = await PrismaService.getSubmission(payload.submissionId)

  await PrismaService.updateUserChallenge(userId, challenge.id, {
    system_point_total: payload.aggregateScore,
    point_total: dbSubmission?.initialScore,
    attended: 'Y'
  })
  logger.info(`Completed processing review summation for submission ${payload.submissionId}.`)
}

async function processReviewEnd (payload: AutopilotReviewEndPayload): Promise<void> {
  if (payload.phaseTypeName !== 'Review' || payload.state !== 'End') {
    logger.info(`Ignoring event for project ${payload.projectId}, not a Review End event.`)
    return
  }

  logger.info(`Processing Review End event for project ${payload.projectId}`)
  const challenge = await PrismaService.getChallengeByLegacyId(payload.projectId)
  if (!challenge) {
    logger.info(`Marathon Match with legacy ID: ${payload.projectId} not found, ignoring event.`)
    return
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const results = await tx.userChallenge.findMany({
        where: { challengeId: challenge.id }
      })

      if (results.length === 0) {
        logger.info(`No results found for challenge ${challenge.id}, skipping rating updates.`)
        return
      }

      results.sort((a, b) => (b.system_point_total ?? 0) - (a.system_point_total ?? 0))

      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const placement = i > 0 && result.system_point_total === results[i - 1].system_point_total
          ? results[i - 1].placed
          : i + 1

        const { rating, vol } = await MockRatingService.getRatingAndVol(result.userId)

        await tx.userChallenge.update({
          where: {
            userId_challengeId: {
              userId: result.userId,
              challengeId: result.challengeId
            }
          },
          data: {
            placed: placement,
            old_rating: rating,
            old_vol: vol
          }
        })

        await tx.ratingHistory.create({
          data: {
            userId: result.userId,
            challengeId: challenge.id,
            rating,
            vol
          }
        })
      }
    })
    logger.info(`Completed processing Review End event for project ${payload.projectId}.`)
  } catch (error: any) {
    logger.error(`Transaction failed during Review End processing for project ${payload.projectId}: ${error.message}`)
  }
}

/**
 * Process the Kafka message by routing it to the correct handler.
 * @param parsedMessage the already parsed kafka message object
 */
async function processMessage (parsedMessage: any): Promise<void> {
  const topic = parsedMessage.topic as string
  const payload = parsedMessage.payload

  try {
    if (topic === config.get('CHALLENGE_NOTIFICATION_EVENTS_TOPIC')) {
      UserRegistrationEventSchema.parse(parsedMessage)
      if (payload.type === 'USER_REGISTRATION') {
        await processRegistration(payload)
      } else {
        logger.info('Ignoring event, not a USER_REGISTRATION type.')
      }
    } else if (topic === config.get('SUBMISSION_NOTIFICATION_AGGREGATE_TOPIC')) {
      if (payload.resource === constants.resources.review) {
        ReviewEventSchema.parse(parsedMessage)
        await processReview(payload)
      } else if (payload.resource === constants.resources.reviewSummation) {
        ReviewSummationEventSchema.parse(parsedMessage)
        await processReviewSummation(payload)
      } else {
        logger.info("Ignoring event, resource doesn't match review or reviewSummation.")
      }
    } else if (topic === config.get('NOTIFICATION_AUTOPILOT_EVENTS_TOPIC')) {
      AutopilotReviewEndEventSchema.parse(parsedMessage)
      await processReviewEnd(payload)
    } else {
      logger.info(`Ignoring event from unknown topic: ${topic}`)
    }
  } catch (error) {
     if (error instanceof z.ZodError) {
      logger.error(`Validation failed for message on topic ${topic}: ${JSON.stringify(error.errors)}`)
    } else if (error instanceof Error) {
      logger.error(`An unexpected error occurred during processing: ${error.message}`)
    } else {
      logger.error('An unexpected and unknown error occurred during processing.')
    }
  }
}

export default {
  processMessage
}
