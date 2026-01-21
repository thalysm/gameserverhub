"use client";

import { useState, useEffect } from "react";
import {
    Users,
    MessageSquare,
    Bot,
    ShieldAlert,
    Map as MapIcon,
    Send,
    UserMinus,
    Ban,
    Plus,
    Minus,
    RefreshCw,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { executeServerCommand } from "@/actions/server-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Player {
    id: string;
    name: string;
    steamId: string;
    ping: string;
    loss: string;
}

interface CS2AdminControlsProps {
    serverId: string;
    isRunning: boolean;
}

export function CS2AdminControls({ serverId, isRunning }: CS2AdminControlsProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [chatMessage, setChatMessage] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    const refreshPlayers = async () => {
        if (!isRunning) return;
        setIsRefreshing(true);
        try {
            const result = await executeServerCommand(serverId, "status");
            if (result.success && result.output) {
                const parsedPlayers = parseStatusOutput(result.output);
                setPlayers(parsedPlayers);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    const parseStatusOutput = (output: string): Player[] => {
        const lines = output.split("\n");
        const players: Player[] = [];
        // Regex to match: # 2 1 "PlayerName" STEAM_1:0:12345 01:23 15 0 active 786432
        const playerRegex = /#\s+(\d+)\s+\d+\s+"(.+)"\s+(STEAM_\d+:\d+:\d+|\[U:\d+:\d+\])\s+\d+:\d+\s+(\d+)\s+(\d+)/;

        lines.forEach(line => {
            const match = line.match(playerRegex);
            if (match) {
                players.push({
                    id: match[1],
                    name: match[2],
                    steamId: match[3],
                    ping: match[4],
                    loss: match[5]
                });
            }
        });
        return players;
    };

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
    }, [isRunning]);

    return (
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
                        <h3 className="text-lg font-semibold text-foreground">Server Chat</h3>
                    </div>
                    <form onSubmit={handleSendChat} className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Message to all players..."
                                disabled={!isRunning}
                                className="bg-black/20 border-white/10 pr-10"
                            />
                        </div>
                        <Button type="submit" disabled={!isRunning || !chatMessage.trim()} size="icon" className="bg-primary hover:bg-primary/90">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                {/* Bot Controls */}
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Bot Management</h3>
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
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Useful Bot Commands</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="ghost" size="sm" onClick={() => runCommand("bot_knives_only", "Bots restricted to knives")} className="h-7 text-[10px] bg-white/[0.03]">Knives Only</Button>
                            <Button variant="ghost" size="sm" onClick={() => runCommand("bot_all_weapons", "Bots can use all weapons")} className="h-7 text-[10px] bg-white/[0.03]">All Weapons</Button>
                            <Button variant="ghost" size="sm" onClick={() => runCommand("bot_difficulty 3", "Bots set to Expert")} className="h-7 text-[10px] bg-white/[0.03]">Expert Difficulty</Button>
                        </div>
                    </div>
                </div>

                {/* Quick Workshop Actions */}
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Workshop Tools</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => runCommand("ds_workshop_listmaps", "Check console for map list")} disabled={!isRunning} className="bg-white/5 border-white/10 justify-start">
                            <Search className="mr-2 h-4 w-4" /> List Workshop Maps
                        </Button>
                        <p className="text-[10px] text-muted-foreground ml-1">
                            Result will appear in the <b>Console</b> tab.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
