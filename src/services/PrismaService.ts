import {
  PrismaClient,
  UserChallenge,
  Submission,
  ReviewType,
} from "@prisma/client";
import {
  PrismaClient as PrismaMemberClient,
  memberStats,
} from "@prisma/client-member";
import {
  PrismaClient as PrismaChallengeClient,
  Challenge,
} from "@prisma/client-challenge";
import logger from "../common/logger";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prisma.$on("query", (e) => {
  logger.info(`Query: ${e.query}`);
  logger.info(`Params: ${e.params}`);
  logger.info(`Duration: ${e.duration}ms`);
});

const prismaMember = new PrismaMemberClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prismaMember.$on("query", (e: any) => {
  logger.info(`Query: ${e.query}`);
  logger.info(`Params: ${e.params}`);
  logger.info(`Duration: ${e.duration}ms`);
});

const prismaChallenge = new PrismaChallengeClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prismaChallenge.$on("query", (e: any) => {
  logger.info(`Query: ${e.query}`);
  logger.info(`Params: ${e.params}`);
  logger.info(`Duration: ${e.duration}ms`);
});

/**
 * Finds a challenge by its legacy ID.
 * @param legacyId The legacy challenge ID.
 * @returns The challenge or null if not found.
 */
async function getChallengeByLegacyId(
  legacyId: number,
): Promise<Challenge | null> {
  return prismaChallenge.challenge.findFirst({
    where: {
      legacyId,
    },
    include: {
      legacyRecord: true,
    },
  });
}

/**
 * Ensures a user stat exists in the database. If not, return null
 * @param userId The user's ID.
 * @returns The user stat record.
 */
async function ensureUserStat(userId: number): Promise<memberStats | null> {
  return prismaMember.memberStats.findFirst({
    where: {
      userId,
    },
    include: {
      develop: {
        include: {
          items: true,
        },
      },
      dataScience: {
        include: {
          srm: true,
          marathon: true,
        },
      },
    },
  });
}

/**
 * Creates a registration record for a user in a challenge.
 * @param userId The user's ID.
 * @param challengeId The challenge's internal ID.
 * @param ratedInd The rated indicator for the challenge.
 * @returns The new user-challenge record.
 */
async function createRegistration(
  userId: number,
  challengeId: string,
  ratedInd: number,
): Promise<UserChallenge> {
  return prisma.userChallenge.create({
    data: {
      userId,
      challengeId,
      attended: "N",
      placed: 0,
      rated_ind: ratedInd,
    },
  });
}

/**
 * Creates a submission record.
 * @param data The submission data.
 * @returns The new submission record.
 */
async function createSubmission(data: Submission): Promise<Submission> {
  return prisma.submission.create({ data } as any);
}

/**
 * Gets a submission by its ID.
 * @param submissionId The submission ID (cuid).
 * @returns The submission record or null.
 */
async function getSubmission(submissionId: string): Promise<Submission | null> {
  return prisma.submission.findUnique({ where: { id: submissionId } });
}

/**
 * Updates a user's record for a specific challenge.
 * @param userId The user's ID.
 * @param challengeId The challenge's internal ID.
 * @param data The data to update.
 */
async function updateUserChallenge(
  userId: number,
  challengeId: string,
  data: Partial<UserChallenge>,
): Promise<void> {
  await prisma.userChallenge.update({
    where: {
      userId_challengeId: {
        userId,
        challengeId,
      },
    },
    data,
  });
}

/**
 * Gets all results for a given challenge.
 * @param challengeId The challenge's internal ID.
 * @returns An array of user-challenge records.
 */
async function getChallengeResults(
  challengeId: string,
): Promise<UserChallenge[]> {
  return prisma.userChallenge.findMany({
    where: { challengeId },
  });
}

/**
 * Adds a record to the rating history.
 * @param userId The user's ID.
 * @param challengeId The challenge's internal ID.
 * @param rating The user's rating for this challenge.
 * @param vol The user's volatility for this challenge.
 */
async function addRatingHistory(
  userId: number,
  challengeId: string,
  rating: number,
  vol: number,
): Promise<void> {
  await prisma.ratingHistory.create({
    data: {
      userId,
      challengeId,
      rating,
      vol,
    },
  });
}

/**
 * Gets active review types by name.
 * @param name The name of the review type.
 * @returns An array of review types.
 */
async function getReviewTypes(name: string): Promise<ReviewType[]> {
  return prisma.reviewType.findMany({
    where: { name, isActive: true },
  });
}

// --- FIX: Export the Prisma client instance so it can be used for transactions ---
export { prisma };

export default {
  getChallengeByLegacyId,
  ensureUserStat,
  createRegistration,
  createSubmission,
  getSubmission,
  updateUserChallenge,
  getChallengeResults,
  addRatingHistory,
  getReviewTypes,
};
