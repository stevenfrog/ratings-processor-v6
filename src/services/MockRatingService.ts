import _ from "lodash";
import prismaService from "./PrismaService";

interface RatingsAndVol {
  rating: number;
  volatility: number;
}

/**
 * Mocks fetching user ratings and volatility.
 * In a real scenario, this would call another service or perform a complex calculation.
 * For this mock, it just returns the user's current rating from the DB.
 * @param userId The user's ID.
 * @param subTrack The challenge subTrack
 */
async function getRatingAndVol(
  userId: number,
  challengeType: string,
): Promise<RatingsAndVol> {
  const userStat: any = await prismaService.ensureUserStat(userId);
  // Return the user's current rating and vol, or defaults
  const defaultRating = 1200;
  const defaultVol = 300;

  let rating = 0;
  let volatility = 0;
  if (challengeType === "MM") {
    rating = _.get(userStat, "dataScience.marathon.rating", defaultRating);
    volatility = _.get(userStat, "dataScience.marathon.volatility", defaultVol);
  } else if (challengeType === "SRM") {
    rating = _.get(userStat, "dataScience.srm.rating", defaultRating);
    volatility = _.get(userStat, "dataScience.srm.volatility", defaultVol);
  } else {
    const developStatItems = _.get(userStat, "develop.items", []);
    const developStat = _.find(
      developStatItems,
      (item) => item.name === "DEVELOPMENT",
    );
    rating = _.get(developStat, "rating", defaultRating);
    volatility = _.get(developStat, "volatility", defaultVol);
  }

  return {
    rating,
    volatility,
  };
}

export default {
  getRatingAndVol,
};
