"use client";

import { useState, useEffect } from "react";
import { Cpu, HardDrive, Activity } from "lucide-react";
import { getServerStats } from "@/actions/server-actions";

interface ServerStatsProps {
    serverId: string;
    isRunning: boolean;
}

export function ServerStats({ serverId, isRunning }: ServerStatsProps) {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!isRunning) {
            setStats(null);
            return;
        }

        // Load stats immediately
        loadStats();

        // Poll for stats every 5 seconds
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, [serverId, isRunning]);

    const loadStats = async () => {
        const serverStats = await getServerStats(serverId);
        setStats(serverStats);
    };

    if (!isRunning) {
        return (
            <div className="glass rounded-xl p-6 text-center">
                <Activity className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Start the server to see performance metrics
                </p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="glass rounded-xl p-6 text-center">
                <Activity className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading stats...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Cpu className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">CPU Usage</p>
                        <p className="text-2xl font-bold text-foreground">{stats.cpu}%</p>
                    </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(parseFloat(stats.cpu), 100)}%` }}
                    />
                </div>
            </div>

            <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                        <HardDrive className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Memory Usage</p>
                        <p className="text-2xl font-bold text-foreground">
                            {stats.memory.usage} MB
                        </p>
                        <p className="text-xs text-muted-foreground">
                            of {stats.memory.limit} MB
                        </p>
                    </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                        className="h-full bg-blue-400 transition-all duration-500"
                        style={{ width: `${Math.min(parseFloat(stats.memory.percent), 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
