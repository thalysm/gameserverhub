import { PrismaClient } from '@prisma/client';
import Docker from 'dockerode';

const prisma = new PrismaClient();
const docker = new Docker({
    socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'
});

async function check() {
    const servers = await prisma.gameServer.findMany({
        where: { status: 'running' }
    });

    console.log("Running servers:");
    servers.forEach(s => {
        console.log(`- ${s.name}: Port ${s.port}, Host ${s.customHost}`);
    });

    const containers = await docker.listContainers();
    console.log("\nDocker Containers:");
    containers.forEach(c => {
        console.log(`- ${c.Names[0]} (Image: ${c.Image}, Status: ${c.Status})`);
        console.log(`  Ports: ${JSON.stringify(c.Ports)}`);
    });
}

check();
