/*
  Warnings:

  - The primary key for the `user_challenges` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `challenges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rating_history" DROP CONSTRAINT "rating_history_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "rating_history" DROP CONSTRAINT "rating_history_userId_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_challenges" DROP CONSTRAINT "user_challenges_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "user_challenges" DROP CONSTRAINT "user_challenges_userId_fkey";

-- AlterTable
ALTER TABLE "rating_history" ALTER COLUMN "userId" SET DATA TYPE BIGINT,
ALTER COLUMN "challengeId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "submissions" ALTER COLUMN "challengeId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "user_challenges" DROP CONSTRAINT "user_challenges_pkey",
ALTER COLUMN "userId" SET DATA TYPE BIGINT,
ALTER COLUMN "challengeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("userId", "challengeId");

-- DropTable
DROP TABLE "challenges";

-- DropTable
DROP TABLE "users";
