"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, MapPin, Clock, Shield, Database, Settings2, Info } from "lucide-react";
import { updateGameServerConfig } from "@/actions/server-actions";
import { toast } from "sonner";
import { ValheimConfig } from "@/lib/valheim-utils";

interface ValheimSettingsProps {
    server: any;
}

export function ValheimSettings({ server }: ValheimSettingsProps) {
    const currentConfig: ValheimConfig = JSON.parse(server.gameConfig);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<ValheimConfig>(currentConfig);

    const handleSave = async () => {
        if (config.serverPassword && config.serverPassword.length < 5) {
            toast.error("Server password must be at least 5 characters long!");
            return;
        }

        setLoading(true);
        const result = await updateGameServerConfig(server.id, config);
        setLoading(false);

        if ("error" in result) {
            toast.error(result.error);
        } else {
            toast.success("Settings saved! Restart the server to apply changes.");
        }
    };

    const SectionHeader = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-primary" />
                <h4 className="text-base font-semibold text-foreground">{title}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Valheim Management</h3>
                    <p className="text-sm text-muted-foreground">Configure your Valheim dedicated server</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-amber-500 text-xs shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                <Info className="h-4 w-4 shrink-0" />
                <span>Most settings require a <b>server restart</b> to take effect. Some settings like world name should not be changed after world creation.</span>
            </div>

            <Tabs defaultValue="world" className="w-full">
                <TabsList className="bg-white/5 border border-white/5 mb-6 overflow-x-auto flex-nowrap justify-start h-auto w-full">
                    <TabsTrigger value="world" className="px-4 py-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 mr-2" />
                        World Settings
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="px-4 py-2 text-xs">
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        Automation
                    </TabsTrigger>
                    <TabsTrigger value="access" className="px-4 py-2 text-xs">
                        <Shield className="w-3.5 h-3.5 mr-2" />
                        Access Control
                    </TabsTrigger>
                </TabsList>

                {/* World Settings Tab */}
                <TabsContent value="world" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader
                                icon={MapPin}
                                title="Server Identity"
                                description="Basic server and world configuration"
                            />

                            <div className="space-y-2">
                                <Label htmlFor="serverName">Server Name</Label>
                                <Input
                                    id="serverName"
                                    value={config.serverName || ""}
                                    onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
                                    placeholder="My Valheim Server"
                                    className="bg-black/20 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Name shown in the server browser
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="worldName">World Name</Label>
                                <Input
                                    id="worldName"
                                    value={config.worldName || ""}
                                    onChange={(e) => setConfig({ ...config, worldName: e.target.value })}
                                    placeholder="Dedicated"
                                    className="bg-black/20 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Name of the world without .db/.fwl extension
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="serverPassword">Server Password</Label>
                                <Input
                                    id="serverPassword"
                                    type="password"
                                    value={config.serverPassword || ""}
                                    onChange={(e) => setConfig({ ...config, serverPassword: e.target.value })}
                                    minLength={5}
                                    className="bg-black/20 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum 5 characters required
                                </p>
                            </div>
                        </div>

                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader
                                icon={Settings2}
                                title="Server Options"
                                description="Visibility and platform settings"
                            />

                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <div>
                                    <Label htmlFor="serverPublic">Public Server</Label>
                                    <p className="text-xs text-muted-foreground">List in server browser</p>
                                </div>
                                <Switch
                                    id="serverPublic"
                                    checked={config.serverPublic !== false}
                                    onCheckedChange={(checked) => setConfig({ ...config, serverPublic: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <div>
                                    <Label htmlFor="crossplay">Crossplay</Label>
                                    <p className="text-xs text-muted-foreground">Enable crossplay with Xbox/Microsoft Store</p>
                                </div>
                                <Switch
                                    id="crossplay"
                                    checked={config.crossplay === true}
                                    onCheckedChange={(checked) => setConfig({ ...config, crossplay: checked })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input
                                    id="timezone"
                                    value={config.timezone || ""}
                                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                                    placeholder="Etc/UTC"
                                    className="bg-black/20 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    TZ database format (e.g., America/Sao_Paulo, Europe/London)
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Automation Tab */}
                <TabsContent value="automation" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader
                                icon={Clock}
                                title="Update & Restart Schedule"
                                description="Automatic maintenance using cron expressions"
                            />

                            <div className="space-y-2">
                                <Label htmlFor="updateCron">Update Check Schedule (Cron)</Label>
                                <Input
                                    id="updateCron"
                                    value={config.updateCron || ""}
                                    onChange={(e) => setConfig({ ...config, updateCron: e.target.value })}
                                    placeholder="*/15 * * * *"
                                    className="bg-black/20 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Default: Check every 15 minutes
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="restartCron">Restart Schedule (Cron)</Label>
                                <Input
                                    id="restartCron"
                                    value={config.restartCron || ""}
                                    onChange={(e) => setConfig({ ...config, restartCron: e.target.value })}
                                    placeholder="10 5 * * *"
                                    className="bg-black/20 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Default: Daily at 5:10 AM
                                </p>
                            </div>
                        </div>

                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader
                                icon={Database}
                                title="Backup Configuration"
                                description="Periodic world backup settings"
                            />

                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <div>
                                    <Label htmlFor="backups">Enable Backups</Label>
                                    <p className="text-xs text-muted-foreground">Periodic world backups</p>
                                </div>
                                <Switch
                                    id="backups"
                                    checked={config.backups !== false}
                                    onCheckedChange={(checked) => setConfig({ ...config, backups: checked })}
                                />
                            </div>

                            {config.backups !== false && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="backupsCron">Backup Schedule (Cron)</Label>
                                        <Input
                                            id="backupsCron"
                                            value={config.backupsCron || ""}
                                            onChange={(e) => setConfig({ ...config, backupsCron: e.target.value })}
                                            placeholder="5 * * * *"
                                            className="bg-black/20 border-white/10"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Default: Every hour at 5 minutes past
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="backupsMaxAge">Backup Retention (Days)</Label>
                                        <Input
                                            id="backupsMaxAge"
                                            type="number"
                                            min="1"
                                            value={config.backupsMaxAge || 3}
                                            onChange={(e) => setConfig({ ...config, backupsMaxAge: parseInt(e.target.value) })}
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Access Control Tab */}
                <TabsContent value="access" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="glass rounded-xl p-6 space-y-4 max-w-3xl">
                        <SectionHeader
                            icon={Shield}
                            title="Player Access Control"
                            description="Manage admin, banned, and whitelisted players"
                        />

                        <div className="space-y-2">
                            <Label htmlFor="adminIds">Admin Steam IDs</Label>
                            <Input
                                id="adminIds"
                                value={config.adminIds || ""}
                                onChange={(e) => setConfig({ ...config, adminIds: e.target.value })}
                                placeholder="76561198012345678 76561198087654321"
                                className="bg-black/20 border-white/10"
                            />
                            <p className="text-xs text-muted-foreground">
                                Space-separated SteamID64 format. Press F2 in-game to see IDs.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bannedIds">Banned Steam IDs</Label>
                            <Input
                                id="bannedIds"
                                value={config.bannedIds || ""}
                                onChange={(e) => setConfig({ ...config, bannedIds: e.target.value })}
                                placeholder="76561198012345678"
                                className="bg-black/20 border-white/10"
                            />
                            <p className="text-xs text-muted-foreground">
                                Space-separated list of banned players
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="permittedIds">Whitelist Steam IDs</Label>
                            <Input
                                id="permittedIds"
                                value={config.permittedIds || ""}
                                onChange={(e) => setConfig({ ...config, permittedIds: e.target.value })}
                                placeholder="76561198012345678 76561198087654321"
                                className="bg-black/20 border-white/10"
                            />
                            <p className="text-xs text-muted-foreground">
                                If set, only these players can join (leave empty to allow all)
                            </p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
