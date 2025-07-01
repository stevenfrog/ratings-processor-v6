/**
 * Contains generic helper methods
 */
import _ from 'lodash'
import config from 'config'
import PrismaService from '../services/PrismaService'

// Cache for ignored review type IDs
const ignoredReviewTypeIds: string[] = []

/**
 * Get Kafka options
 * @returns {object} the Kafka options
 */
function getKafkaOptions (): any {
  const options: any = {
    connectionString: config.get('KAFKA_URL'),
    groupId: config.get('KAFKA_GROUP_ID')
  }
  if (config.has('KAFKA_CLIENT_CERT') && config.get('KAFKA_CLIENT_CERT_KEY')) {
    options.ssl = {
      cert: config.get('KAFKA_CLIENT_CERT'),
      key: config.get('KAFKA_CLIENT_CERT_KEY')
    }
  }
  return options
}

/**
 * Get ignored review type ids from cache
 * @returns {string[]} the ignored review type ids
 */
function getIgnoredReviewTypeIds (): string[] {
  return ignoredReviewTypeIds
}

/**
 * Fetch ignored review types from the database and populate the cache.
 */
async function fetchIgnoredReviewTypes (): Promise<void> {
  const names: string[] = JSON.parse(config.get('IGNORED_REVIEW_TYPES'))
  for (const name of names) {
    const reviewTypes = await PrismaService.getReviewTypes(name)
    if (reviewTypes.length > 0) {
      ignoredReviewTypeIds.push(...reviewTypes.map(rt => rt.id))
    }
  }
}

export default {
  getKafkaOptions,
  getIgnoredReviewTypeIds,
  fetchIgnoredReviewTypes
}
