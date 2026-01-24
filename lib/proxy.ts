import { docker, writeToVolume, createAndStartContainer } from './docker';
import { db } from './db';

const GATEWAY_CONTAINER_NAME = 'gsh-gateway';
const GATEWAY_VOLUME_NAME = 'gsh-gateway-data';

export async function generateGatewayConfig() {
    // Find Minecraft servers for TCP proxying
    const minecraftServers = await db.gameServer.findMany({
        where: {
            game: { slug: 'minecraft' },
            status: 'running',
            customHost: { not: null }
        }
    });

    // Find CS2 servers (usually only one active primary if sharing same port)
    const cs2Servers = await db.gameServer.findMany({
        where: {
            game: { slug: 'cs2' },
            status: 'running',
            customHost: { not: null }
        }
    });

    let config = `
user nginx;
worker_processes auto;

events {
    worker_connections 1024;
}

stream {
    # Minecraft Proxy (TCP 25565)
    ${minecraftServers.length > 0 ? `
    upstream minecraft_tcp {
        server ${minecraftServers[0].containerName}:25565;
    }
    server {
        listen 25565;
        proxy_pass minecraft_tcp;
    }
    ` : ''}

    # CS2 Proxy (UDP 27015)
    ${cs2Servers.length > 0 ? `
    upstream cs2_udp {
        server ${cs2Servers[0].containerName}:27015;
    }
    server {
        listen 27015 udp;
        proxy_pass cs2_udp;
    }

    # CS2 RCON/TCP (TCP 27015)
    upstream cs2_tcp {
        server ${cs2Servers[0].containerName}:27015;
    }
    server {
        listen 27015;
        proxy_pass cs2_tcp;
    }
    ` : ''}
}
`;

    return config;
}

export async function syncProxy() {
    try {
        console.log('Syncing Universal Proxy Gateway...');

        // 1. Check if we actually NEED the proxy
        const activeProxiedServers = await db.gameServer.count({
            where: {
                status: 'running',
                customHost: { not: null }
            }
        });

        const gatewayContainer = (await docker.listContainers({ all: true })).find(c =>
            c.Names.some(n => n === `/${GATEWAY_CONTAINER_NAME}`)
        );

        if (activeProxiedServers === 0) {
            console.log('No active servers require proxying. Ensuring Gateway is stopped...');
            if (gatewayContainer) {
                const container = docker.getContainer(gatewayContainer.Id);
                if (gatewayContainer.State === 'running') {
                    await container.stop();
                }
                await container.remove();
                console.log('Gateway Proxy stopped and removed.');
            }
            return;
        }

        // 2. Remove old Velocity if it exists (Cleanup legacy)
        try {
            const containers = await docker.listContainers({ all: true });
            const velocity = containers.find(c => c.Names.some(n => n === '/gsh-velocity'));
            if (velocity) {
                console.log('Removing legacy Velocity container...');
                const container = docker.getContainer(velocity.Id);
                if (velocity.State === 'running') await container.stop();
                await container.remove();
            }
        } catch (e) { }

        // 3. Generate and write Gateway config
        console.log('Generating Gateway config...');
        const gatewayConfig = await generateGatewayConfig();
        console.log('Writing Gateway config to volume...');
        await writeToVolume(GATEWAY_VOLUME_NAME, 'nginx.conf', gatewayConfig);

        // 4. Start/Restart Gateway Proxy
        console.log('Starting Gateway Proxy (Nginx)...');
        // If container exists but config changed, createAndStartContainer handles recreation logic mostly,
        // but we can trust it to restart/recreate if needed.
        await createAndStartContainer({
            name: GATEWAY_CONTAINER_NAME,
            image: 'nginx:alpine',
            port: 25565,
            internalPort: 25565,
            protocol: 'tcp', // Minecraft primary
            extraPorts: [
                { port: 27015, internalPort: 27015, protocol: 'both' } // CS2 both TCP/UDP
            ],
            ramMb: 256,
            cpuCores: 0.5,
            env: {},
            dataDir: '/etc/nginx'
        });

        console.log('Universal Proxy sync complete.');
    } catch (error) {
        console.error('Failed to sync proxy:', error);
    }
}
