"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createAndStartContainer, stopContainer, removeContainer, fixVolumePermissions, writeToVolume } from "@/lib/docker";
import { buildServerProperties } from "@/lib/minecraft-utils";
import { syncProxy } from "@/lib/proxy";
import { allocatePort, isPortAvailable, getUPNPConfig } from "@/lib/port-manager";
import { openFirewallPort, closeFirewallPort } from "@/lib/firewall";
import { openRouterPort, closeRouterPort, getRouterMappings, isPortMappedInList } from "@/lib/upnp";

export async function createGameServer(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const gameSlug = formData.get("gameSlug") as string;
        const customHost = formData.get("customHost") as string || null;
        const ramMb = parseInt(formData.get("ramMb") as string);
        const cpuCores = parseInt(formData.get("cpuCores") as string);
        const autoStart = formData.get("autoStart") === "true";
        const autoRestart = formData.get("autoRestart") === "true";
        const gameConfig = formData.get("gameConfig") as string || "{}";

        // Get game
        const game = await db.game.findUnique({
            where: { slug: gameSlug },
        });

        if (!game) {
            return { error: "Game not found" };
        }

        // Allocate port automatically, preferring the game's default port
        const protocol = gameSlug === 'cs2' ? 'both' : 'tcp';
        const port = await allocatePort(game.defaultPort, protocol as any);

        // Get user from session
        const { verifySession } = await import("@/lib/session");
        const userId = await verifySession();
        if (!userId) {
            return { error: "Não autorizado. Por favor, faça login." };
        }

        const domainId = formData.get("domainId") as string || null;
        const subdomain = formData.get("subdomain") as string || null;

        // Resolve domain name if specified
        if (domainId) {
            const domain = await db.userDomain.findUnique({
                where: { id: domainId }
            });

            if (domain) {
                const fullDomain = subdomain ? `${subdomain}.${domain.name}` : domain.name;
            }
        }

        // Generate unique container name
        const containerName = `gsh-${gameSlug}-${Date.now()}`;

        // Create server
        const server = await db.gameServer.create({
            data: {
                name,
                gameId: game.id,
                userId,
                port,
                customHost: null, // We'll set this if domain is provided
                domainId,
                subdomain,
                ramMb,
                cpuCores,
                containerName,
                gameConfig,
                autoStart,
                autoRestart,
                status: autoStart ? "starting" : "stopped",
            },
        });

        // If we have a domain, update customHost for display
        if (domainId) {
            const domain = await db.userDomain.findUnique({ where: { id: domainId } });
            if (domain) {
                const fullDomain = subdomain ? `${subdomain}.${domain.name}` : domain.name;
                await db.gameServer.update({
                    where: { id: server.id },
                    data: { customHost: fullDomain }
                });
            }
        }

        revalidatePath("/servers");

        // If autoStart is enabled, start the container in background
        if (autoStart) {
            // Don't await - start in background to avoid timeout
            startGameServer(server.id).catch((error) => {
                console.error("Error auto-starting server:", error);
            });
        }

        revalidatePath("/servers");
        return { success: true, serverId: server.id };
    } catch (error) {
        console.error("CRITICAL ERROR in createGameServer:", error);
        return { error: `Erro ao criar servidor: ${error instanceof Error ? error.message : "Erro desconhecido"}` };
    }
}

