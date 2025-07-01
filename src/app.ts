import './bootstrap'
import config from 'config'
import Kafka from 'no-kafka'
const healthcheck = require('topcoder-healthcheck-dropin')
import logger from './common/logger'
import helper from './common/helper'
import ProcessorService from './services/ProcessorService'

// Start kafka consumer
logger.info('Starting kafka consumer')

// create consumer
const consumer = new Kafka.GroupConsumer(helper.getKafkaOptions())

/*
 * Data handler linked with Kafka consumer
 * Whenever a new message is received, this function will be invoked
 */
const dataHandler = async (messageSet: any[], topic: string, partition: number): Promise<void> => {
  for (const m of messageSet) {
    try {
      const messageValue = m.message.value ? m.message.value.toString('utf8') : null
      logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${m.offset}; Message: ${messageValue}.`)

      if (!messageValue) {
        logger.error('Received a message with no value.')
        await consumer.commitOffset({ topic, partition, offset: m.offset })
        continue
      }

      const messageJSON = JSON.parse(messageValue)

      // Pass the fully parsed JSON object to the processor service
      await ProcessorService.processMessage(messageJSON)
      logger.debug('Successfully processed message')
    } catch (err: any) {
      logger.error('Error processing message wrapper')
      logger.error(err)
    } finally {
      // commit offset regardless of error
      await consumer.commitOffset({ topic, partition, offset: m.offset })
    }
  }
}

// check if there is kafka connection alive
const check = (): boolean => {
  // The 'client' property is not publicly typed, so we cast to 'any' to access it for the health check.
  const consumerClient = (consumer as any).client
  if (!consumerClient.initialBrokers || !consumerClient.initialBrokers.length) {
    return false
  }
  let connected = true
  consumerClient.initialBrokers.forEach((conn: any) => {
    logger.debug(`url ${conn.server()} - connected=${conn.connected}`)
    connected = conn.connected && connected
  })
  return connected
}

const topics = [
  config.get('CHALLENGE_NOTIFICATION_EVENTS_TOPIC') as string,
  config.get('SUBMISSION_NOTIFICATION_AGGREGATE_TOPIC') as string,
  config.get('NOTIFICATION_AUTOPILOT_EVENTS_TOPIC') as string
]

async function start () {
  await consumer.init([{
    subscriptions: topics,
    handler: dataHandler
  }])

  // fetch ignored review types
  await helper.fetchIgnoredReviewTypes()

  logger.info('Initialized.......')
  healthcheck.init([check])
  logger.info(`Adding topics successfully: ${topics.join(', ')}`)
  logger.info('Kick Start.......')
}

start().catch((err) => logger.error(err))
