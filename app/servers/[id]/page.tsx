"use client";

import { use, useState, useEffect } from "react";
import {
    ArrowLeft,
    Play,
    Square,
    RotateCcw,
    Trash2,
    Settings,
    Terminal,
    Activity,
    FileText,
    Copy,
    Check,
    Cpu,
    HardDrive,
    Globe,
    Server as ServerIcon,
    Map as MapIcon,
} from "lucide-react";
import { CS2MapManager } from "@/components/cs2-map-manager";
import { CS2ProvisioningProgress } from "@/components/cs2-provisioning-progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LayoutProvider } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import { getGameCover } from "@/lib/games-data";
import {
    getGameServer,
    startGameServer,
    stopGameServer,
    restartGameServer,
    deleteGameServer,
} from "@/actions/server-actions";
import { ServerTerminal } from "@/components/server-terminal";
import { ServerStats } from "@/components/server-stats";
import { ServerSettings } from "@/components/server-settings";
import { CS2Settings } from "@/components/cs2-settings";
import { FileManager } from "@/components/file-manager";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type GameServer = {
    id: string;
    name: string;
    port: number;
    customHost: string | null;
    ramMb: number;
    cpuCores: number;
    status: string;
    containerName: string;
    containerId: string | null;
    gameConfig: string;
    isRouterPortOpen?: boolean;
    createdAt: Date;
    game: {
        slug: string;
        name: string;
        category: string;
    };
};

