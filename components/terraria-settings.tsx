"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateGameServerConfig } from "@/actions/server-actions";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { TERRARIA_DIFFICULTIES } from "@/lib/terraria-utils";

interface TerrariaSettingsProps {
    serverId: string;
    isRunning: boolean;
    gameConfig: string;
}

export function TerrariaSettings({
    serverId,
    isRunning,
    gameConfig,
}: TerrariaSettingsProps) {
    const [config, setConfig] = useState(() => JSON.parse(gameConfig));
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const result = await updateGameServerConfig(serverId, config);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Settings saved! Restart the server to apply changes.");
        }
        setLoading(false);
    };

    const handleChange = (key: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Terraria Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure your world and server options
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Max Players</Label>
                            <Input
                                type="number"
                                min={1}
                                max={255}
                                value={config.maxPlayers}
                                onChange={(e) => handleChange("maxPlayers", parseInt(e.target.value))}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select
                                value={config.difficulty.toString()}
                                onValueChange={(value) => handleChange("difficulty", value)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TERRARIA_DIFFICULTIES.map((diff) => (
                                        <SelectItem key={diff.value} value={diff.value}>
                                            {diff.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Message of the Day (MOTD)</Label>
                        <Input
                            value={config.motd || ""}
                            onChange={(e) => handleChange("motd", e.target.value)}
                            placeholder="Welcome to my server!"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Server Password</Label>
                        <Input
                            type="password"
                            value={config.password || ""}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Leave empty for no password"
                            disabled={loading}
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <Label>World Name (Read Only)</Label>
                            <span className="text-sm font-mono text-muted-foreground">{config.worldName}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-400">
                    <strong>Note:</strong> Most settings require a server restart to take effect.
                </p>
            </div>
        </div>
    );
}
