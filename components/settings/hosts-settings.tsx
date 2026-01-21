"use client";

import { useState } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Copy,
  Info,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Host {
  id: number;
  domain: string;
  game: string;
  port: number;
  protocol: "TCP" | "UDP" | "TCP/UDP";
  status: "active" | "pending" | "error";
  createdAt: string;
}

const initialHosts: Host[] = [
  {
    id: 1,
    domain: "mc.meusite.com.br",
    game: "Minecraft",
    port: 25565,
    protocol: "TCP",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    domain: "cs2.meusite.com.br",
    game: "Counter-Strike 2",
    port: 27015,
    protocol: "UDP",
    status: "active",
    createdAt: "2024-01-18",
  },
  {
    id: 3,
    domain: "race.meusite.com.br",
    game: "Assetto Corsa",
    port: 9600,
    protocol: "TCP/UDP",
    status: "pending",
    createdAt: "2024-01-20",
  },
];

const games = [
  { name: "Minecraft", protocol: "TCP", defaultPort: 25565 },
  { name: "Counter-Strike 2", protocol: "UDP", defaultPort: 27015 },
  { name: "Assetto Corsa", protocol: "TCP/UDP", defaultPort: 9600 },
  { name: "Rust", protocol: "UDP", defaultPort: 28015 },
  { name: "Valheim", protocol: "UDP", defaultPort: 2456 },
  { name: "Garry's Mod", protocol: "UDP", defaultPort: 27015 },
];

export function HostsSettings() {
  const [hosts, setHosts] = useState<Host[]>(initialHosts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [newHost, setNewHost] = useState({
    domain: "",
    game: "",
    port: "",
    protocol: "TCP" as "TCP" | "UDP" | "TCP/UDP",
  });

  const handleGameChange = (gameName: string) => {
    const game = games.find((g) => g.name === gameName);
    if (game) {
      setNewHost({
        ...newHost,
        game: gameName,
        port: game.defaultPort.toString(),
        protocol: game.protocol as "TCP" | "UDP" | "TCP/UDP",
      });
    }
  };

  const handleAddHost = () => {
    if (!newHost.domain || !newHost.game || !newHost.port) return;

    const host: Host = {
      id: Date.now(),
      domain: newHost.domain,
      game: newHost.game,
      port: parseInt(newHost.port),
      protocol: newHost.protocol,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setHosts([...hosts, host]);
    setNewHost({ domain: "", game: "", port: "", protocol: "TCP" });
    setShowAddForm(false);
  };

  const handleDeleteHost = (id: number) => {
    setHosts(hosts.filter((h) => h.id !== id));
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColors = {
    active: "bg-green-500",
    pending: "bg-amber-500",
    error: "bg-red-500",
  };

  const statusLabels = {
    active: "Ativo",
    pending: "Pendente",
    error: "Erro",
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              Hosts & Domínios
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure domínios personalizados para seus servidores de jogos.
              Aponte seu DNS para este servidor e configure o host abaixo.
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Host
          </Button>
        </div>

        <div className="glass mb-4 flex items-start gap-3 rounded-lg p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Como configurar:</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
              <li>
                Adicione um registro A ou CNAME no seu provedor de DNS apontando
                para o IP deste servidor
              </li>
              <li>Configure o host abaixo com o domínio e porta do jogo</li>
              <li>
                Aguarde a propagação do DNS (pode levar até 24h)
              </li>
              <li>Use o domínio personalizado para conectar ao servidor</li>
            </ol>
          </div>
        </div>

        {showAddForm && (
          <div className="glass mb-6 rounded-lg p-4">
            <h3 className="mb-4 font-medium text-foreground">Novo Host</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Domínio
                </label>
                <input
                  type="text"
                  placeholder="mc.seusite.com.br"
                  value={newHost.domain}
                  onChange={(e) =>
                    setNewHost({ ...newHost, domain: e.target.value })
                  }
                  className="glass h-10 w-full rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Jogo
                </label>
                <Select
                  value={newHost.game}
                  onValueChange={(value) => handleGameChange(value)}
                >
                  <SelectTrigger className="glass h-10 w-full rounded-lg px-3 text-sm text-foreground hover:bg-white/5 border-white/5 bg-transparent">
                     <SelectValue placeholder="Selecione um jogo" />
                  </SelectTrigger>
                  <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                    {games.map((game) => (
                      <SelectItem key={game.name} value={game.name} className="focus:bg-white/10">{game.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Porta
                </label>
                <input
                  type="number"
                  placeholder="25565"
                  value={newHost.port}
                  onChange={(e) =>
                    setNewHost({ ...newHost, port: e.target.value })
                  }
                  className="glass h-10 w-full rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Protocolo
                </label>
                <Select
                  value={newHost.protocol}
                  onValueChange={(value) =>
                    setNewHost({
                      ...newHost,
                      protocol: value as "TCP" | "UDP" | "TCP/UDP",
                    })
                  }
                >
                  <SelectTrigger className="glass h-10 w-full rounded-lg px-3 text-sm text-foreground hover:bg-white/5 border-white/5 bg-transparent">
                     <SelectValue placeholder="Protocolo" />
                  </SelectTrigger>
                  <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                    <SelectItem value="TCP" className="focus:bg-white/10">TCP</SelectItem>
                    <SelectItem value="UDP" className="focus:bg-white/10">UDP</SelectItem>
                    <SelectItem value="TCP/UDP" className="focus:bg-white/10">TCP/UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddHost}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Adicionar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {hosts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum host configurado. Clique em "Adicionar Host" para começar.
            </div>
          ) : (
            hosts.map((host) => (
              <div
                key={host.id}
                className="glass glass-hover flex flex-wrap items-center gap-4 rounded-lg p-4 transition-all sm:flex-nowrap"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      statusColors[host.status]
                    )}
                    title={statusLabels[host.status]}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">
                        {host.domain}
                      </span>
                      <button
                        onClick={() => copyToClipboard(host.domain, host.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {copiedId === host.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{host.game}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/10 px-2 py-1 font-mono text-xs text-muted-foreground">
                    :{host.port}
                  </span>
                  <span
                    className={cn(
                      "rounded px-2 py-1 text-xs font-medium",
                      host.protocol === "TCP"
                        ? "bg-blue-500/20 text-blue-400"
                        : host.protocol === "UDP"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-purple-500/20 text-purple-400"
                    )}
                  >
                    {host.protocol}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingId(host.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDeleteHost(host.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          IP do Servidor
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Configure seus registros DNS apontando para este IP:
        </p>
        <div className="glass flex items-center justify-between rounded-lg p-4">
          <code className="font-mono text-lg text-foreground">
            192.168.1.100
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard("192.168.1.100", -1)}
            className="text-muted-foreground hover:text-foreground"
          >
            {copiedId === -1 ? (
              <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copiar
          </Button>
        </div>
      </div>
    </div>
  );
}
