"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
    listContainerFiles,
    uploadFileToContainer,
    downloadFileFromContainer,
    deleteFileFromContainer,
    createContainerBackup,
    extractContainerArchive
} from "@/lib/docker-files";
import { restartGameServer } from "./server-actions";
import { buildServerProperties } from "@/lib/minecraft-utils";

export async function updateServerConfig(serverId: string, config: any) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server) {
            return { error: "Server not found" };
        }

        // Update game config in database
        await db.gameServer.update({
            where: { id: serverId },
            data: {
                gameConfig: JSON.stringify(config),
            },
        });

        // If server is running, restart to apply changes
        if (server.containerId && server.status === "running") {
            try {
                console.log("Settings updated in database. Restarting server to apply changes via environment...");
                // Restart server to apply changes
                await restartGameServer(serverId);
            } catch (error) {
                console.error("Error restarting server:", error);
            }
        }

        revalidatePath(`/servers/${serverId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating server config:", error);
        return { error: "Failed to update configuration" };
    }
}

export async function getServerProperties(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            // If server is not running, we might want to return the config from DB
            return { config: server ? JSON.parse(server.gameConfig) : {} };
        }

        try {
            const buffer = await downloadFileFromContainer(server.containerId, "/data/server.properties");
            const content = buffer.toString("utf-8");
            const config = parseServerProperties(content);
            return { config };
        } catch (error) {
            console.error("Error reading server.properties from container:", error);
            return { config: JSON.parse(server.gameConfig) };
        }
    } catch (error) {
        console.error("Error getting server properties:", error);
        return { error: "Failed to get properties" };
    }
}

function parseServerProperties(content: string): any {
    const config: any = {};
    const lines = content.split("\n");

    for (const line of lines) {
        if (line.startsWith("#") || !line.includes("=")) continue;

        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").trim();

        // Try to parse as boolean/number
        if (value.toLowerCase() === "true") config[key.trim()] = true;
        else if (value.toLowerCase() === "false") config[key.trim()] = false;
        else if (!isNaN(Number(value))) config[key.trim()] = Number(value);
        else config[key.trim()] = value;
    }

    return config;
}



export async function ensureServerDirectory(serverId: string, path: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const { docker } = await import("@/lib/docker");
        const container = docker.getContainer(server.containerId);

        // Ensure directory exists and has permissions
        const exec = await container.exec({
            Cmd: ['sh', '-c', `mkdir -p "${path}" && chown -R 1000:1000 "${path}"`],
            User: "root",
            AttachStdout: true,
            AttachStderr: true,
        });

        await exec.start({ Detach: false });

        return { success: true };
    } catch (error) {
        console.error("Error ensuring directory:", error);
        return { error: "Failed to create directory" };
    }
}

export async function listServerFiles(serverId: string, path?: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
            include: { game: true }
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const rootPath = server.game.slug === 'cs2' ? "/home/steam/cs2-dedicated"
            : server.game.slug === 'terraria' ? "/config"
                : server.game.slug === 'hytale' ? "/home/hytale/server-files"
                    : server.game.slug === 'valheim' ? "/config"
                        : "/data";
        const finalPath = path || rootPath;

        const { listContainerFiles } = await import("@/lib/docker-files");
        const files = await listContainerFiles(server.containerId, finalPath);
        return { files, currentPath: finalPath, rootPath };
    } catch (error) {
        console.error("Error listing files:", error);
        return { error: "Failed to list files" };
    }
}

export async function uploadFileToServer(formData: FormData) {
    try {
        const serverId = formData.get("serverId") as string;
        const targetPath = formData.get("targetPath") as string || "/data";
        const file = formData.get("file") as File;

        if (!serverId || !file) {
            return { error: "Missing required fields" };
        }

        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        // Use stream for upload to avoid high memory usage
        const { Readable } = await import("stream");
        // @ts-ignore - Readable.fromWeb exists in Node environment
        const nodeStream = Readable.fromWeb(file.stream());

        await uploadFileToContainer(server.containerId, nodeStream, file.name, targetPath, file.size);

        revalidatePath(`/servers/${serverId}`);
        return { success: true };
    } catch (error) {
        console.error("Error uploading file:", error);
        return { error: "Failed to upload file" };
    }
}

export async function downloadFileFromServer(serverId: string, filePath: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const buffer = await downloadFileFromContainer(server.containerId, filePath);
        return { success: true, base64: buffer.toString("base64") };
    } catch (error) {
        console.error("Error downloading file:", error);
        return { error: "Failed to download file" };
    }
}

export async function readTextFileFromServer(serverId: string, filePath: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const buffer = await downloadFileFromContainer(server.containerId, filePath);
        return { success: true, content: buffer.toString("utf-8") };
    } catch (error) {
        console.error("Error reading text file:", error);
        return { error: "Failed to read file" };
    }
}

export async function saveTextFileToServer(serverId: string, filePath: string, content: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const buffer = Buffer.from(content, "utf-8");
        const pathParts = filePath.split("/");
        const fileName = pathParts.pop() || "file.txt";
        const dirPath = pathParts.join("/") || "/data";

        await uploadFileToContainer(server.containerId, buffer, fileName, dirPath);
        return { success: true };
    } catch (error) {
        console.error("Error saving text file:", error);
        return { error: "Failed to save file" };
    }
}

export async function deleteServerFile(serverId: string, filePath: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        await deleteFileFromContainer(server.containerId, filePath);
        revalidatePath(`/servers/${serverId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting file:", error);
        return { error: "Failed to delete file" };
    }
}

