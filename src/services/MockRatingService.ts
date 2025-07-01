import PrismaService from './PrismaService'

interface RatingsAndVol {
  rating: number;
  vol: number;
}

/**
 * Mocks fetching user ratings and volatility.
 * In a real scenario, this would call another service or perform a complex calculation.
 * For this mock, it just returns the user's current rating from the DB.
 * @param userId The user's ID.
 */
async function getRatingAndVol (userId: number): Promise<RatingsAndVol> {
  const user = await PrismaService.ensureUser(userId, `user${userId}`)
  // Return the user's current rating and vol, or defaults
  return {
    rating: user.rating ?? 1200,
    vol: user.vol ?? 300
  }
}

export default {
  getRatingAndVol
}
