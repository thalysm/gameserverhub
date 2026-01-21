import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const servers = await prisma.gameServer.findMany()
    console.log(JSON.stringify(servers.map(s => ({ name: s.name, containerName: s.containerName })), null, 2))
}
main()
