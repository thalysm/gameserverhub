"use client";

import { useState, useEffect } from "react";
import { Zap, Save, Loader2, Globe, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getPortPoolConfig, updatePortPoolConfig, getUsedPorts, getRouterUPnPStatus, getUPNPConfig, updateUPNPConfig } from "@/actions/settings-actions";

type UsedPort = {
    id: string;
    port: number;
    serverName: string;
    gameName: string;
    gameSlug: string;
    isRouterPortOpen: boolean;
};

export function PortPoolSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncingPort, setSyncingPort] = useState<number | null>(null);
    const [config, setConfig] = useState({ start: 20000, end: 30000 });
    const [usedPorts, setUsedPorts] = useState<UsedPort[]>([]);
    const [upnpOnline, setUpnpOnline] = useState<boolean>(false);
    const [autoUpnp, setAutoUpnp] = useState<boolean>(true);

    const loadData = async () => {
        try {
            const [data, ports, upnp, autoUpnpConfig] = await Promise.all([
                getPortPoolConfig(),
                getUsedPorts(),
                getRouterUPnPStatus(),
                getUPNPConfig()
            ]);
            setConfig(data);
            setUsedPorts(ports as UsedPort[]);
            setUpnpOnline(upnp);
            setAutoUpnp(autoUpnpConfig);
        } catch (error) {
            console.error("Failed to load port pool config:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updatePortPoolConfig(config.start, config.end);
            toast.success("Port Pool settings saved!");
        } catch (error) {
            toast.error("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRouterPort = async (port: number, gameSlug: string, enabled: boolean) => {
        setSyncingPort(port);
        try {
            const { toggleRouterPort } = await import("@/actions/settings-actions");
            await toggleRouterPort(port, gameSlug, enabled);
            toast.success(enabled ? `Port ${port} opened on router!` : `Port ${port} closed on router.`);
            await loadData();
        } catch (error) {
            toast.error("Failed to modify router configuration");
        } finally {
            setSyncingPort(null);
        }
    };

    const handleToggleAutoUpnp = async (checked: boolean) => {
        setAutoUpnp(checked);
        try {
            await updateUPNPConfig(checked);
            toast.success(checked ? "Automatic router management enabled!" : "Automatic management disabled.");
        } catch (error) {
            toast.error("Error updating UPnP config");
            setAutoUpnp(!checked); // Rollback
        }
    };

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Zap className="h-5 w-5 text-primary" />
                    Connectivity & Port Pool
                </h2>

                <div className="mb-8 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                            <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Router (UPnP)</p>
                            <p className="text-sm text-muted-foreground">Status of automatic router port forwarding</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="auto-upnp"
                                checked={autoUpnp}
                                onCheckedChange={handleToggleAutoUpnp}
                            />
                            <Label htmlFor="auto-upnp" className="text-xs cursor-pointer">Auto</Label>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <div className={cn("h-2.5 w-2.5 rounded-full", upnpOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                            <span className={cn("text-sm font-medium", upnpOnline ? "text-green-500" : "text-red-500")}>
                                {upnpOnline ? "Active" : "Inactive / Not Supported"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="startPort">Start Port</Label>
                            <Input
                                id="startPort"
                                type="number"
                                value={config.start}
                                onChange={(e) => setConfig({ ...config, start: parseInt(e.target.value) })}
                                className="border-white/5 bg-white/[0.02]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endPort">End Port</Label>
                            <Input
                                id="endPort"
                                type="number"
                                value={config.end}
                                onChange={(e) => setConfig({ ...config, end: parseInt(e.target.value) })}
                                className="border-white/5 bg-white/[0.02]"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        New servers will automatically receive a port within this range.
                        <strong> The Hub will try to use the game's default port first (e.g. 25565 for Minecraft) if available.</strong>
                    </p>
                </div>

                <div className="mt-8">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Ports in Use</h3>
                    {usedPorts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No ports allocated at the moment.</p>
                    ) : (
                        <div className="grid gap-2">
                            {usedPorts.map((up) => (
                                <div key={up.port} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] p-3 transition-colors hover:bg-white/[0.03]">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-mono font-bold text-primary">
                                            {up.port}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{up.serverName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{up.gameName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            {syncingPort === up.port ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            ) : (
                                                <Switch
                                                    id={`port-${up.port}`}
                                                    checked={up.isRouterPortOpen}
                                                    disabled={!upnpOnline}
                                                    onCheckedChange={(checked) => handleToggleRouterPort(up.port, up.gameSlug, checked)}
                                                />
                                            )}
                                            <Label htmlFor={`port-${up.port}`} className="text-[10px] font-medium uppercase cursor-pointer">
                                                Modem
                                            </Label>
                                        </div>

                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", up.isRouterPortOpen ? "bg-green-500" : "bg-red-500")} />
                                            <span className={cn("text-[10px] font-medium uppercase", up.isRouterPortOpen ? "text-green-500" : "text-red-400")}>
                                                {up.isRouterPortOpen ? "Open" : "Closed"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Pool
                    </Button>
                </div>
            </div>

            <div className="glass rounded-xl p-6 border border-white/5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    How to enable UPnP on your Router
                </h3>
                <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                    <p>UPnP (Universal Plug and Play) allows the Hub to open ports automatically on your modem without manual configuration.</p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 rounded-lg bg-white/[0.02] p-3 border border-white/5">
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">1</span>
                                Access Panel
                            </p>
                            <p>Open your browser and type the router IP (usually <code>192.168.0.1</code> or <code>192.168.1.1</code>).</p>
                        </div>
                        <div className="space-y-2 rounded-lg bg-white/[0.02] p-3 border border-white/5">
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">2</span>
                                Login
                            </p>
                            <p>Enter username and password (often <code>admin/admin</code> or per sticker on modem).</p>
                        </div>
                        <div className="space-y-2 rounded-lg bg-white/[0.02] p-3 border border-white/5">
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">3</span>
                                Enable UPnP
                            </p>
                            <p>Look for Advanced, Network, or WAN and find the <strong>UPnP</strong> option. Set to <strong>Enabled</strong>.</p>
                        </div>
                        <div className="space-y-2 rounded-lg bg-white/[0.02] p-3 border border-white/5">
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">4</span>
                                Restart Server
                            </p>
                            <p>After enabling, return here and use the ⚡ button to sync your server port.</p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-amber-500/5 p-3 border border-amber-500/10">
                        <p className="text-amber-400 font-medium mb-1 flex items-center gap-1.5">
                            <Globe className="h-3 w-3" />
                            Compatibility Note
                        </p>
                        <p>Some carrier routers may have restrictions or run on CGNAT, preventing port opening even with UPnP active. The Hub tries to handle different modem brands automatically.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
