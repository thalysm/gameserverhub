import { db } from './lib/db';
import { docker } from './lib/docker';

async function syncDbWithDocker() {
    console.log('Syncing Database with actual Docker state...');

    const servers = await db.gameServer.findMany();
    const containers = await docker.listContainers({ all: true });

    for (const server of servers) {
        const containerExists = containers.some(c =>
            (server.containerId && c.Id.startsWith(server.containerId)) ||
            c.Names.some(n => n === `/${server.containerName}`)
        );

        if (!containerExists && server.status !== 'stopped') {
            console.log(`Server ${server.name} (${server.id}) has no container. Marking as stopped.`);
            await db.gameServer.update({
                where: { id: server.id },
                data: {
                    status: 'stopped',
                    containerId: null
                }
            });
        } else if (containerExists) {
            const container = containers.find(c =>
                (server.containerId && c.Id.startsWith(server.containerId)) ||
                c.Names.some(n => n === `/${server.containerName}`)
            );

            const newStatus = container?.State === 'running' ? 'running' : 'stopped';
            if (server.status !== newStatus || server.containerId !== container?.Id) {
                console.log(`Updating server ${server.name} status to ${newStatus}`);
                await db.gameServer.update({
                    where: { id: server.id },
                    data: {
                        status: newStatus,
                        containerId: container?.Id
                    }
                });
            }
        }
    }

    console.log('Database sync complete.');
}

syncDbWithDocker()
    .catch(console.error)
    .finally(() => db.$disconnect());
