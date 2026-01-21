"use client";

import { useState, useRef, useEffect } from "react";
import {
    Terminal,
    Settings,
    Play,
    Square,
    RotateCcw,
    Save,
    ChevronLeft,
    Cpu,
    HardDrive,
    Users,
    Clock,
    Send,
    MoreVertical,
    Activity,
    FileText,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LayoutProvider } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import { useParams } from "next/navigation";
import { getGameCover } from "@/lib/games-data";

// Mock data - in a real app this would come from an API
const serverData = {
    id: 1,
    name: "Survival Brasil",
    slug: "minecraft",
    game: "Minecraft",
    status: "online",
    players: { current: 24, max: 50 },
    host: "mc.meusite.com.br",
    port: 25565,
    cpu: 45,
    ram: 62,
    uptime: "3d 14h",
    version: "1.20.4",
    settings: {
        motd: "Bem vindo ao melhor servidor do Brasil!",
        difficulty: "hard",
        pvp: true,
        whitelist: false,
        maxPlayers: 50,
        viewDistance: 10
    }
};

const initialLogs = [
    { id: 1, timestamp: "10:23:45", type: "info", message: "Server starting via docker container..." },
    { id: 2, timestamp: "10:23:46", type: "info", message: "Loading properties..." },
    { id: 3, timestamp: "10:23:46", type: "info", message: "Default game type: SURVIVAL" },
    { id: 4, timestamp: "10:23:48", type: "info", message: "Generating keypair" },
    { id: 5, timestamp: "10:23:49", type: "info", message: "Starting Minecraft server on *:25565" },
    { id: 6, timestamp: "10:23:55", type: "success", message: "Done (8.452s)! For help, type \"help\"" },
    { id: 7, timestamp: "10:45:12", type: "warning", message: "Player Steve tried to swim in lava" },
    { id: 8, timestamp: "11:02:33", type: "info", message: "Alex joined the game" },
    { id: 9, timestamp: "12:15:00", type: "info", message: "Saving chunks for level 'ServerLevel'..." },
];

