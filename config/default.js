/**
 * The default configuration file.
 */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'legacy-rating-processor',
  // Kafka SSL options
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,

  // Kafka topics to be listened
  CHALLENGE_NOTIFICATION_EVENTS_TOPIC: process.env.CHALLENGE_NOTIFICATION_EVENTS_TOPIC || 'challenge.notification.events',
  SUBMISSION_NOTIFICATION_AGGREGATE_TOPIC: process.env.SUBMISSION_NOTIFICATION_AGGREGATE_TOPIC || 'submission.notification.aggregate',
  NOTIFICATION_AUTOPILOT_EVENTS_TOPIC: process.env.NOTIFICATION_AUTOPILOT_EVENTS_TOPIC || 'notifications.autopilot.events',

  // submission notification create topic
  SUBMISSION_NOTIFICATION_CREATE_TOPIC: process.env.SUBMISSION_NOTIFICATION_CREATE_TOPIC || 'submission.notification.create',

  IGNORED_REVIEW_TYPES: process.env.IGNORED_REVIEW_TYPES || '["AV Scan"]',

  // The M2M token for API calls
  M2M_TOKEN: process.env.M2M_TOKEN,

  // The Submission API URL - Updated to the real Topcoder dev endpoint
  SUBMISSION_API_URL: process.env.SUBMISSION_API_URL || 'https://api.topcoder-dev.com/v5',

  // Health check port
  PORT: process.env.PORT || 3000
}
