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
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const servers = [
  {
    id: 1,
    name: "Survival Brasil",
    game: "Minecraft",
    gameImage: "/games/minecraft.jpg",
    status: "online",
    players: { current: 24, max: 50 },
    host: "mc.meusite.com.br",
    port: 25565,
    cpu: 45,
    ram: 62,
    uptime: "3d 14h",
  },
  {
    id: 2,
    name: "Competitivo 128tick",
    game: "Counter-Strike 2",
    gameImage: "/games/cs2.jpg",
    status: "online",
    players: { current: 8, max: 10 },
    host: "cs2.meusite.com.br",
    port: 27015,
    cpu: 28,
    ram: 35,
    uptime: "12h 45m",
  },
  {
    id: 3,
    name: "Nordschleife Server",
    game: "Assetto Corsa",
    gameImage: "/games/assetto-corsa.jpg",
    status: "offline",
    players: { current: 0, max: 24 },
    host: "race.meusite.com.br",
    port: 9600,
    cpu: 0,
    ram: 0,
    uptime: "-",
  },
];

function ServerCard({ server }: { server: (typeof servers)[0] }) {
  const [copied, setCopied] = useState(false);

  const copyHost = () => {
    navigator.clipboard.writeText(`${server.host}:${server.port}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    starting: "bg-amber-500",
  };

  return (
    <div className="glass glass-hover rounded-xl p-4 transition-all">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={server.gameImage || "/placeholder.svg"}
            alt={server.game}
            fill
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-medium text-foreground">
              {server.name}
            </h4>
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                statusColors[server.status as keyof typeof statusColors]
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground">{server.game}</p>

          <button
            onClick={copyHost}
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <code className="font-mono">
              {server.host}:{server.port}
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
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {server.players.current}/{server.players.max}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Players</span>
          </div>

          {server.status === "online" && (
            <>
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-sm">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{server.cpu}%</span>
                </div>
                <span className="text-xs text-muted-foreground">CPU</span>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-1.5 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{server.ram}%</span>
                </div>
                <span className="text-xs text-muted-foreground">RAM</span>
              </div>
            </>
          )}

          <div className="text-center">
            <span className="text-sm text-foreground">{server.uptime}</span>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {server.status === "online" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-400 hover:bg-red-500/20 hover:text-red-400"
              title="Stop server"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-green-400 hover:bg-green-500/20 hover:text-green-400"
              title="Start server"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MyServers() {
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
            {servers.filter((s) => s.status === "online").length}/{servers.length} online
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
          <ServerCard key={server.id} server={server} />
        ))}
      </div>
    </section>
  );
}