export async function startGameServer(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
            include: { game: true },
        });

        if (!server) {
            return { error: "Server not found" };
        }

        // Check if the current port is actually available
        let currentPort = server.port;
        const portProtocol = server.game.slug === 'cs2' ? 'both' : 'tcp';
        const isFree = await isPortAvailable(currentPort, portProtocol as any);

        if (!isFree) {
            console.warn(`Port ${currentPort} is occupied. Re-allocating for server ${server.name}...`);
            const newPort = await allocatePort(server.game.defaultPort, portProtocol as any);
            await db.gameServer.update({
                where: { id: serverId },
                data: { port: newPort }
            });
            currentPort = newPort;
            // Update the server object locally
            server.port = newPort;
        }

        if (server.status !== "starting") {
            await db.gameServer.update({
                where: { id: serverId },
                data: { status: "starting" },
            });
        }

        try {
            revalidatePath("/servers");
            revalidatePath(`/servers/${serverId}`);
        } catch (e) {
            // Ignore during render
        }

        // Parse game config
        const config = JSON.parse(server.gameConfig);
        const gameSlug = server.game.slug;

        let env: Record<string, string> = {
            UID: "1000",
            GID: "1000",
        };

        let internalPort = 25565;
        let protocol: 'tcp' | 'udp' | 'both' = 'tcp';
        let dataDir = "/data";

        if (gameSlug === 'minecraft') {
            env = {
                ...env,
                EULA: "TRUE",
                OVERRIDE_SERVER_PROPERTIES: "false",
                MEMORY: `${server.ramMb}M`,
            };
            internalPort = 25565;
            protocol = 'tcp';
            dataDir = "/data";

            // Minecraft specific environment variables
            for (const [key, value] of Object.entries(config)) {
                if (value === undefined || value === null || typeof value === 'object') continue;
                if (key === 'version') {
                    env.VERSION = value.toString();
                    continue;
                }
                const envKey = `CFG_${key.toUpperCase().replace(/-/g, '_')}`;
                env[envKey] = value.toString();
            }

            // Fix permissions and write properties for Minecraft
            await fixVolumePermissions(`${server.containerName}-data`);
            const propertiesContent = buildServerProperties(config);
            await writeToVolume(`${server.containerName}-data`, "server.properties", propertiesContent);

        } else if (gameSlug === 'cs2') {
            const { buildCS2Env } = await import("@/lib/cs2-utils");
            const cs2Env = buildCS2Env(config);
            env = { ...env, ...cs2Env };
            internalPort = 27015;
            protocol = 'both'; // CS2 uses UDP for game and TCP for RCON usually, but image handles it
            dataDir = "/home/steam/cs2-dedicated";
        } else if (gameSlug === 'terraria') {
            const { buildTerrariaEnv } = await import("@/lib/terraria-utils");
            const terrariaEnv = buildTerrariaEnv(config);
            env = { ...env, ...terrariaEnv };
            internalPort = 7777;
            protocol = 'tcp';
            dataDir = "/config";

            // Prepare serverconfig.txt with autocreate settings
            try {
                const { prepareTerrariaVolume } = await import("@/lib/terraria-world-creator");
                await prepareTerrariaVolume(
                    `${server.containerName}-data`,
                    config.worldName,
                    config.worldSize,
                    config.difficulty,
                    config.maxPlayers,
                    config.password,
                    config.worldSeed,
                    config.motd
                );
            } catch (error) {
                console.error('Failed to prepare Terraria serverconfig:', error);
            }
        }

        // Enable TTY for Terraria (required by beardedio/terraria)
        let tty = false;
        if (gameSlug === 'terraria') {
            tty = true;
        }

        // Create and start container
        const containerId = await createAndStartContainer({
            name: server.containerName,
            image: server.game.dockerImage,
            port: currentPort,
            internalPort,
            protocol,
            ramMb: server.ramMb,
            cpuCores: server.cpuCores,
            env,
            dataDir,
            tty,
        });

        // Open port in firewall
        await openFirewallPort(currentPort, protocol);

        // Try to open port on router via UPnP if enabled
        const isUpnpEnabled = await getUPNPConfig();
        if (isUpnpEnabled) {
            const upnpProto = protocol === 'both' ? 'both' : (protocol.toUpperCase() as 'TCP' | 'UDP');
            await openRouterPort(currentPort, upnpProto);
        }

        // Update status to running
        await db.gameServer.update({
            where: { id: serverId },
            data: {
                status: "running",
                containerId,
            },
        });

        try {
            revalidatePath("/servers");
            revalidatePath(`/servers/${serverId}`);
        } catch (e) {
            // Safe to ignore revalidation errors in background
        }

        // Sync proxy for all games (some might be UDP/TCP proxied)
        await syncProxy();

        return { success: true };
    } catch (error) {
        console.error("Error starting server:", error);
        await db.gameServer.update({
            where: { id: serverId },
            data: { status: "error" },
        });

        try {
            revalidatePath("/servers");
            revalidatePath(`/servers/${serverId}`);
        } catch (e) {
            // Safe to ignore revalidation errors in background
        }

        return { error: "Failed to start server: " + (error as Error).message };
    }
}

export async function stopGameServer(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server) {
            return { error: "Server not found" };
        }

        // Update status to stopping
        await db.gameServer.update({
            where: { id: serverId },
            data: { status: "stopping" },
        });

        revalidatePath("/servers");
        revalidatePath(`/servers/${serverId}`);

        const fullServer = await db.gameServer.findUnique({
            where: { id: serverId },
            include: { game: true }
        });

        // Stop Docker container
        if (server.containerId) {
            await stopContainer(server.containerId);
        }

        // Close port in firewall
        const proto = fullServer?.game.slug === 'cs2' ? 'both' : 'tcp';
        await closeFirewallPort(server.port, proto as any);

        // Try to close port on router via UPnP if enabled
        const isUpnpEnabled = await getUPNPConfig();
        if (isUpnpEnabled) {
            const upnpProto = proto === 'both' ? 'both' : (proto.toUpperCase() as 'TCP' | 'UDP');
            await closeRouterPort(server.port, upnpProto);
        }

        // Update status to stopped
        await db.gameServer.update({
            where: { id: serverId },
            data: {
                status: "stopped",
                containerId: null,
            },
        });

        revalidatePath("/servers");
        revalidatePath(`/servers/${serverId}`);

        // Sync proxy
        await syncProxy();

        return { success: true };
    } catch (error) {
        console.error("Error stopping server:", error);
        return { error: "Failed to stop server: " + (error as Error).message };
    }
}

export async function restartGameServer(serverId: string) {
    try {
        await stopGameServer(serverId);
        // Wait a bit for the container to fully stop
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return await startGameServer(serverId);
    } catch (error) {
        console.error("Error restarting server:", error);
        return { error: "Failed to restart server: " + (error as Error).message };
    }
}

