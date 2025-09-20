import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main () {
  console.log('Start seeding ...')

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
