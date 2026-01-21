"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CS2_MAPS } from "@/lib/cs2-utils";
import { executeServerCommand, updateGameServerConfig } from "@/actions/server-actions";
import { toast } from "sonner";
import { Gamepad2, Map as MapIcon, Plus, Search, Globe, Trash2, Steam, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkshopMap {
    id: string;
    name: string;
}

interface CS2MapManagerProps {
    serverId: string;
    isRunning: boolean;
    gameConfig: string;
}

export function CS2MapManager({ serverId, isRunning, gameConfig }: CS2MapManagerProps) {
    const [workshopId, setWorkshopId] = useState("");
    const [workshopMaps, setWorkshopMaps] = useState<WorkshopMap[]>([]);
    const [isChanging, setIsChanging] = useState<string | null>(null);

    const config = JSON.parse(gameConfig || "{}");
    const currentMap = config.map || "de_dust2";
    const currentWorkshopId = config.workshopId || "";

    // Load saved workshop maps from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`cs2-workshop-maps-${serverId}`);
        if (saved) {
            try {
                setWorkshopMaps(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse workshop maps", e);
            }
        }
    }, [serverId]);

    // Save workshop maps to localStorage whenever they change
    const saveWorkshopMaps = (maps: WorkshopMap[]) => {
        setWorkshopMaps(maps);
        localStorage.setItem(`cs2-workshop-maps-${serverId}`, JSON.stringify(maps));
    };

    const handleChangeMap = async (mapId: string, isWorkshop: boolean = false, mapName?: string) => {
        if (!isRunning) {
            toast.error("O servidor precisa estar ligado para mudar o mapa em tempo real.");
            return;
        }

        const displayName = mapName || mapId;
        setIsChanging(mapId);
        try {
            // 1. Update the database for persistence
            const configUpdates = isWorkshop
                ? { map: "", workshopId: mapId }
                : { map: mapId, workshopId: "" };

            await updateGameServerConfig(serverId, configUpdates);

            // 2. Execute RCON command for immediate change
            const cmd = isWorkshop ? `host_workshop_map ${mapId}` : `map ${mapId}`;
            const result = await executeServerCommand(serverId, cmd);

            if (result.error) {
                toast.error(`Erro RCON: ${result.error}`);
            } else {
                toast.success(`Mapa alterado para ${displayName}!`);
            }
        } catch (error) {
            toast.error("Falha ao mudar o mapa.");
        } finally {
            setIsChanging(null);
        }
    };

    const handleAddWorkshopMap = () => {
        if (!workshopId.trim()) return;

        // Check if already exists
        if (workshopMaps.some(m => m.id === workshopId.trim())) {
            toast.error("Map already in your collection");
            return;
        }

        const newMap = {
            id: workshopId.trim(),
            name: `Workshop Map (${workshopId.trim()})` // In a real app we might fetch the name from Steam API
        };

        const updated = [...workshopMaps, newMap];
        saveWorkshopMaps(updated);
        setWorkshopId("");
        toast.success("Map added to your community collection");
    };

    const removeWorkshopMap = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = workshopMaps.filter(m => m.id !== id);
        saveWorkshopMaps(updated);
    };

    return (
        <div className="space-y-6">
            {/* Official Maps */}
            <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <MapIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Official Rotation</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {CS2_MAPS.map((map) => {
                        const isActive = currentMap === map.id;
                        const loading = isChanging === map.id;

                        return (
                            <button
                                key={map.id}
                                onClick={() => handleChangeMap(map.id, false, map.name)}
                                disabled={!isRunning || !!isChanging}
                                className={cn(
                                    "group relative overflow-hidden rounded-xl border p-4 text-left transition-all",
                                    isActive
                                        ? "border-primary bg-primary/10 ring-1 ring-primary/50"
                                        : "border-white/5 bg-white/[0.02] hover:border-primary/50 hover:bg-white/[0.05]",
                                    !isRunning && !isActive && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-sm font-bold transition-colors",
                                            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                                        )}>
                                            {map.name}
                                        </span>
                                        {isActive && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                        {loading && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground uppercase">{map.type}</span>
                                </div>
                                {!isActive && !loading && (
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Gamepad2 className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Community/Workshop Collection */}
            <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Community Collection</h3>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Add Map Input */}
                    <div className="space-y-2">
                        <Label htmlFor="workshopId" className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Add New Workshop Map</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="workshopId"
                                    placeholder="Enter Workshop Map ID (e.g. 3070244462)"
                                    value={workshopId}
                                    onChange={(e) => setWorkshopId(e.target.value)}
                                    className="pl-10 border-white/10 bg-black/20"
                                />
                            </div>
                            <Button
                                onClick={handleAddWorkshopMap}
                                disabled={!workshopId.trim()}
                                className="bg-white/5 border border-white/10 hover:bg-white/10"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add to List
                            </Button>
                        </div>
                    </div>

                    {/* Workshop Maps Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 pt-4 border-t border-white/5">
                        {workshopMaps.length === 0 ? (
                            <div className="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                                <p className="text-sm text-muted-foreground">Your community collection is empty.</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">Add maps from the Steam Workshop to see them here.</p>
                            </div>
                        ) : (
                            workshopMaps.map((map) => {
                                const isActive = currentWorkshopId === map.id;
                                const loading = isChanging === map.id;

                                return (
                                    <div key={map.id} className="group relative">
                                        <button
                                            onClick={() => handleChangeMap(map.id, true, map.name)}
                                            disabled={!isRunning || !!isChanging}
                                            className={cn(
                                                "w-full overflow-hidden rounded-xl border p-4 text-left transition-all",
                                                isActive
                                                    ? "border-primary bg-primary/20 ring-1 ring-primary/50"
                                                    : "border-white/5 bg-primary/5 hover:border-primary/50 hover:bg-primary/10",
                                                !isRunning && !isActive && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="flex flex-col gap-1 pr-6">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "text-sm font-bold truncate transition-colors",
                                                        isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                                                    )}>
                                                        {map.name}
                                                    </span>
                                                    {isActive && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                                    {loading && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-mono">ID: {map.id}</span>
                                            </div>
                                            {!isActive && !loading && (
                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Gamepad2 className="h-4 w-4 text-primary" />
                                                </div>
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => removeWorkshopMap(map.id, e)}
                                            className="absolute top-2 right-2 p-1 rounded-md bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                            title="Remove from list"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                            <Search className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            <p className="font-bold text-foreground mb-1">How to find Workshop Maps?</p>
                            Go to the <a href="https://steamcommunity.com/app/730/workshop/" target="_blank" className="text-primary hover:underline">CS2 Workshop</a>,
                            choose a map and copy the number (ID) from the URL.
                            Example: <code className="bg-black/40 px-1 rounded text-primary">id=3070244462</code> → ID is <code className="bg-black/40 px-1 rounded text-primary">3070244462</code>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