export async function deleteGameServer(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server) {
            return { error: "Server not found" };
        }

        // Stop and remove container if exists
        if (server.containerId) {
            try {
                // Determine protocol for firewall
                const fullServer = await db.gameServer.findUnique({
                    where: { id: serverId },
                    include: { game: true }
                });
                const proto = fullServer?.game.slug === 'cs2' ? 'both' : 'tcp';

                await removeContainer(server.containerId);
                await closeFirewallPort(server.port, proto as any);

                // Try to close port on router via UPnP if enabled
                const isUpnpEnabled = await getUPNPConfig();
                if (isUpnpEnabled) {
                    const upnpProto = proto === 'both' ? 'both' : (proto.toUpperCase() as 'TCP' | 'UDP');
                    await closeRouterPort(server.port, upnpProto);
                }
            } catch (error) {
                console.error("Error removing container/firewall rule:", error);
            }
        }

        // Delete server from database
        await db.gameServer.delete({
            where: { id: serverId },
        });

        revalidatePath("/servers");
        return { success: true };
    } catch (error) {
        console.error("Error deleting server:", error);
        return { error: "Failed to delete server" };
    }
}

export async function getGameServers() {
    try {
        const [servers, mappings] = await Promise.all([
            db.gameServer.findMany({
                include: {
                    game: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            getRouterMappings()
        ]);

        return servers.map(s => ({
            ...s,
            isRouterPortOpen: isPortMappedInList(mappings, s.port)
        }));
    } catch (error) {
        console.error("Error fetching servers:", error);
        return [];
    }
}

export async function getGameServer(serverId: string) {
    try {
        const [server, mappings] = await Promise.all([
            db.gameServer.findUnique({
                where: { id: serverId },
                include: {
                    game: true,
                },
            }),
            getRouterMappings()
        ]);

        if (!server) return null;

        return {
            ...server,
            isRouterPortOpen: isPortMappedInList(mappings, server.port)
        };
    } catch (error) {
        console.error("Error fetching server:", error);
        return null;
    }
}

export async function updateGameServerConfig(serverId: string, configUpdates: any) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server) {
            return { error: "Server not found" };
        }

        const currentConfig = JSON.parse(server.gameConfig);
        const updatedConfig = { ...currentConfig, ...configUpdates };

        await db.gameServer.update({
            where: { id: serverId },
            data: {
                gameConfig: JSON.stringify(updatedConfig),
            },
        });

        // If it's a Terraria server, we need to update the serverconfig.txt file
        const game = await db.game.findUnique({
            where: { id: server.gameId },
        });

        if (game?.slug === 'terraria') {
            try {
                const { updateTerrariaConfig } = await import("@/lib/terraria-world-creator");
                await updateTerrariaConfig(`${server.containerName}-data`, updatedConfig);
            } catch (error) {
                console.error('Failed to update Terraria config file:', error);
                // Non-fatal, but user should know
            }
        }

        revalidatePath(`/servers/${serverId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating server config:", error);
        return { error: "Failed to update server config" };
    }
}

export async function executeServerCommand(serverId: string, command: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
            include: { game: true }
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        if (server.game.slug === 'cs2') {
            const config = JSON.parse(server.gameConfig);
            const rconPassword = config.rconPassword || "gsh-rcon-pass";

            const { sendRconCommand } = await import("@/lib/rcon-client");
            // Try to connect to 127.0.0.1 on the host-bound port
            const export_port = server.customHost ? 0 : server.port; // Should check internal port if proxied, but command exec usually happens via host port or internal docker network.
            // RCON usually needs the mapped host port if connecting from node process.
            const output = await sendRconCommand("127.0.0.1", server.port, rconPassword, command);
            return { success: true, output };
        } else {
            // Default Minecraft behavior
            const cmd = ['rcon-cli', command];
            const { execCommandInContainer } = await import("@/lib/docker");
            const output = await execCommandInContainer(server.containerId, cmd);
            return { success: true, output };
        }
    } catch (error) {
        console.error("Error executing command:", error);
        return { error: "Failed to execute command: " + (error as Error).message };
    }
}

export async function getServerStats(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return null;
        }

        const { getContainerStats } = await import("@/lib/docker");
        try {
            const stats = await getContainerStats(server.containerId);
            return stats;
        } catch (dockerError: any) {
            // If container is gone (404), sync DB
            if (dockerError.statusCode === 404) {
                await db.gameServer.update({
                    where: { id: serverId },
                    data: { status: 'stopped', containerId: null }
                });
            }
            return null;
        }
    } catch (error) {
        console.error("Error getting server stats:", error);
        return null;
    }
}

export async function getServerLogs(serverId: string, tail: number = 100) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return "";
        }

        const { getContainerLogs } = await import("@/lib/docker");
        try {
            const logs = await getContainerLogs(server.containerId, tail);
            return logs;
        } catch (dockerError: any) {
            if (dockerError.statusCode === 404) {
                await db.gameServer.update({
                    where: { id: serverId },
                    data: { status: 'stopped', containerId: null }
                });
            }
            return "";
        }
    } catch (error) {
        console.error("Error getting server logs:", error);
        return "";
    }
}
