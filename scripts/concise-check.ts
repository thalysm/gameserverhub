import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function run() {
    const s = await db.gameServer.findMany({ select: { name: true, port: true, customHost: true, status: true } });
    console.log(s);
}
run();