function ServerDetailsContent({ serverId }: { serverId: string }) {
    const router = useRouter();
    const [server, setServer] = useState<GameServer | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadServer();
        // Refresh server status every 5 seconds
        const interval = setInterval(loadServer, 5000);
        return () => clearInterval(interval);
    }, [serverId]);

    const loadServer = async () => {
        const data = await getGameServer(serverId);
        if (data) {
            setServer(data as GameServer);
        }
        setLoading(false);
    };

    const handleStart = async () => {
        setActionLoading(true);
        const result = await startGameServer(serverId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Server started!");
            loadServer();
        }
        setActionLoading(false);
    };

    const handleRestart = async () => {
        setActionLoading(true);
        toast.promise(restartGameServer(serverId), {
            loading: 'Restarting server...',
            success: (result) => {
                if (result.error) throw new Error(result.error);
                loadServer();
                return 'Server restarted!';
            },
            error: (err) => err.message
        });
        setActionLoading(false);
    };

    const handleStop = async () => {
        setActionLoading(true);
        const result = await stopGameServer(serverId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Server stopped!");
            loadServer();
        }
        setActionLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this server? This action cannot be undone.")) {
            return;
        }

        setActionLoading(true);
        const result = await deleteGameServer(serverId);
        if (result.error) {
            toast.error(result.error);
            setActionLoading(false);
        } else {
            toast.success("Server deleted!");
            router.push("/servers");
        }
    };

    const copyHost = () => {
        const host = server?.customHost ? `${server.customHost}:${server.port}` : `localhost:${server?.port}`;
        navigator.clipboard.writeText(host);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-16">
                    <Activity className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!server) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-16">
                    <ServerIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold text-foreground">Server not found</h3>
                    <Button asChild>
                        <Link href="/servers">Back to servers</Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    const statusConfig = {
        running: { color: "bg-green-500", text: "Online", textColor: "text-green-400" },
        stopped: { color: "bg-red-500", text: "Offline", textColor: "text-red-400" },
        starting: { color: "bg-amber-500 animate-pulse", text: "Starting", textColor: "text-amber-400" },
        stopping: { color: "bg-orange-500", text: "Stopping", textColor: "text-orange-400" },
        error: { color: "bg-red-600", text: "Error", textColor: "text-red-500" },
    };

    const status = statusConfig[server.status as keyof typeof statusConfig] || statusConfig.stopped;
    const isRunning = server.status === "running";

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/servers" className="flex items-center hover:text-foreground">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Servers
                    </Link>
                    <span>/</span>
                    <span className="text-foreground">{server.name}</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                            <Image
                                src={getGameCover(server.game.slug)}
                                alt={server.game.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-foreground">{server.name}</h1>
                                <span className={cn("h-2.5 w-2.5 rounded-full", status.color)} />
                                <span className={cn("text-sm font-medium", status.textColor)}>
                                    {status.text}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{server.game.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {isRunning ? (
                            <Button
                                variant="destructive"
                                onClick={handleStop}
                                disabled={actionLoading}
                                className="glass-hover"
                            >
                                <Square className="mr-2 h-4 w-4" />
                                Stop
                            </Button>
                        ) : server.status === "starting" ? (
                            <Button disabled className="glass-hover">
                                <Activity className="mr-2 h-4 w-4 animate-pulse" />
                                Starting...
                            </Button>
                        ) : (
                            <Button
                                onClick={handleStart}
                                disabled={actionLoading}
                                className="bg-green-500 text-white hover:bg-green-600"
                            >
                                <Play className="mr-2 h-4 w-4" />
                                Start
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleRestart}
                            disabled={!isRunning || actionLoading}
                            className="glass-hover"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restart
                        </Button>
                    </div>
                </div>
            </div>

            {/* Connection Info */}
            <div className="glass mb-6 rounded-xl p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">Server Address</p>
                                {server.customHost && (
                                    <span className="flex items-center rounded-full bg-green-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-green-400">
                                        LINKED
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={copyHost}
                                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
                            >
                                <code className="font-mono text-base bg-white/5 px-2 py-1 rounded">
                                    {server.customHost ? `${server.customHost}:${server.port}` : `${window.location.hostname}:${server.port}`}
                                </code>
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </button>

                            {isRunning && (
                                <div
                                    className={cn(
                                        "mt-2 flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight",
                                        server.isRouterPortOpen
                                            ? "bg-green-500/10 border-green-500/20 text-green-500"
                                            : "bg-red-500/10 border-red-500/20 text-red-500"
                                    )}
                                >
                                    <Globe className="h-3 w-3" />
                                    {server.isRouterPortOpen ? "Porta Aberta no Roteador" : "Porta Fechada no Roteador"}
                                </div>
                            )}
                            {server.customHost && (
                                <p className="mt-1 text-[10px] text-muted-foreground italic">
                                    * Utilize este endereço para se conectar diretamente ao servidor.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <Cpu className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">CPU Cores</p>
                            <p className="text-sm font-medium text-foreground">{server.cpuCores} Cores</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                            <HardDrive className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">RAM</p>
                            <p className="text-sm font-medium text-foreground">{server.ramMb / 1024} GB</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Provisioning Progress for CS2 */}
            {server.status === "starting" && server.game.slug === "cs2" && (
                <div className="mb-6">
                    <CS2ProvisioningProgress serverId={serverId} />
                </div>
            )}

            {/* Stats */}
            <div className="mb-6">
                <ServerStats serverId={serverId} isRunning={isRunning} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="console" className="space-y-4">
                <TabsList className="glass">
                    <TabsTrigger value="console" className="data-[state=active]:bg-primary/20">
                        <Terminal className="mr-2 h-4 w-4" />
                        Console
                    </TabsTrigger>
                    {server.game.slug === 'cs2' && (
                        <TabsTrigger value="maps" className="data-[state=active]:bg-primary/20">
                            <MapIcon className="mr-2 h-4 w-4" />
                            Maps
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="settings" className="data-[state=active]:bg-primary/20">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </TabsTrigger>
                    <TabsTrigger value="files" className="data-[state=active]:bg-primary/20">
                        <FileText className="mr-2 h-4 w-4" />
                        Files
                    </TabsTrigger>
                    <TabsTrigger value="danger" className="data-[state=active]:bg-red-500/20">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Danger Zone
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="console">
                    <ServerTerminal serverId={serverId} isRunning={isRunning} />
                </TabsContent>


                {server.game.slug === 'cs2' && (
                    <TabsContent value="maps">
                        <CS2MapManager
                            serverId={serverId}
                            isRunning={isRunning}
                            gameConfig={server.gameConfig}
                        />
                    </TabsContent>
                )}

                <TabsContent value="settings">
                    {server.game.slug === 'cs2' ? (
                        <CS2Settings
                            serverId={serverId}
                            isRunning={isRunning}
                            gameConfig={server.gameConfig}
                        />
                    ) : (
                        <ServerSettings
                            serverId={serverId}
                            isRunning={isRunning}
                            gameConfig={server.gameConfig}
                        />
                    )}
                </TabsContent>

                <TabsContent value="files">
                    <FileManager
                        serverId={serverId}
                        isRunning={isRunning}
                        gameSlug={server.game.slug}
                    />
                </TabsContent>

                <TabsContent value="danger">
                    <div className="glass rounded-xl border border-red-500/20 p-6">
                        <h3 className="mb-2 text-lg font-semibold text-red-400">Danger Zone</h3>
                        <p className="mb-6 text-sm text-muted-foreground">
                            Irreversible actions that affect the server.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4">
                                <div>
                                    <p className="font-medium text-foreground">Delete Server</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete this server and all its data
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}

export default function ServerDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <LayoutProvider>
            <ServerDetailsContent serverId={id} />
        </LayoutProvider>
    );
}