export async function createBackup(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const buffer = await createContainerBackup(server.containerId);
        // Note: In a real app, you might save this buffer to a file storage or return a download URL.
        // For now, we return the buffer data.
        return { success: true, base64: buffer.toString("base64") };
    } catch (error) {
        console.error("Error creating backup:", error);
        return { error: "Failed to create backup" };
    }
}

export async function downloadWorld(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        // World is typically in /data/world
        const buffer = await createContainerBackup(server.containerId, "/data/world");
        return { success: true, base64: buffer.toString("base64") };
    } catch (error) {
        console.error("Error downloading world:", error);
        return { error: "Failed to download world" };
    }
}

export async function uploadWorld(serverId: string, base64Data: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const buffer = Buffer.from(base64Data, "base64");

        // This expects a tar buffer from the client
        await uploadFileToContainer(
            server.containerId,
            buffer,
            "world.tar",
            "/data"
        );

        revalidatePath(`/servers/${serverId}`);
        return { success: true };
    } catch (error) {
        console.error("Error uploading world:", error);
        return { error: "Failed to upload world" };
    }
}

export async function getPlayerLists(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not running" };
        }

        const lists = {
            whitelist: [] as any[],
            blacklist: [] as any[]
        };

        // Try to read whitelist.json
        try {
            const whitelistBuffer = await downloadFileFromContainer(server.containerId, "/data/whitelist.json");
            lists.whitelist = JSON.parse(whitelistBuffer.toString("utf-8"));
        } catch (e) {
            console.log("whitelist.json not found or empty");
        }

        // Try to read banned-players.json
        try {
            const blacklistBuffer = await downloadFileFromContainer(server.containerId, "/data/banned-players.json");
            lists.blacklist = JSON.parse(blacklistBuffer.toString("utf-8"));
        } catch (e) {
            console.log("banned-players.json not found or empty");
        }

        return { success: true, lists };
    } catch (error) {
        console.error("Error getting player lists:", error);
        return { error: "Failed to load player lists" };
    }
}

export async function managePlayerList(
    serverId: string,
    action: "add" | "remove",
    list: "whitelist" | "blacklist",
    playerName: string
) {
    try {
        // Use RCON commands for better consistency and UUID resolution
        let command = "";
        if (list === "whitelist") {
            command = action === "add" ? `whitelist add ${playerName}` : `whitelist remove ${playerName}`;
        } else {
            command = action === "add" ? `ban ${playerName}` : `pardon ${playerName}`;
        }

        const { executeServerCommand } = await import("./server-actions");
        const result = await executeServerCommand(serverId, command);

        if (result.error) return result;

        // Reload the server lists to reflect changes
        return { success: true };
    } catch (error) {
        console.error("Error managing player list:", error);
        return { error: "Failed to update list" };
    }
}

export async function extractServerArchive(serverId: string, filePath: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) {
            return { error: "Server not found or not running" };
        }

        const destPath = filePath.substring(0, filePath.lastIndexOf('/'));

        await extractContainerArchive(server.containerId, filePath, destPath || "/data");

        revalidatePath(`/servers/${serverId}`);
        return { success: true };
    } catch (error) {
        console.error("Error extracting archive:", error);
        return { error: "Failed to extract archive" };
    }
}
