"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { getServerLogs } from "@/actions/server-actions";
import { Loader2, Download } from "lucide-react";

interface CS2ProvisioningProps {
    serverId: string;
}

export function CS2ProvisioningProgress({ serverId }: CS2ProvisioningProps) {
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("Initializing SteamCMD...");
    const [details, setDetails] = useState("");

    useEffect(() => {
        const checkProgress = async () => {
            const logs = await getServerLogs(serverId, 50);
            if (!logs) return;

            const lines = logs.split("\n").reverse();

            // Look for progress lines
            // Example: Update state (0x101) downloading, progress: 12.34 (7404000000 / 60000000000)
            const progressLine = lines.find(l => l.includes("progress:"));
            if (progressLine) {
                const match = progressLine.match(/progress: ([\d.]+)/);
                if (match) {
                    const val = parseFloat(match[1]);
                    setProgress(val);
                    setStatusText("Downloading CS2 Server Files...");

                    const detailMatch = progressLine.match(/\(([^)]+)\)/);
                    if (detailMatch) {
                        setDetails(detailMatch[1]);
                    }
                }
            } else if (lines.some(l => l.includes("Success! App '730' fully installed."))) {
                setProgress(100);
                setStatusText("Download complete! Starting engine...");
            } else if (lines.some(l => l.includes("Verifying current installation"))) {
                setStatusText("Verifying files...");
            }
        };

        checkProgress();
        const interval = setInterval(checkProgress, 3000);
        return () => clearInterval(interval);
    }, [serverId]);

    return (
        <div className="glass rounded-xl p-6 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                        <Download className="h-5 w-5 text-primary animate-bounce" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{statusText}</h3>
                        <p className="text-xs text-muted-foreground">CS2 requires ~60GB of disk space</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{progress.toFixed(1)}%</span>
                </div>
            </div>

            <Progress value={progress} className="h-2 mb-2" />

            <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>{details || "Connecting to Steam..."}</span>
                <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Don't close this page
                </span>
            </div>
        </div>
    );
}
