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

        // 1. Remove old Velocity if it exists
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

        // 2. Generate and write Gateway config
        console.log('Generating Gateway config...');
        const gatewayConfig = await generateGatewayConfig();
        console.log('Writing Gateway config to volume...');
        await writeToVolume(GATEWAY_VOLUME_NAME, 'nginx.conf', gatewayConfig);

        // 3. Start/Restart Gateway Proxy
        console.log('Starting Gateway Proxy (Nginx)...');
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
