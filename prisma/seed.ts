import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main () {
  console.log('Start seeding ...')

  // Create a sample challenge
  await prisma.challenge.upsert({
    where: { legacyId: 30054163 },
    update: {},
    create: {
      legacyId: 30054163,
      componentId: 1001,
      ratedInd: 1
    }
  })

  // Create sample users
  await prisma.user.upsert({
    where: { handle: 'testuser1' },
    update: {},
    create: {
      id: 27244033,
      handle: 'testuser1',
      rating: 1500,
      vol: 250
    }
  })

  await prisma.user.upsert({
    where: { handle: 'testuser2' },
    update: {},
    create: {
      id: 27244044,
      handle: 'testuser2',
      rating: 1600,
      vol: 220
    }
  })

  // Create a sample ignored review type
  await prisma.reviewType.upsert({
    where: { id: 'cfdbc0cf-6437-434e-8af1-c56f317f2afd' },
    update: {},
    create: {
      id: 'cfdbc0cf-6437-434e-8af1-c56f317f2afd',
      name: 'AV Scan',
      isActive: true
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
