import { db } from "@/lib/db";
import net from "net";
import { exec } from "child_process";
import { promisify } from "util";

import { openRouterPort, closeRouterPort, getRouterMappings, isPortMappedInList } from "@/lib/upnp";

const execAsync = promisify(exec);

const DEFAULT_START_PORT = 20000;
const DEFAULT_END_PORT = 30000;

export async function isPortAvailable(port: number, protocol: 'tcp' | 'udp' | 'both' = 'tcp'): Promise<boolean> {
    // 1. Check with netstat on Windows (more robust for some edge cases like wslrelay)
    if (process.platform === 'win32') {
        try {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`).catch(() => ({ stdout: '' }));
            if (stdout && (stdout.includes('LISTENING') || stdout.includes('ESTABLISHED'))) {
                // Check if it's an exact match for the port (findstr might catch :255655)
                const lines = stdout.split('\n');
                // Match :PORT followed by word boundary (space or end of string)
                const portPattern = new RegExp(`[: ]${port}\\b`);
                if (lines.some(line => portPattern.test(line))) {
                    return false;
                }
            }
        } catch (e) {
            // Ignore netstat errors and fall back to net check
        }
    }

    const checkTcp = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(false));
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen({ port, host: '0.0.0.0', exclusive: true });
        });
    };

    const checkUdp = async (): Promise<boolean> => {
        return new Promise((resolve) => {
            const dgram = require('dgram');
            const socket = dgram.createSocket('udp4');
            socket.once('error', () => resolve(false));
            socket.once('listening', () => {
                socket.close();
                resolve(true);
            });
            socket.bind(port, '0.0.0.0');
        });
    };

    if (protocol === 'tcp') return await checkTcp();
    if (protocol === 'udp') return await checkUdp();
    return (await checkTcp()) && (await checkUdp());
}

export async function allocatePort(preferredPort?: number, protocol: 'tcp' | 'udp' | 'both' = 'tcp'): Promise<number> {

    // Get all used ports
    const usedPorts = await db.gameServer.findMany({
        select: { port: true }
    });
    const usedPortSet = new Set(usedPorts.map(s => s.port));

    // 1. Try preferred port (usually the game's default port)
    if (preferredPort) {
        const inDb = usedPortSet.has(preferredPort);
        const physicalFree = await isPortAvailable(preferredPort, protocol);

        if (!inDb && physicalFree) {
            return preferredPort;
        }
    }

    // 2. Fallback to pool allocation
    // Get port range from settings or use defaults
    const startSetting = await (db as any).systemSetting.findUnique({ where: { key: "PORT_POOL_START" } });
    const endSetting = await (db as any).systemSetting.findUnique({ where: { key: "PORT_POOL_END" } });

    const startPort = startSetting ? parseInt(startSetting.value) : DEFAULT_START_PORT;
    const endPort = endSetting ? parseInt(endSetting.value) : DEFAULT_END_PORT;

    // Find first available port in pool
    for (let port = startPort; port <= endPort; port++) {
        if (!usedPortSet.has(port)) {
            const physicalFree = await isPortAvailable(port, protocol);
            if (physicalFree) {
                return port;
            }
        }
    }

    console.error("No available ports found in the pool!");
    throw new Error("No available ports in the pool");
}

export async function getPortPoolConfig() {
    const startSetting = await (db as any).systemSetting.findUnique({ where: { key: "PORT_POOL_START" } });
    const endSetting = await (db as any).systemSetting.findUnique({ where: { key: "PORT_POOL_END" } });

    return {
        start: startSetting ? parseInt(startSetting.value) : DEFAULT_START_PORT,
        end: endSetting ? parseInt(endSetting.value) : DEFAULT_END_PORT,
    };
}

export async function updatePortPoolConfig(start: number, end: number) {
    await (db as any).systemSetting.upsert({
        where: { key: "PORT_POOL_START" },
        update: { value: start.toString() },
        create: { key: "PORT_POOL_START", value: start.toString() }
    });

    await (db as any).systemSetting.upsert({
        where: { key: "PORT_POOL_END" },
        update: { value: end.toString() },
        create: { key: "PORT_POOL_END", value: end.toString() }
    });
}

export async function getUPNPConfig() {
    const setting = await (db as any).systemSetting.findUnique({ where: { key: "AUTO_UPNP" } });
    return setting ? setting.value === "true" : true; // Default to true
}

export async function getUsedPorts() {
    const [servers, mappings] = await Promise.all([
        db.gameServer.findMany({
            select: {
                id: true,
                port: true,
                name: true,
                game: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                port: "asc"
            }
        }),
        getRouterMappings()
    ]);

    return servers.map(s => {
        const isMapped = isPortMappedInList(mappings, s.port);
        return {
            id: s.id,
            port: s.port,
            serverName: s.name,
            gameName: s.game.name,
            gameSlug: s.game.slug,
            isRouterPortOpen: isMapped
        };
    });
}
