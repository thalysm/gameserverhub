"use client";

import {
  Server,
  Users,
  Play,
  Square,
  RotateCcw,
  Settings,
  Copy,
  Check,
  Cpu,
  HardDrive,
  Plus,
  MoreVertical,
  Terminal,
  FileText,
  Trash2,
  Activity,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutProvider } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import { getGameCover } from "@/lib/games-data";
import { getGameServers, startGameServer, stopGameServer, deleteGameServer } from "@/actions/server-actions";
import { toast } from "sonner";

type GameServer = {
  id: string;
  name: string;
  port: number;
  customHost: string | null;
  ramMb: number;
  cpuCores: number;
  status: string;
  containerName: string;
  createdAt: Date;
  game: {
    id: string;
    slug: string;
    name: string;
    category: string;
  };
};

function ServerCard({ server, onRefresh }: { server: GameServer; onRefresh: () => void }) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyHost = () => {
    const host = server.customHost || `localhost:${server.port}`;
    navigator.clipboard.writeText(host);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    running: { color: "bg-green-500", text: "Online", textColor: "text-green-400" },
    stopped: { color: "bg-red-500", text: "Offline", textColor: "text-red-400" },
    starting: { color: "bg-amber-500 animate-pulse", text: "Starting", textColor: "text-amber-400" },
    stopping: { color: "bg-orange-500", text: "Stopping", textColor: "text-orange-400" },
    error: { color: "bg-red-600", text: "Error", textColor: "text-red-500" },
  };

  const status = statusConfig[server.status as keyof typeof statusConfig] || statusConfig.stopped;

  const handleStart = async () => {
    setIsLoading(true);
    const result = await startGameServer(server.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Server started!");
      onRefresh();
    }
    setIsLoading(false);
  };

  const handleStop = async () => {
    setIsLoading(true);
    const result = await stopGameServer(server.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Server stopped!");
      onRefresh();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this server?")) return;

    setIsLoading(true);
    const result = await deleteGameServer(server.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Server deleted!");
      onRefresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="glass glass-hover rounded-xl p-5 transition-all">
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
          <Link href={`/servers/${server.id}`}>
            <Image
              src={getGameCover(server.game.slug)}
              alt={server.game.name}
              fill
              className="object-cover"
            />
          </Link>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/servers/${server.id}`} className="hover:underline">
              <h3 className="truncate text-lg font-semibold text-foreground">
                {server.name}
              </h3>
            </Link>
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", status.color)} />
            <span className={cn("text-xs font-medium", status.textColor)}>{status.text}</span>
          </div>
          <p className="text-sm text-muted-foreground">{server.game.name}</p>

          <button
            onClick={copyHost}
            className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <code className="font-mono">
              {server.customHost || `localhost:${server.port}`}
            </code>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="hidden items-center gap-6 xl:flex">
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold text-foreground">{server.cpuCores}</span>
            </div>
            <span className="text-xs text-muted-foreground">Cores</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold text-foreground">{server.ramMb / 1024}GB</span>
            </div>
            <span className="text-xs text-muted-foreground">RAM</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {server.status === "running" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-red-400 hover:bg-red-500/20 hover:text-red-400"
              title="Stop server"
              onClick={handleStop}
              disabled={isLoading}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : server.status === "starting" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-amber-400"
              disabled
            >
              <Activity className="h-4 w-4 animate-pulse" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-green-400 hover:bg-green-500/20 hover:text-green-400"
              title="Start server"
              onClick={handleStart}
              disabled={isLoading}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
            title="Restart"
            disabled={server.status === "stopped" || isLoading}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-white/5 bg-background/80 backdrop-blur-xl">
              <DropdownMenuItem className="text-foreground focus:bg-white/10" asChild>
                <Link href={`/servers/${server.id}`}>
                  <Terminal className="mr-2 h-4 w-4" />
                  Console
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground focus:bg-white/10">
                <FileText className="mr-2 h-4 w-4" />
                Logs
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground focus:bg-white/10">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                className="text-destructive focus:bg-white/10"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function ServersContent() {
  const [servers, setServers] = useState<GameServer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServers = async () => {
    setLoading(true);
    const data = await getGameServers();
    setServers(data as GameServer[]);
    setLoading(false);
  };

  useEffect(() => {
    loadServers();
  }, []);

  const onlineCount = servers.filter((s) => s.status === "running").length;
  const startingCount = servers.filter((s) => s.status === "starting").length;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Servers</h1>
          <p className="text-muted-foreground">
            {onlineCount} online, {startingCount} starting, {servers.length - onlineCount - startingCount} offline
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/games">
            <Plus className="mr-2 h-4 w-4" />
            New Server
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : servers.length > 0 ? (
        <div className="space-y-4">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} onRefresh={loadServers} />
          ))}
        </div>
      ) : (
        <div className="glass flex flex-col items-center justify-center rounded-xl py-16">
          <Server className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">No servers created</h3>
          <p className="mb-4 text-muted-foreground">Create your first server to get started</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/games">
              <Plus className="mr-2 h-4 w-4" />
              Create Server
            </Link>
          </Button>
        </div>
      )}
    </AppLayout>
  );
}

export default function ServersPage() {
  return (
    <LayoutProvider>
      <ServersContent />
    </LayoutProvider>
  );
}
