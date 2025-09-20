import { z } from "zod";
import config from "config";
import * as constants from "../constants";

// Base schema for the payload of all Kafka messages
const KafkaPayloadSchema = z.object({
  topic: z.string(),
  originator: z.string(),
  timestamp: z.string().datetime(),
  "mime-type": z.literal("application/json"),
});

// Schema and type for User Registration
export const UserRegistrationPayloadSchema = z.object({
  type: z.literal("USER_REGISTRATION"),
  data: z.object({
    challengeId: z.number().int(),
    userId: z.number().int(),
    handle: z.string(),
  }),
});
export const UserRegistrationEventSchema = KafkaPayloadSchema.extend({
  payload: UserRegistrationPayloadSchema,
});
export type UserRegistrationPayload = z.infer<
  typeof UserRegistrationPayloadSchema
>;

// Schema and type for Submission Review
export const ReviewPayloadSchema = z.object({
  resource: z.literal(constants.resources.review),
  submissionId: z.string().uuid(),
  typeId: z.string().uuid(),
  score: z.number(),
  originalTopic: z.literal(config.get("SUBMISSION_NOTIFICATION_CREATE_TOPIC")),
});
export const ReviewEventSchema = KafkaPayloadSchema.extend({
  payload: ReviewPayloadSchema,
});
export type ReviewPayload = z.infer<typeof ReviewPayloadSchema>;

// Schema and type for Review Summation
export const ReviewSummationPayloadSchema = z.object({
  resource: z.literal(constants.resources.reviewSummation),
  submissionId: z.string().uuid(),
  aggregateScore: z.number(),
  originalTopic: z.literal(config.get("SUBMISSION_NOTIFICATION_CREATE_TOPIC")),
});
export const ReviewSummationEventSchema = KafkaPayloadSchema.extend({
  payload: ReviewSummationPayloadSchema,
});
export type ReviewSummationPayload = z.infer<
  typeof ReviewSummationPayloadSchema
>;

// Schema and type for Autopilot Review End
export const AutopilotReviewEndPayloadSchema = z.object({
  projectId: z.number().int(),
  phaseTypeName: z.literal("Review"),
  state: z.literal("End"),
});
export const AutopilotReviewEndEventSchema = KafkaPayloadSchema.extend({
  payload: AutopilotReviewEndPayloadSchema,
});
export type AutopilotReviewEndPayload = z.infer<
  typeof AutopilotReviewEndPayloadSchema
>;
