const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      bookingRef: null
    }
  });

  console.log(`Found ${bookings.length} bookings without a ref. Updating...`);

  let count = 0;
  for (const booking of bookings) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { bookingRef: `#BK-${randomNum}` }
    });
    count++;
  }

  console.log(`Successfully updated ${count} bookings!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
