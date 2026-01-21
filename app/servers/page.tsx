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
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutProvider } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import { getGameCover } from "@/lib/games-data";

const servers = [
  {
    id: 1,
    name: "Survival Brasil",
    slug: "minecraft",
    game: "Minecraft",
    gameImage: "/games/minecraft.jpg",
    status: "online",
    players: { current: 24, max: 50 },
    host: "mc.meusite.com.br",
    port: 25565,
    cpu: 45,
    ram: 62,
    uptime: "3d 14h",
    version: "1.20.4",
  },
  {
    id: 2,
    name: "Competitivo 128tick",
    slug: "cs2",
    game: "Counter-Strike 2",
    gameImage: "/games/cs2.jpg",
    status: "online",
    players: { current: 8, max: 10 },
    host: "cs2.meusite.com.br",
    port: 27015,
    cpu: 28,
    ram: 35,
    uptime: "12h 45m",
    version: "Latest",
  },
  {
    id: 3,
    name: "Nordschleife Server",
    slug: "assetto-corsa",
    game: "Assetto Corsa",
    gameImage: "/games/assetto-corsa.jpg",
    status: "offline",
    players: { current: 0, max: 24 },
    host: "race.meusite.com.br",
    port: 9600,
    cpu: 0,
    ram: 0,
    uptime: "-",
    version: "1.16.4",
  },
  {
    id: 4,
    name: "Survival PVE",
    slug: "rust",
    game: "Rust",
    gameImage: "/games/rust.jpg",
    status: "starting",
    players: { current: 0, max: 100 },
    host: "rust.meusite.com.br",
    port: 28015,
    cpu: 15,
    ram: 22,
    uptime: "2m",
    version: "Latest",
  },
];

function ServerCard({ server }: { server: (typeof servers)[0] }) {
  const [copied, setCopied] = useState(false);

  const copyHost = () => {
    navigator.clipboard.writeText(`${server.host}:${server.port}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    online: { color: "bg-green-500", text: "Online", textColor: "text-green-400" },
    offline: { color: "bg-red-500", text: "Offline", textColor: "text-red-400" },
    starting: { color: "bg-amber-500 animate-pulse", text: "Starting", textColor: "text-amber-400" },
  };

  const status = statusConfig[server.status as keyof typeof statusConfig];

  return (
    <div className="glass glass-hover rounded-xl p-5 transition-all">
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
          <Link href={`/servers/${server.id}`}>
            <Image
              src={getGameCover(server.slug)}
              alt={server.game}
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
          <p className="text-sm text-muted-foreground">{server.game} - {server.version}</p>

          <button
            onClick={copyHost}
            className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <code className="font-mono">
              {server.host}:{server.port}
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
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold text-foreground">
                {server.players.current}
              </span>
              <span className="text-muted-foreground">/ {server.players.max}</span>
            </div>
            <span className="text-xs text-muted-foreground">Players</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "text-lg font-semibold",
                server.cpu > 80 ? "text-red-400" : server.cpu > 50 ? "text-amber-400" : "text-foreground"
              )}>
                {server.cpu}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">CPU</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "text-lg font-semibold",
                server.ram > 80 ? "text-red-400" : server.ram > 50 ? "text-amber-400" : "text-foreground"
              )}>
                {server.ram}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">RAM</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold text-foreground">{server.uptime}</span>
            </div>
            <span className="text-xs text-muted-foreground">Uptime</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {server.status === "online" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-red-400 hover:bg-red-500/20 hover:text-red-400"
              title="Stop server"
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
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
            title="Restart"
            disabled={server.status === "offline"}
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
              <DropdownMenuItem className="text-foreground focus:bg-white/10">
                <Terminal className="mr-2 h-4 w-4" />
                Console
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
              <DropdownMenuItem className="text-destructive focus:bg-white/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div >

      {/* Mobile stats */}
      < div className="mt-4 flex items-center gap-4 xl:hidden" >
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{server.players.current}/{server.players.max}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span>{server.cpu}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span>{server.ram}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{server.uptime}</span>
        </div>
      </div >
    </div >
  );
}

function ServidoresContent() {
  const onlineCount = servers.filter((s) => s.status === "online").length;
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

      <div className="space-y-4">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>

      {servers.length === 0 && (
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

export default function ServidoresPage() {
  return (
    <LayoutProvider>
      <ServidoresContent />
    </LayoutProvider>
  );
}
