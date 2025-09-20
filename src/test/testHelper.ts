import { prisma } from "../services/PrismaService";

/**
 * Clear DB data
 */
async function clearData() {
  await prisma.reviewType.deleteMany();
  await prisma.ratingHistory.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.userChallenge.deleteMany();
}

/**
 * Wait for some time
 */
async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  clearData,
  delay,
};
