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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getGameCover } from "@/lib/games-data";
import { getGameServers, startGameServer, stopGameServer } from "@/actions/server-actions";
import { toast } from "sonner";

type GameServer = {
  id: string;
  name: string;
  port: number;
  customHost: string | null;
  ramMb: number;
  cpuCores: number;
  status: string;
  game: {
    slug: string;
    name: string;
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

  const statusColors = {
    running: "bg-green-500",
    stopped: "bg-red-500",
    starting: "bg-amber-500",
  };

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

  return (
    <div className="glass glass-hover rounded-xl p-4 transition-all">
      <div className="flex items-start gap-4">
        <Link href={`/servers/${server.id}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg group/img">
          <Image
            src={getGameCover(server.game.slug)}
            alt={server.game.name}
            fill
            className="object-cover transition-transform group-hover/img:scale-110"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/servers/${server.id}`} className="group/title">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-medium text-foreground group-hover/title:text-primary transition-colors">
                {server.name}
              </h4>
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  statusColors[server.status as keyof typeof statusColors] || statusColors.stopped
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground">{server.game.name}</p>
          </Link>

          <button
            onClick={copyHost}
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <code className="font-mono">
              {server.customHost || `localhost:${server.port}`}
            </code>
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-sm">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{server.cpuCores}</span>
            </div>
            <span className="text-xs text-muted-foreground">CPU</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1.5 text-sm">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{server.ramMb / 1024}GB</span>
            </div>
            <span className="text-xs text-muted-foreground">RAM</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {server.status === "running" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-400 hover:bg-red-500/20 hover:text-red-400"
              title="Stop server"
              onClick={handleStop}
              disabled={isLoading}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-green-400 hover:bg-green-500/20 hover:text-green-400"
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
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Restart"
            disabled={server.status === "stopped" || isLoading}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Settings"
            asChild
          >
            <Link href={`/servers/${server.id}`}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MyServers() {
  const [servers, setServers] = useState<GameServer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServers = async () => {
    const data = await getGameServers();
    setServers((data as GameServer[]).slice(0, 3)); // Show only first 3
    setLoading(false);
  };

  useEffect(() => {
    loadServers();
  }, []);

  if (loading) {
    return null;
  }

  if (servers.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            My Servers
          </h2>
          <span className="glass rounded-full px-2 py-0.5 text-xs text-muted-foreground">
            {servers.filter((s) => s.status === "running").length}/{servers.length} online
          </span>
        </div>
        <Button
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/servers">View all</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} onRefresh={loadServers} />
        ))}
      </div>
    </section>
  );
}
