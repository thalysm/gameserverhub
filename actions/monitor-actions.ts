"use server";

import { db } from "@/lib/db";
import { getContainerStats, getContainerStatus } from "@/lib/docker";
import { createNotification } from "./notification-actions";

export async function checkServerHealth(serverId: string) {
    try {
        const server = await db.gameServer.findUnique({
            where: { id: serverId },
        });

        if (!server || !server.containerId) return;

        const status = await getContainerStatus(server.containerId);

        // Check for crash (status exited but supposed to be running)
        if (status === "exited" && server.status !== "stopped") {
            await createNotification(
                server.userId,
                "ERROR",
                `Server "${server.name}" Crashed`,
                `The server "${server.name}" has stopped unexpectedly. Status: ${status}`
            );

            // Update DB status
            await db.gameServer.update({
                where: { id: serverId },
                data: { status: "stopped" }
            });

            return { status: "crashed" };
        }

        // Check for high resources
        if (status === "running") {
            const stats = await getContainerStats(server.containerId);
            if (stats) {
                const cpuValue = parseFloat(stats.cpu);
                const memValue = parseFloat(stats.memory.percent);

                if (cpuValue > 90) {
                    await createNotification(
                        server.userId,
                        "WARNING",
                        `High CPU Usage: ${server.name}`,
                        `The server "${server.name}" is using ${cpuValue}% CPU.`
                    );
                }

                if (memValue > 90) {
                    await createNotification(
                        server.userId,
                        "WARNING",
                        `High Memory Usage: ${server.name}`,
                        `The server "${server.name}" is using ${memValue}% Memory.`
                    );
                }

                return { status: "running", stats };
            }
        }

        return { status };
    } catch (error) {
        console.error("Health check error:", error);
        return { error: "Failed to check health" };
    }
}

export async function getRunningServers() {
    const servers = await db.gameServer.findMany({
        where: {
            containerId: { not: null },
            status: { not: "stopped" }
        }
    });

    return servers;
}
