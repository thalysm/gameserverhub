"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Info, Users, Shield, Globe, HardDrive, Cpu, Terminal, Layers, RefreshCw, Plus, Trash2, Ban, UserCheck, Search } from "lucide-react";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVER_PROPERTIES_DESCRIPTIONS, MINECRAFT_GAME_MODES, MINECRAFT_DIFFICULTIES } from "@/lib/minecraft-utils";
import { updateServerConfig, getServerProperties, getPlayerLists, managePlayerList } from "@/actions/config-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ServerSettingsProps {
    serverId: string;
    isRunning: boolean;
    gameConfig: string;
}

// Sub-components
const PropertyField = ({
    name,
    label,
    type = "text",
    description,
    value,
    onChange
}: {
    name: string;
    label: string;
    type?: string;
    description: string;
    value: any;
    onChange: (val: any) => void;
}) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            <Label htmlFor={name} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p className="text-xs">{description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <Input
            id={name}
            type={type}
            value={value || ""}
            onChange={(e) => onChange(type === "number" ? parseInt(e.target.value) : e.target.value)}
            className="border-white/5 bg-white/[0.02] focus:border-primary/30 h-9 text-sm"
        />
    </div>
);

const SwitchField = ({
    name,
    label,
    description,
    checked,
    onCheckedChange
}: {
    name: string;
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) => (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] p-3">
        <div className="flex-1 mr-4">
            <div className="flex items-center gap-2">
                <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p className="text-xs">{description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
        <Switch
            id={name}
            checked={checked || false}
            onCheckedChange={onCheckedChange}
        />
    </div>
);

const SectionHeader = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-primary" />
            <h4 className="text-base font-semibold text-foreground">{title}</h4>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
    </div>
);

