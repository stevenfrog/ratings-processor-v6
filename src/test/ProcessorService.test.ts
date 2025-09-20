/*
 * Unit tests of challenge service
 */

import "../bootstrap";
import { expect } from "chai";

import service from "../services/ProcessorService";
import prismaService, { prisma } from "../services/PrismaService";
import testHelper from "./testHelper";

describe("Processor service unit tests", () => {
  const challenge1LegacyId = 30096740;
  const challenge1Id = "26b08e1e-7c6a-4423-abdc-3a96328a5ecb";
  const pheadUserId = 22742764;
  const submission1Id = "14a1b211-283b-4f9a-809f-71e200646560";

  before(async () => {
    await testHelper.clearData();
  });

  describe("process message tests", () => {
    it("Process a New User Registration successfully", async () => {
      const jsonMessage = {
        topic: "challenge.notification.events",
        originator: "challenge-api",
        timestamp: "2025-06-21T12:00:00.000Z",
        "mime-type": "application/json",
        payload: {
          type: "USER_REGISTRATION",
          data: {
            challengeId: challenge1LegacyId,
            userId: pheadUserId,
            handle: "phead",
          },
        },
      };
      await service.processMessage(jsonMessage);

      await testHelper.delay(200);

      const challengeResults =
        await prismaService.getChallengeResults(challenge1Id);

      expect(challengeResults.length).to.equals(1);
      expect(challengeResults[0].challengeId).to.equals(challenge1Id);
      expect(Number(challengeResults[0].userId)).to.equals(pheadUserId);
    });

    it("Process a Submission Review successfully", async () => {
      const jsonMessage = {
        topic: "submission.notification.aggregate",
        originator: "submission-api",
        timestamp: "2025-06-21T12:05:00.000Z",
        "mime-type": "application/json",
        payload: {
          resource: "review",
          submissionId: submission1Id,
          typeId: "55bbb17d-aac2-45a6-89c3-a8d102863d05",
          score: 90.12,
          originalTopic: "submission.notification.create",
        },
      };
      await service.processMessage(jsonMessage);

      await testHelper.delay(200);

      const submissionResult = await prismaService.getSubmission(submission1Id);

      expect(submissionResult).to.be.exist; //eslint-disable-line @typescript-eslint/no-unused-expressions
      if (submissionResult) {
        expect(submissionResult.challengeId).to.equals(challenge1Id);
        expect(Number(submissionResult.userId)).to.equals(pheadUserId);
        expect(submissionResult.score).to.equals(90.12);
        expect(submissionResult.initialScore).to.equals(90.12);
        expect(submissionResult.submissionNumber).to.equals(1);
        expect(submissionResult.languageId).to.equals(9);
      }
    });

    it("Process a Review Summation successfully", async () => {
      const jsonMessage = {
        topic: "submission.notification.aggregate",
        originator: "submission-api",
        timestamp: "2025-06-21T12:10:00.000Z",
        "mime-type": "application/json",
        payload: {
          resource: "reviewSummation",
          submissionId: submission1Id,
          aggregateScore: 98,
          originalTopic: "submission.notification.create",
        },
      };
      await service.processMessage(jsonMessage);

      await testHelper.delay(200);

      const challengeResults =
        await prismaService.getChallengeResults(challenge1Id);

      expect(challengeResults.length).to.equals(1);
      expect(challengeResults[0].challengeId).to.equals(challenge1Id);
      expect(Number(challengeResults[0].userId)).to.equals(pheadUserId);
      expect(challengeResults[0].system_point_total).to.equals(98);
      expect(challengeResults[0].point_total).to.equals(90.12);
      expect(challengeResults[0].attended).to.equals("Y");
    });

    it("Process a Review End Event successfully", async () => {
      const jsonMessage = {
        topic: "notifications.autopilot.events",
        originator: "challenge-api",
        timestamp: "2025-06-21T12:10:00.000Z",
        "mime-type": "application/json",
        payload: {
          projectId: challenge1LegacyId,
          phaseTypeName: "Review",
          state: "End",
        },
      };
      await service.processMessage(jsonMessage);

      await testHelper.delay(200);

      const challengeResults =
        await prismaService.getChallengeResults(challenge1Id);

      expect(challengeResults.length).to.equals(1);
      expect(challengeResults[0].challengeId).to.equals(challenge1Id);
      expect(Number(challengeResults[0].userId)).to.equals(pheadUserId);
      expect(challengeResults[0].system_point_total).to.equals(98);
      expect(challengeResults[0].point_total).to.equals(90.12);
      expect(challengeResults[0].attended).to.equals("Y");
      expect(challengeResults[0].placed).to.equals(1);
      expect(challengeResults[0].old_rating).to.equals(961);
      expect(challengeResults[0].old_vol).to.equals(393);

      const ratingHistories = await prisma.ratingHistory.findMany({
        where: {
          challengeId: challenge1Id,
          userId: pheadUserId,
        },
      });

      expect(ratingHistories.length).to.equals(1);
      expect(challengeResults[0].challengeId).to.equals(challenge1Id);
      expect(Number(challengeResults[0].userId)).to.equals(pheadUserId);
      expect(ratingHistories[0].rating).to.equals(961);
      expect(ratingHistories[0].vol).to.equals(393);
    });
  });
});
