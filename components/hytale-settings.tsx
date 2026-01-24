"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateGameServerConfig } from "@/actions/server-actions";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { HytaleServerConfig } from "@/lib/hytale-utils";

interface HytaleSettingsProps {
    serverId: string;
    gameConfig: string; // JSON string
    isRunning: boolean;
}

export function HytaleSettings({ serverId, gameConfig, isRunning }: HytaleSettingsProps) {
    const config = JSON.parse(gameConfig || "{}") as HytaleServerConfig;
    const [loading, setLoading] = useState(false);

    // Form states
    const [serverName, setServerName] = useState(config.serverName || "Hytale Server");
    const [maxPlayers, setMaxPlayers] = useState(config.maxPlayers?.toString() || "20");
    const [viewDistance, setViewDistance] = useState(config.viewDistance?.toString() || "12");
    const [authMode, setAuthMode] = useState<"authenticated" | "offline">(config.authMode || "authenticated");
    const [enableBackups, setEnableBackups] = useState(config.enableBackups ?? false);
    const [backupFrequency, setBackupFrequency] = useState(config.backupFrequency?.toString() || "30");
    const [downloadOnStart, setDownloadOnStart] = useState(config.downloadOnStart ?? true);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updates: HytaleServerConfig = {
                serverName,
                maxPlayers: parseInt(maxPlayers) || 20,
                viewDistance: parseInt(viewDistance) || 12,
                authMode,
                enableBackups,
                backupFrequency: parseInt(backupFrequency) || 30,
                downloadOnStart,
                // Hardcoded defaults we might want to expose later
                disableSentry: true,
            };

            const result = await updateGameServerConfig(serverId, updates);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Settings saved successfully!");
                if (isRunning) {
                    toast.warning("Restart the server to apply changes.");
                }
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* General Settings */}
            <div className="space-y-6">
                <div className="glass rounded-xl p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">General Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="serverName">Server Name</Label>
                            <Input
                                id="serverName"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="maxPlayers">Max Players</Label>
                                <Input
                                    id="maxPlayers"
                                    type="number"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(e.target.value)}
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                            </div>
                            <div>
                                <Label htmlFor="viewDistance">View Distance</Label>
                                <Input
                                    id="viewDistance"
                                    type="number"
                                    value={viewDistance}
                                    onChange={(e) => setViewDistance(e.target.value)}
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Impacts RAM usage significantly.</p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="authMode">Authentication Mode</Label>
                            <Select value={authMode} onValueChange={(v: any) => setAuthMode(v)}>
                                <SelectTrigger className="mt-1.5 border-white/5 bg-white/[0.02]">
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                                    <SelectItem value="authenticated">Authenticated (Online)</SelectItem>
                                    <SelectItem value="offline">Offline (Insecure)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-6">
                <div className="glass rounded-xl p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">Advanced & Backups</h3>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-white/5 bg-white/[0.01] p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <Label htmlFor="enableBackups" className="cursor-pointer font-medium">Auto Backups</Label>
                                    <p className="text-xs text-muted-foreground">Backup world data automatically</p>
                                </div>
                                <Switch id="enableBackups" checked={enableBackups} onCheckedChange={setEnableBackups} />
                            </div>

                            {enableBackups && (
                                <div>
                                    <Label htmlFor="backupFrequency">Backup Frequency (minutes)</Label>
                                    <Input
                                        id="backupFrequency"
                                        type="number"
                                        value={backupFrequency}
                                        onChange={(e) => setBackupFrequency(e.target.value)}
                                        className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border border-white/5 bg-white/[0.01] p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="downloadOnStart" className="cursor-pointer font-medium">Auto Update</Label>
                                    <p className="text-xs text-muted-foreground">Download/Update server files on startup</p>
                                </div>
                                <Switch id="downloadOnStart" checked={downloadOnStart} onCheckedChange={setDownloadOnStart} />
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Changes...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Configuration
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