function ServerDetails() {
    const params = useParams();
    const [logs, setLogs] = useState(initialLogs);
    const [command, setCommand] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [server, setServer] = useState(serverData);

    // Scroll to bottom of logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSendCommand = (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;

        const newLog = {
            id: logs.length + 1,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
            type: "command",
            message: `> ${command}`
        };

        setLogs(prev => [...prev, newLog]);

        // Simulate server response
        setTimeout(() => {
            setLogs(prev => [...prev, {
                id: prev.length + 1,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
                type: "info",
                message: `Command '${command}' executed successfully.`
            }]);
        }, 500);

        setCommand("");
    };

    const statusConfig = {
        online: { color: "bg-green-500", text: "Online", textColor: "text-green-400" },
        offline: { color: "bg-red-500", text: "Offline", textColor: "text-red-400" },
        starting: { color: "bg-amber-500 animate-pulse", text: "Starting", textColor: "text-amber-400" },
    };

    const status = statusConfig[server.status as keyof typeof statusConfig];

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header with Breadcrumb and Actions */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/servers" className="flex items-center hover:text-foreground">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Servers
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">{server.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {server.status === "online" ? (
                            <Button variant="destructive" className="gap-2">
                                <Square className="h-4 w-4" /> Stop
                            </Button>
                        ) : (
                            <Button className="gap-2 bg-green-500 hover:bg-green-600">
                                <Play className="h-4 w-4" /> Start
                            </Button>
                        )}
                        <Button variant="outline" className="gap-2">
                            <RotateCcw className="h-4 w-4" /> Restart
                        </Button>
                    </div>
                </div>

                {/* Server Hero / Info */}
                <div className="glass overflow-hidden rounded-xl">
                    <div className="relative h-48 w-full">
                        <Image
                            src={getGameCover(server.slug)}
                            alt={server.game}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-foreground">{server.name}</h1>
                                    <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md", status.color.replace('bg-', 'bg-opacity-20 bg-'))}>
                                        <span className={cn("h-2 w-2 rounded-full", status.color)} />
                                        <span className={status.textColor}>{status.text}</span>
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4" /> {server.players.current}/{server.players.max} Players
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" /> {server.uptime} uptime
                                    </span>
                                    <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-xs text-foreground/80">
                                        {server.host}:{server.port}
                                    </code>
                                </div>
                            </div>

                            <div className="hidden gap-8 text-center md:flex">
                                <div>
                                    <div className="text-2xl font-bold text-foreground">{server.cpu}%</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Cpu className="h-3 w-3" /> CPU
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">{server.ram}%</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <HardDrive className="h-3 w-3" /> RAM
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs for Console/Settings */}
                <Tabs defaultValue="console" className="space-y-4">
                    <TabsList className="bg-white/5 p-1">
                        <TabsTrigger value="console" className="gap-2">
                            <Terminal className="h-4 w-4" /> Console
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                        <TabsTrigger value="files" className="gap-2" disabled>
                            <FileText className="h-4 w-4" /> Files
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="console" className="glass overflow-hidden rounded-xl p-0">
                        <div className="flex bg-black/40 px-4 py-2 text-xs text-muted-foreground border-b border-white/5">
                            <span className="mr-4">Status: <span className="text-green-400">Connected</span></span>
                            <span>Session ID: #8392-12</span>
                        </div>

                        {/* Log Display */}
                        <div
                            ref={scrollRef}
                            className="h-[500px] overflow-y-auto p-4 font-mono text-sm leading-relaxed"
                        >
                            {logs.map((log) => (
                                <div key={log.id} className="mb-1 flex gap-3 hover:bg-white/[0.02]">
                                    <span className="shrink-0 text-muted-foreground/50 select-none">
                                        {log.timestamp}
                                    </span>
                                    <span className={cn(
                                        "break-all",
                                        log.type === "error" ? "text-red-400" :
                                            log.type === "warning" ? "text-amber-400" :
                                                log.type === "success" ? "text-green-400" :
                                                    log.type === "command" ? "text-blue-400 font-bold" :
                                                        "text-foreground/80"
                                    )}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Command Input */}
                        <div className="border-t border-white/5 bg-white/[0.02] p-4">
                            <form onSubmit={handleSendCommand} className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">{">"}</span>
                                    <Input
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        placeholder="Type a command..."
                                        className="border-white/10 bg-black/20 pl-6 font-mono focus:border-primary/50"
                                        autoComplete="off"
                                    />
                                </div>
                                <Button type="submit" size="icon" className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-6 md:col-span-2">

                                {/* General Settings */}
                                <div className="glass rounded-xl p-6">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                        <Settings className="h-5 w-5 text-primary" />
                                        General Settings
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label>Server Name</Label>
                                            <Input defaultValue={server.name} className="bg-white/5" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Message of the Day (MOTD)</Label>
                                            <Input defaultValue={server.settings.motd} className="bg-white/5" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Max Slots</Label>
                                                <Input type="number" defaultValue={server.settings.maxPlayers} className="bg-white/5" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Difficulty</Label>
                                                <Select defaultValue="hard">
                                                    <SelectTrigger className="w-full bg-white/5 border-white/10">
                                                        <SelectValue placeholder="Select difficulty" />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                                                        <SelectItem value="peaceful" className="focus:bg-white/10">Peaceful</SelectItem>
                                                        <SelectItem value="easy" className="focus:bg-white/10">Easy</SelectItem>
                                                        <SelectItem value="normal" className="focus:bg-white/10">Normal</SelectItem>
                                                        <SelectItem value="hard" className="focus:bg-white/10">Hard</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Button className="gap-2">
                                            <Save className="h-4 w-4" /> Save Changes
                                        </Button>
                                    </div>
                                </div>

                                {/* Game Rules */}
                                <div className="glass rounded-xl p-6">
                                    <h3 className="mb-4 text-lg font-semibold">Game Rules</h3>
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="flex items-center justify-between space-x-2 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                                            <Label htmlFor="pvp-mode" className="flex flex-col space-y-1">
                                                <span>PvP</span>
                                                <span className="text-xs font-normal text-muted-foreground">Allow player vs player combat</span>
                                            </Label>
                                            <Switch id="pvp-mode" defaultChecked={server.settings.pvp} />
                                        </div>

                                        <div className="flex items-center justify-between space-x-2 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                                            <Label htmlFor="whitelist" className="flex flex-col space-y-1">
                                                <span>Whitelist</span>
                                                <span className="text-xs font-normal text-muted-foreground">Only listed players can join</span>
                                            </Label>
                                            <Switch id="whitelist" defaultChecked={server.settings.whitelist} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Settings / Danger Zone */}
                            <div className="space-y-6">
                                <div className="glass rounded-xl p-6">
                                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Technical Information</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-2 border-b border-white/5">
                                            <span className="text-muted-foreground">IP Address</span>
                                            <span className="font-mono text-foreground">{server.host}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/5">
                                            <span className="text-muted-foreground">Port</span>
                                            <span className="font-mono text-foreground">{server.port}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/5">
                                            <span className="text-muted-foreground">Version</span>
                                            <span className="text-foreground">{server.version}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-white/5">
                                            <span className="text-muted-foreground">Engine</span>
                                            <span className="text-foreground">Docker Container</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass border-red-500/20 rounded-xl p-6 bg-red-500/5">
                                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-400">
                                        <ShieldAlert className="h-5 w-5" />
                                        Danger Zone
                                    </h3>
                                    <p className="mb-4 text-xs text-muted-foreground">Irreversible actions that affect the server.</p>

                                    <div className="space-y-3">
                                        <Button variant="outline" className="w-full justify-start border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                            Reinstall Server
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                            Force Stop
                                        </Button>
                                        <Button variant="destructive" className="w-full justify-start">
                                            Delete Server
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

export default function ServerDetailsPage() {
    return (
        <LayoutProvider>
            <ServerDetails />
        </LayoutProvider>
    );
}
