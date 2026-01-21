"use client";

import { useEffect } from "react";
import { checkServerHealth, getRunningServers } from "@/actions/monitor-actions";

export function ServerMonitor() {
    useEffect(() => {
        const checkAllServers = async () => {
            try {
                const runningServers = await getRunningServers();
                for (const server of runningServers) {
                    await checkServerHealth(server.id);
                }
            } catch (error) {
                console.error("Monitor loop error:", error);
            }
        };

        // Check health every 60 seconds
        const interval = setInterval(checkAllServers, 60000);

        // Initial check
        checkAllServers();

        return () => clearInterval(interval);
    }, []);

    // This component doesn't render anything
    return null;
}
