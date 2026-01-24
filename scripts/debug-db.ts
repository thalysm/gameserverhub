import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const servers = await prisma.gameServer.findMany({
        include: { game: true }
    });
    console.log(JSON.stringify(servers, null, 2));
}

main();
