"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createAndStartContainer, stopContainer, removeContainer, fixVolumePermissions, writeToVolume } from "@/lib/docker";
import { buildServerProperties } from "@/lib/minecraft-utils";

export async function createGameServer(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const gameSlug = formData.get("gameSlug") as string;
        const port = parseInt(formData.get("port") as string);
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

        // Get user from session
        const { verifySession } = await import("@/lib/session");
        const userId = await verifySession();
        if (!userId) {
            return { error: "Não autorizado. Por favor, faça login." };
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
                customHost,
                ramMb,
                cpuCores,
                containerName,
                gameConfig,
                autoStart,
                autoRestart,
                status: autoStart ? "starting" : "stopped",
            },
        });

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
        console.error("Error creating game server:", error);
        return { error: "Failed to create server" };
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

        // Initial status update done in createGameServer if auto-starting, 
        // but ensure it's set here for manual starts
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

        const env: Record<string, string> = {
            EULA: "TRUE",
            UID: "1000",
            GID: "1000",
            OVERRIDE_SERVER_PROPERTIES: "false",
        };

        // Dynamically add all config properties as CFG_ variables
        // The itzg/minecraft-server image converts CFG_KEY_NAME to key-name in server.properties
        for (const [key, value] of Object.entries(config)) {
            if (value === undefined || value === null || typeof value === 'object') continue;

            // Special cases for itzg image
            if (key === 'version') {
                env.VERSION = value.toString();
                continue;
            }
            if (key === 'memory' || key === 'ramMb') {
                env.MEMORY = `${server.ramMb}M`;
                continue;
            }
            if (key === 'eula') {
                env.EULA = value.toString().toUpperCase();
                continue;
            }

            // Regular properties: convert key to UPPER_SNAKE_CASE and prefix with CFG_
            // e.g., max-players -> CFG_MAX_PLAYERS
            const envKey = `CFG_${key.toUpperCase().replace(/-/g, '_')}`;
            env[envKey] = value.toString();
        }

        // Ensure MEMORY is set even if not in config
        if (!env.MEMORY) {
            env.MEMORY = `${server.ramMb}M`;
        }

        // Fix permissions before starting
        await fixVolumePermissions(`${server.containerName}-data`);

        // Write server.properties directly to volume to ensure it's saved
        const propertiesContent = buildServerProperties(config);
        await writeToVolume(`${server.containerName}-data`, "server.properties", propertiesContent);

        // Create and start container
        const containerId = await createAndStartContainer({
            name: server.containerName,
            image: server.game.dockerImage,
            port: server.port,
            ramMb: server.ramMb,
            cpuCores: server.cpuCores,
            env,
        });

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
        return { success: true };
    } catch (error) {
        console.error("Error starting server:", error);
        await db.gameServer.update({
            where: { id: serverId },
            data: { status: "error" },
        });

        // Wrap revalidatePath in try-catch to avoid Next.js "during render" errors
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

        // Stop Docker container
        if (server.containerId) {
            await stopContainer(server.containerId);
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
                await removeContainer(server.containerId);
            } catch (error) {
                console.error("Error removing container:", error);
                // Continue with deletion even if container removal fails
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
        const servers = await db.gameServer.findMany({
            include: {
                game: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return servers;
    } catch (error) {
        console.error("Error fetching servers:", error);
        return [];
    }
}

export async function getGameServer(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
            include: {
                game: true,
            },
        });

        return server;
    } catch (error) {
        console.error("Error fetching server:", error);
        return null;
    }
}

export async function executeServerCommand(serverId: string, command: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const { execCommandInContainer } = await import("@/lib/docker");
        const output = await execCommandInContainer(server.containerId, command);

        return { success: true, output };
    } catch (error) {
        console.error("Error executing command:", error);
        return { error: "Failed to execute command" };
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
        const stats = await getContainerStats(server.containerId);

        return stats;
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
        const logs = await getContainerLogs(server.containerId, tail);

        return logs;
    } catch (error) {
        console.error("Error getting server logs:", error);
        return "";
    }
}
