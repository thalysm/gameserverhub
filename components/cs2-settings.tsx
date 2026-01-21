"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Save,
    Info,
    Shield,
    Globe,
    Terminal,
    Bot,
    Tv,
    FileText,
    Settings2,
    RefreshCw,
    Users,
    MessageSquare,
    ShieldAlert,
    Send,
    UserMinus,
    Ban,
    Plus,
    Minus,
    Search,
    Zap,
    RotateCw,
    SkipForward,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateServerConfig } from "@/actions/config-actions";
import { executeServerCommand } from "@/actions/server-actions";
import { toast } from "sonner";
import { CS2_GAME_MODES } from "@/lib/cs2-utils";
import { cn } from "@/lib/utils";

interface Player {
    id: string;
    name: string;
    steamId: string;
    ping: string;
}

interface CS2SettingsProps {
    serverId: string;
    isRunning: boolean;
    gameConfig: string;
}

export function CS2Settings({ serverId, isRunning, gameConfig }: CS2SettingsProps) {
    const initialConfig = JSON.parse(gameConfig);
    const [config, setConfig] = useState(initialConfig);
    const [saving, setSaving] = useState(false);

    // Admin state
    const [players, setPlayers] = useState<Player[]>([]);
    const [chatMessage, setChatMessage] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    // --- Admin Functions ---
    const refreshPlayers = useCallback(async () => {
        if (!isRunning) return;
        setIsRefreshing(true);
        try {
            const result = await executeServerCommand(serverId, "status");
            if (result.success && result.output) {
                const lines = result.output.split("\n");
                const newPlayers: Player[] = [];
                // Improved regex to handle:
                // 1. Bots (BOT uniqueid)
                // 2. Longer connected times (hh:mm:ss)
                // 3. Different spacing formats
                const playerRegex = /#\s+(\d+)\s+\d+\s+"(.+)"\s+(\S+)\s+([\d:]+)\s+(\d+)/;

                lines.forEach(line => {
                    const match = line.match(playerRegex);
                    if (match) {
                        newPlayers.push({
                            id: match[1],
                            name: match[2],
                            steamId: match[3],
                            ping: match[5] // Groups: 1:id, 2:name, 3:uniqueid, 4:connected, 5:ping
                        });
                    }
                });
                setPlayers(newPlayers);
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [serverId, isRunning]);

    const runCommand = async (cmd: string, successMsg?: string) => {
        if (!isRunning || isExecuting) return;
        setIsExecuting(true);
        try {
            const result = await executeServerCommand(serverId, cmd);
            if (result.error) {
                toast.error(result.error);
            } else if (successMsg) {
                toast.success(successMsg);
            }
            if (cmd === "status") refreshPlayers();
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;
        runCommand(`say ${chatMessage}`, "Message sent to chat");
        setChatMessage("");
    };

    useEffect(() => {
        if (isRunning) {
            refreshPlayers();
            const interval = setInterval(refreshPlayers, 10000);
            return () => clearInterval(interval);
        }
    }, [isRunning, refreshPlayers]);

    // --- Settings Functions ---
    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateServerConfig(serverId, config);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Settings saved! Restarting server...");
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (name: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [name]: value }));
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
                    <h3 className="text-xl font-bold text-foreground">CS2 Management</h3>
                    <p className="text-sm text-muted-foreground">Live controls and persistent server configuration</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {isRunning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-amber-500 text-xs shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>Configuration changes will <b>restart the server</b>. Live commands apply immediately.</span>
                </div>
            )}

            <Tabs defaultValue="admin" className="w-full">
                <TabsList className="bg-white/5 border border-white/5 mb-6 overflow-x-auto flex-nowrap justify-start h-auto w-full">
                    <TabsTrigger value="admin" className="px-4 py-2 text-xs">
                        <ShieldAlert className="w-3.5 h-3.5 mr-2" />
                        Admin (Live)
                    </TabsTrigger>
                    <TabsTrigger value="basic" className="px-4 py-2 text-xs">Basic Config</TabsTrigger>
                    <TabsTrigger value="gameplay" className="px-4 py-2 text-xs">Gameplay</TabsTrigger>
                    <TabsTrigger value="bots" className="px-4 py-2 text-xs">Bots</TabsTrigger>
                    <TabsTrigger value="tv" className="px-4 py-2 text-xs">CSTV</TabsTrigger>
                    <TabsTrigger value="logs" className="px-4 py-2 text-xs">Logs</TabsTrigger>
                    <TabsTrigger value="advanced" className="px-4 py-2 text-xs">Advanced</TabsTrigger>
                </TabsList>

                {/* --- LIVE ADMIN TAB --- */}
                <TabsContent value="admin" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Player Management */}
                        <div className="glass rounded-xl p-6 flex flex-col h-[500px]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">Live Players</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={refreshPlayers}
                                    disabled={isRefreshing || !isRunning}
                                    className="h-8 w-8"
                                >
                                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                                {!isRunning ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                        Server is offline
                                    </div>
                                ) : players.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                        <Users className="h-10 w-10 opacity-10 mb-2" />
                                        No players connected
                                    </div>
                                ) : (
                                    players.map((player) => (
                                        <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    ID {player.id}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{player.name}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                        <span>Ping: {player.ping}ms</span>
                                                        <span>•</span>
                                                        <span className="font-mono">{player.steamId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-amber-500 hover:bg-amber-500/10"
                                                    title="Kick Player"
                                                    onClick={() => runCommand(`kickid ${player.id}`, `Kicked ${player.name}`)}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                    title="Ban Player"
                                                    onClick={() => runCommand(`banid 0 ${player.id} kick`, `Banned ${player.name}`)}
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Server Chat */}
                            <div className="glass rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">Live Chat (Global)</h3>
                                </div>
                                <form onSubmit={handleSendChat} className="flex gap-2">
                                    <Input
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        placeholder="Type something to all players..."
                                        disabled={!isRunning}
                                        className="bg-black/20 border-white/10"
                                    />
                                    <Button type="submit" disabled={!isRunning || !chatMessage.trim()} size="icon" className="bg-primary">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>

                            {/* Match Quick Actions */}
                            <div className="glass rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">Match Actions</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" onClick={() => runCommand("mp_warmup_end", "Warmup ended")} disabled={!isRunning} className="bg-white/5 border-white/10 text-xs">
                                        <SkipForward className="mr-2 h-3.5 w-3.5" /> End Warmup
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => runCommand("mp_restartgame 1", "Game restarting")} disabled={!isRunning} className="bg-white/5 border-white/10 text-xs">
                                        <RotateCw className="mr-2 h-3.5 w-3.5" /> Restart Match
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={async () => {
                                            await runCommand("mp_restartgame 1");
                                            await runCommand("bot_kick");
                                            toast.success("Server reset: Game restarted & Bots kicked");
                                        }}
                                        disabled={!isRunning}
                                        className="col-span-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 text-xs"
                                    >
                                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Full Reset (Reset + Bot Kick)
                                    </Button>
                                </div>
                            </div>

                            {/* Live Bot Controls */}
                            <div className="glass rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Bot className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">Live Bot Controls</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" onClick={() => runCommand("bot_add", "Added bot")} disabled={!isRunning} className="bg-white/5 border-white/10">
                                        <Plus className="mr-2 h-3.5 w-3.5" /> Add Bot
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => runCommand("bot_kick", "Kicked all bots")} disabled={!isRunning} className="bg-white/5 border-white/10">
                                        <Minus className="mr-2 h-3.5 w-3.5" /> Kick All
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => runCommand("bot_stop 1", "Bots frozen")} disabled={!isRunning} className="bg-white/5 border-white/10 text-xs">
                                        Freeze Bots
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => runCommand("bot_stop 0", "Bots resumed")} disabled={!isRunning} className="bg-white/5 border-white/10 text-xs">
                                        Resume Bots
                                    </Button>
                                </div>
                            </div>

                            {/* Workshop Listing */}
                            <div className="glass rounded-xl p-6 border border-primary/20 bg-primary/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">Live Workshop Listing</h3>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => runCommand("ds_workshop_listmaps", "Check console for map list")} disabled={!isRunning} className="w-full bg-white/5 border-white/10">
                                    List Workshop Maps in Console
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* --- PERSISTENT CONFIG TABS --- */}
                <TabsContent value="basic" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader icon={Shield} title="Server Identity" description="Basic identification and security" />

                            <div className="space-y-2">
                                <Label>Server Name (Visible in-game)</Label>
                                <Input
                                    value={config.serverName || ""}
                                    onChange={(e) => updateConfig("serverName", e.target.value)}
                                    placeholder="My Awesome CS2 Server"
                                    className="bg-black/20 border-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>SRCDS Token (GSLT)</Label>
                                <Input
                                    value={config.srcdsToken}
                                    onChange={(e) => updateConfig("srcdsToken", e.target.value)}
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                        </div>

                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader icon={Terminal} title="Access Control" description="Passwords and connections" />
                            <div className="space-y-2">
                                <Label>RCON Password</Label>
                                <Input
                                    type="password"
                                    value={config.rconPassword}
                                    onChange={(e) => updateConfig("rconPassword", e.target.value)}
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Server Password (Private)</Label>
                                <Input
                                    value={config.password || ""}
                                    onChange={(e) => updateConfig("password", e.target.value)}
                                    placeholder="Leave empty for public"
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <Label>LAN Mode</Label>
                                <Switch checked={config.lan || false} onCheckedChange={(val) => updateConfig("lan", val)} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="gameplay" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader icon={Globe} title="Game Mode" description="Core game rules and limits" />
                            <div className="space-y-2">
                                <Label>Select Mode</Label>
                                <Select value={config.gameAlias} onValueChange={(val) => updateConfig("gameAlias", val)}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CS2_GAME_MODES.map(mode => (
                                            <SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Players</Label>
                                <Input
                                    type="number"
                                    value={config.maxPlayers}
                                    onChange={(e) => updateConfig("maxPlayers", parseInt(e.target.value))}
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                        </div>

                        <div className="glass rounded-xl p-6 space-y-4">
                            <SectionHeader icon={Settings2} title="Server State" description="Cheats and hibernation" />
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <Label>Enable Cheats (sv_cheats)</Label>
                                <Switch checked={config.cheats || false} onCheckedChange={(val) => updateConfig("cheats", val)} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <div>
                                    <Label>Server Hibernate</Label>
                                    <p className="text-[10px] text-muted-foreground">Lower CPU usage when empty (can be unstable)</p>
                                </div>
                                <Switch checked={config.hibernate || false} onCheckedChange={(val) => updateConfig("hibernate", val)} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <div>
                                    <Label>Infinite Overtime (OT)</Label>
                                    <p className="text-[10px] text-muted-foreground">Match continues until a winner is decided</p>
                                </div>
                                <Switch checked={config.overtimeEnabled || false} onCheckedChange={(val) => updateConfig("overtimeEnabled", val)} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="bots" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="glass rounded-xl p-6 space-y-4 max-w-2xl">
                        <SectionHeader icon={Bot} title="Bot configuration" description="Manage AI players" />
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Bot Difficulty</Label>
                                <Select value={config.botDifficulty || ""} onValueChange={(val) => updateConfig("botDifficulty", val)}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue placeholder="Default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Easy</SelectItem>
                                        <SelectItem value="1">Normal</SelectItem>
                                        <SelectItem value="2">Hard</SelectItem>
                                        <SelectItem value="3">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Bot Quota (Count)</Label>
                                <Input
                                    type="number"
                                    value={config.botQuota || ""}
                                    onChange={(e) => updateConfig("botQuota", parseInt(e.target.value))}
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bot Quota Mode</Label>
                                <Select value={config.botQuotaMode || ""} onValueChange={(val) => updateConfig("botQuotaMode", val)}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue placeholder="Default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fill">Fill</SelectItem>
                                        <SelectItem value="competitive">Competitive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tv" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="glass rounded-xl p-6 space-y-4">
                        <SectionHeader icon={Tv} title="CSTV (SourceTV)" description="Broadcast your games" />
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                            <Label>Enable CSTV</Label>
                            <Switch checked={config.tvEnable || false} onCheckedChange={(val) => updateConfig("tvEnable", val)} />
                        </div>
                        {config.tvEnable && (
                            <div className="grid gap-6 sm:grid-cols-2 pt-4">
                                <div className="space-y-2">
                                    <Label>TV Port</Label>
                                    <Input type="number" value={config.tvPort || 27020} onChange={(e) => updateConfig("tvPort", parseInt(e.target.value))} className="bg-black/20 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label>TV Password</Label>
                                    <Input type="password" value={config.tvPassword || ""} onChange={(e) => updateConfig("tvPassword", e.target.value)} className="bg-black/20 border-white/10" />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                    <Label>Auto Record Demos</Label>
                                    <Switch checked={config.tvAutoRecord || false} onCheckedChange={(val) => updateConfig("tvAutoRecord", val)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Broadcast Delay (seconds)</Label>
                                    <Input type="number" value={config.tvDelay || 0} onChange={(e) => updateConfig("tvDelay", parseInt(e.target.value))} className="bg-black/20 border-white/10" />
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="glass rounded-xl p-6 space-y-4">
                        <SectionHeader icon={FileText} title="Logging" description="Control what information is logged" />
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <Label>Enable Logs</Label>
                                <Switch checked={config.log !== false} onCheckedChange={(val) => updateConfig("log", val)} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <Label>Log Money Events</Label>
                                <Switch checked={config.logMoney || false} onCheckedChange={(val) => updateConfig("logMoney", val)} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <Label>Log Items Access</Label>
                                <Switch checked={config.logItems || false} onCheckedChange={(val) => updateConfig("logItems", val)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Log Detail Level</Label>
                                <Select value={config.logDetail || "0"} onValueChange={(val) => updateConfig("logDetail", val)}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Disabled</SelectItem>
                                        <SelectItem value="1">Enemy Only</SelectItem>
                                        <SelectItem value="2">Friendly Only</SelectItem>
                                        <SelectItem value="3">All Combat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="glass rounded-xl p-6 space-y-4">
                        <SectionHeader icon={RefreshCw} title="Advanced & Customization" description="Experimental and troubleshooting settings" />

                        <div className="space-y-2">
                            <Label>Customization Bundle URL (Tar/Zip)</Label>
                            <Input
                                value={config.cfgUrl || ""}
                                onChange={(e) => updateConfig("cfgUrl", e.target.value)}
                                placeholder="https://example.com/my-config.zip"
                                className="bg-black/20 border-white/10"
                            />
                            <p className="text-[10px] text-muted-foreground">URL to download custom configuration files on startup.</p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Debug Level</Label>
                                <Select value={config.debug || "0"} onValueChange={(val) => updateConfig("debug", val)}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">None</SelectItem>
                                        <SelectItem value="1">SteamCMD Only</SelectItem>
                                        <SelectItem value="2">CS2 Engine Only</SelectItem>
                                        <SelectItem value="3">Full Debug</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                <div className="space-y-0.5">
                                    <Label>Skip Update Verification</Label>
                                    <p className="text-[10px] text-muted-foreground">
                                        Enabling this makes startup significantly faster by skipping Steam file integrity checks.
                                    </p>
                                </div>
                                <Switch
                                    checked={config.steamAppValidate === false || config.steamAppValidate === undefined}
                                    onCheckedChange={(val) => updateConfig("steamAppValidate", !val)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Additional Launch Arguments</Label>
                            <Input
                                value={config.additionalArgs || ""}
                                onChange={(e) => updateConfig("additionalArgs", e.target.value)}
                                placeholder="-maxplayers_override 16"
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