export function ServerSettings({ serverId, isRunning, gameConfig }: ServerSettingsProps) {
    const [config, setConfig] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Player lists state
    const [whitelist, setWhitelist] = useState<any[]>([]);
    const [blacklist, setBlacklist] = useState<any[]>([]);
    const [newPlayerName, setNewPlayerName] = useState("");
    const [loadingLists, setLoadingLists] = useState(false);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getServerProperties(serverId);
            if (result.config) {
                setConfig(result.config);
            } else {
                setConfig(JSON.parse(gameConfig));
            }
        } catch (error) {
            console.error("Error loading properties:", error);
            setConfig(JSON.parse(gameConfig));
        } finally {
            setLoading(false);
        }
    }, [serverId, gameConfig]);

    const loadLists = useCallback(async () => {
        if (!isRunning) return;
        setLoadingLists(true);
        try {
            const result = await getPlayerLists(serverId);
            if (result.success && result.lists) {
                setWhitelist(result.lists.whitelist);
                setBlacklist(result.lists.blacklist);
            }
        } catch (error) {
            console.error("Error loading lists:", error);
        } finally {
            setLoadingLists(false);
        }
    }, [serverId, isRunning]);

    useEffect(() => {
        loadSettings();
        loadLists();
    }, [loadSettings, loadLists]);

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading("Saving settings and restarting server...");
        try {
            const result = await updateServerConfig(serverId, config);
            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("Settings saved! Server is restarting...", { id: toastId });
            }
        } catch (error) {
            toast.error("Failed to save settings", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (name: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleListAction = async (list: "whitelist" | "blacklist", action: "add" | "remove", name?: string) => {
        const targetName = name || newPlayerName;
        if (!targetName) return;

        setLoadingLists(true);
        try {
            const result = await managePlayerList(serverId, action, list, targetName);
            if (result.success) {
                toast.success(`Player ${action === "add" ? "added to" : "removed from"} ${list}`);
                if (action === "add") setNewPlayerName("");
                // Refresh lists after a small delay to let Minecraft update the files
                setTimeout(loadLists, 1500);
            } else {
                toast.error((result as any).error || "Action failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoadingLists(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Server Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage your server.properties and player access</p>
                </div>
                <div className="flex items-center gap-3">
                    {(loading || loadingLists) && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                    <Button onClick={handleSave} disabled={saving || loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {isRunning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-amber-500 text-xs shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>Saving changes will automatically <b>restart the server</b> to apply new properties.</span>
                </div>
            )}

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center glass rounded-xl">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Reading server.properties from container...</p>
                </div>
            ) : (
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="bg-white/5 p-1 border border-white/5 mb-6 overflow-x-auto flex-nowrap justify-start h-auto">
                        <TabsTrigger value="general" className="px-4 py-2 text-xs">General</TabsTrigger>
                        <TabsTrigger value="performance" className="px-4 py-2 text-xs">Performance</TabsTrigger>
                        <TabsTrigger value="world" className="px-4 py-2 text-xs">World</TabsTrigger>
                        <TabsTrigger value="rules" className="px-4 py-2 text-xs">Rules</TabsTrigger>
                        <TabsTrigger value="network" className="px-4 py-2 text-xs">Network</TabsTrigger>
                        <TabsTrigger value="players" className="px-4 py-2 text-xs">Player Access</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-8 animate-in fade-in slide-in-from-left-2 transition-all">
                        <div className="glass rounded-xl p-6">
                            <SectionHeader
                                icon={Globe}
                                title="Basic Configuration"
                                description="Fundamental settings for your Minecraft server identification and capacity."
                            />
                            <div className="grid gap-6 sm:grid-cols-2">
                                <PropertyField
                                    name="motd"
                                    label="Message of the Day (MOTD)"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS.motd}
                                    value={config.motd}
                                    onChange={(val) => updateConfig("motd", val)}
                                />
                                <PropertyField
                                    name="max-players"
                                    label="Maximum Players"
                                    type="number"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["max-players"]}
                                    value={config["max-players"]}
                                    onChange={(val) => updateConfig("max-players", val)}
                                />
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Game Mode</Label>
                                    <Select
                                        value={config.gamemode || "survival"}
                                        onValueChange={(value) => updateConfig("gamemode", value)}
                                    >
                                        <SelectTrigger className="border-white/5 bg-white/[0.02] h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MINECRAFT_GAME_MODES.map((mode) => (
                                                <SelectItem key={mode.value} value={mode.value}>
                                                    {mode.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Difficulty</Label>
                                    <Select
                                        value={config.difficulty || "normal"}
                                        onValueChange={(value) => updateConfig("difficulty", value)}
                                    >
                                        <SelectTrigger className="border-white/5 bg-white/[0.02] h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MINECRAFT_DIFFICULTIES.map((diff) => (
                                                <SelectItem key={diff.value} value={diff.value}>
                                                    {diff.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-8 animate-in fade-in slide-in-from-left-2 transition-all">
                        <div className="glass rounded-xl p-6">
                            <SectionHeader
                                icon={Cpu}
                                title="Performance & Efficiency"
                                description="Tweak how the server handles world data and network traffic to optimize performance."
                            />
                            <div className="grid gap-6 sm:grid-cols-2">
                                <PropertyField
                                    name="view-distance"
                                    label="View Distance"
                                    type="number"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["view-distance"]}
                                    value={config["view-distance"]}
                                    onChange={(val) => updateConfig("view-distance", val)}
                                />
                                <PropertyField
                                    name="simulation-distance"
                                    label="Simulation Distance"
                                    type="number"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["simulation-distance"]}
                                    value={config["simulation-distance"]}
                                    onChange={(val) => updateConfig("simulation-distance", val)}
                                />
                                <PropertyField
                                    name="max-tick-time"
                                    label="Max Tick Time"
                                    type="number"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["max-tick-time"]}
                                    value={config["max-tick-time"]}
                                    onChange={(val) => updateConfig("max-tick-time", val)}
                                />
                                <PropertyField
                                    name="network-compression-threshold"
                                    label="Network Compression"
                                    type="number"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["network-compression-threshold"]}
                                    value={config["network-compression-threshold"]}
                                    onChange={(val) => updateConfig("network-compression-threshold", val)}
                                />
                                <SwitchField
                                    name="sync-chunk-writes"
                                    label="Sync Chunk Writes"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["sync-chunk-writes"]}
                                    checked={config["sync-chunk-writes"]}
                                    onCheckedChange={(val) => updateConfig("sync-chunk-writes", val)}
                                />
                                <SwitchField
                                    name="use-native-transport"
                                    label="Use Native Transport"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["use-native-transport"]}
                                    checked={config["use-native-transport"]}
                                    onCheckedChange={(val) => updateConfig("use-native-transport", val)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="world" className="space-y-8 animate-in fade-in slide-in-from-left-2 transition-all">
                        <div className="glass rounded-xl p-6">
                            <SectionHeader
                                icon={Layers}
                                title="World Generation"
                                description="Configure how the world is generated and what entities populate it."
                            />
                            <div className="grid gap-6 sm:grid-cols-2">
                                <PropertyField
                                    name="level-name"
                                    label="Level Name (Folder)"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["level-name"]}
                                    value={config["level-name"]}
                                    onChange={(val) => updateConfig("level-name", val)}
                                />
                                <PropertyField
                                    name="level-seed"
                                    label="Level Seed"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["level-seed"]}
                                    value={config["level-seed"]}
                                    onChange={(val) => updateConfig("level-seed", val)}
                                />
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Level Type</Label>
                                    <Select
                                        value={config["level-type"] || "default"}
                                        onValueChange={(value) => updateConfig("level-type", value)}
                                    >
                                        <SelectTrigger className="border-white/5 bg-white/[0.02] h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["default", "flat", "largeBiomes", "amplified"].map((type) => (
                                                <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <PropertyField
                                    name="spawn-protection"
                                    label="Spawn Protection Radius"
                                    type="number"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["spawn-protection"]}
                                    value={config["spawn-protection"]}
                                    onChange={(val) => updateConfig("spawn-protection", val)}
                                />
                                <SwitchField
                                    name="generate-structures"
                                    label="Generate Structures"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["generate-structures"]}
                                    checked={config["generate-structures"]}
                                    onCheckedChange={(val) => updateConfig("generate-structures", val)}
                                />
                                <SwitchField
                                    name="spawn-animals"
                                    label="Spawn Animals"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["spawn-animals"]}
                                    checked={config["spawn-animals"]}
                                    onCheckedChange={(val) => updateConfig("spawn-animals", val)}
                                />
                                <SwitchField
                                    name="spawn-monsters"
                                    label="Spawn Monsters"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["spawn-monsters"]}
                                    checked={config["spawn-monsters"]}
                                    onCheckedChange={(val) => updateConfig("spawn-monsters", val)}
                                />
                                <SwitchField
                                    name="spawn-npcs"
                                    label="Spawn NPCs"
                                    description={SERVER_PROPERTIES_DESCRIPTIONS["spawn-npcs"]}
                                    checked={config["spawn-npcs"]}
                                    onCheckedChange={(val) => updateConfig("spawn-npcs", val)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="rules" className="space-y-8 animate-in fade-in slide-in-from-left-2 transition-all">
                        <div className="glass rounded-xl p-6">
                            <SectionHeader
                                icon={Shield}
                                title="Gameplay & Rules"
                                description="Control the rules of engagement and specific gameplay mechanics."
                            />
                            <div className="grid gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <SwitchField name="pvp" label="PvP Enabled" description={SERVER_PROPERTIES_DESCRIPTIONS.pvp} checked={config.pvp} onCheckedChange={(val) => updateConfig("pvp", val)} />
                                    <SwitchField name="hardcore" label="Hardcore Mode" description={SERVER_PROPERTIES_DESCRIPTIONS.hardcore} checked={config.hardcore} onCheckedChange={(val) => updateConfig("hardcore", val)} />
                                    <SwitchField name="allow-flight" label="Allow Flight" description={SERVER_PROPERTIES_DESCRIPTIONS["allow-flight"]} checked={config["allow-flight"]} onCheckedChange={(val) => updateConfig("allow-flight", val)} />
                                    <SwitchField name="allow-nether" label="Allow Nether" description={SERVER_PROPERTIES_DESCRIPTIONS["allow-nether"]} checked={config["allow-nether"]} onCheckedChange={(val) => updateConfig("allow-nether", val)} />
                                    <SwitchField name="enable-command-block" label="Command Blocks" description={SERVER_PROPERTIES_DESCRIPTIONS["enable-command-block"]} checked={config["enable-command-block"]} onCheckedChange={(val) => updateConfig("enable-command-block", val)} />
                                    <SwitchField name="force-gamemode" label="Force Gamemode" description={SERVER_PROPERTIES_DESCRIPTIONS["force-gamemode"]} checked={config["force-gamemode"]} onCheckedChange={(val) => updateConfig("force-gamemode", val)} />
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <PropertyField
                                        name="op-permission-level"
                                        label="Op Permission Level (1-4)"
                                        type="number"
                                        description={SERVER_PROPERTIES_DESCRIPTIONS["op-permission-level"]}
                                        value={config["op-permission-level"]}
                                        onChange={(val) => updateConfig("op-permission-level", val)}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="network" className="space-y-8 animate-in fade-in slide-in-from-left-2 transition-all">
                        <div className="glass rounded-xl p-6">
                            <SectionHeader
                                icon={Terminal}
                                title="Network & Access"
                                description="Manage how the server connects to the internet and remote management tools."
                            />
                            <div className="grid gap-6 sm:grid-cols-2">
                                <SwitchField name="online-mode" label="Online Mode (Auth)" description={SERVER_PROPERTIES_DESCRIPTIONS["online-mode"]} checked={config["online-mode"]} onCheckedChange={(val) => updateConfig("online-mode", val)} />
                                <SwitchField name="enable-status" label="Broadcast Server Status" description={SERVER_PROPERTIES_DESCRIPTIONS["enable-status"]} checked={config["enable-status"]} onCheckedChange={(val) => updateConfig("enable-status", val)} />
                                <SwitchField name="enable-query" label="Enable Query" description={SERVER_PROPERTIES_DESCRIPTIONS["enable-query"]} checked={config["enable-query"]} onCheckedChange={(val) => updateConfig("enable-query", val)} />
                                <SwitchField name="enable-rcon" label="Enable RCON" description={SERVER_PROPERTIES_DESCRIPTIONS["enable-rcon"]} checked={config["enable-rcon"]} onCheckedChange={(val) => updateConfig("enable-rcon", val)} />
                                <PropertyField name="rcon-port" label="RCON Port" type="number" description={SERVER_PROPERTIES_DESCRIPTIONS["rcon-port"]} value={config["rcon-port"]} onChange={(val) => updateConfig("rcon-port", val)} />
                                <PropertyField name="rcon-password" label="RCON Password" type="password" description={SERVER_PROPERTIES_DESCRIPTIONS["rcon-password"]} value={config["rcon-password"]} onChange={(val) => updateConfig("rcon-password", val)} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="players" className="space-y-8 animate-in fade-in slide-in-from-left-2 transition-all">
                        {/* Quick Add Player */}
                        <div className="glass rounded-xl p-6 border border-primary/20 bg-primary/5">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Player username..."
                                        className="pl-10 bg-black/40 border-white/10"
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleListAction("whitelist", "add");
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button
                                        className="flex-1 sm:flex-none"
                                        disabled={!isRunning || !newPlayerName || loadingLists}
                                        onClick={() => handleListAction("whitelist", "add")}
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Whitelist
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 sm:flex-none"
                                        disabled={!isRunning || !newPlayerName || loadingLists}
                                        onClick={() => handleListAction("blacklist", "add")}
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Ban Player
                                    </Button>
                                </div>
                            </div>
                            {!isRunning && (
                                <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Server must be online to manage players via RCON.
                                </p>
                            )}
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Whitelist Panel */}
                            <div className="glass rounded-xl p-6 flex flex-col h-[400px]">
                                <div className="flex items-center justify-between mb-6">
                                    <SectionHeader
                                        icon={Users}
                                        title="Whitelist"
                                        description="Allowed players"
                                    />
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                        {whitelist.length} Users
                                    </Badge>
                                </div>

                                <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                                    {loadingLists && whitelist.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <RefreshCw className="h-6 w-6 animate-spin text-primary/40" />
                                        </div>
                                    ) : whitelist.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <Users className="h-10 w-10 text-muted-foreground/10 mb-2" />
                                            <p className="text-xs text-muted-foreground/40 italic">Whitelist is empty or not yet generated.</p>
                                        </div>
                                    ) : (
                                        whitelist.map((player) => (
                                            <div key={player.uuid || player.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {player.name?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{player.name}</p>
                                                        <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">{player.uuid}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleListAction("whitelist", "remove", player.name)}
                                                    disabled={loadingLists}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Blacklist Panel */}
                            <div className="glass rounded-xl p-6 flex flex-col h-[400px]">
                                <div className="flex items-center justify-between mb-6">
                                    <SectionHeader
                                        icon={Ban}
                                        title="Blacklist"
                                        description="Banned players"
                                    />
                                    <Badge variant="outline" className="bg-red-500/5 text-red-500 border-red-500/20">
                                        {blacklist.length} Banned
                                    </Badge>
                                </div>

                                <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                                    {loadingLists && blacklist.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <RefreshCw className="h-6 w-6 animate-spin text-red-500/40" />
                                        </div>
                                    ) : blacklist.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <Ban className="h-10 w-10 text-muted-foreground/10 mb-2" />
                                            <p className="text-xs text-muted-foreground/40 italic">No players are currently banned.</p>
                                        </div>
                                    ) : (
                                        blacklist.map((player) => (
                                            <div key={player.uuid || player.name} className="flex items-center justify-between p-3 rounded-lg bg-red-500/[0.02] border border-red-500/5 hover:bg-red-500/[0.04] transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-red-500/10 flex items-center justify-center text-[10px] font-bold text-red-500">
                                                        {player.name?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{player.name}</p>
                                                        <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">Reason: {player.reason || "Banned"}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleListAction("blacklist", "remove", player.name)}
                                                    disabled={loadingLists}
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="glass rounded-xl p-4 bg-white/[0.01] border border-white/5">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                <Info className="h-3 w-3" />
                                Whitelist and Blacklist data is read directly from <code>whitelist.json</code> and <code>banned-players.json</code> inside the container.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
