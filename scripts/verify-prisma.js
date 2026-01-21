const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking if favorite model exists...");
    if (prisma.favorite) {
        console.log("SUCCESS: Favorite model found in Prisma Client");
    } else {
        console.log("FAILURE: Favorite model NOT found in Prisma Client");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
