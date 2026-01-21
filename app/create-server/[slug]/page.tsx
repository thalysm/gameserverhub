"use client";

import { useState } from "react";
import { use } from "react"; // Import the use hook
import {
  ArrowLeft,
  Server,
  HardDrive,
  Cpu,
  Globe,
  Settings,
  Play,
  Info,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
// import { StoreSidebar } from "@/components/store-sidebar";
// import { StoreHeader } from "@/components/store-header";
import { LayoutProvider, useLayout } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import { getGameBySlug, getGameCover, type Game } from "@/lib/games-data";
import { useRouter } from "next/navigation";

const ramOptions = [
  { value: 1024, label: "1 GB" },
  { value: 2048, label: "2 GB" },
  { value: 4096, label: "4 GB" },
  { value: 8192, label: "8 GB" },
  { value: 16384, label: "16 GB" },
  { value: 32768, label: "32 GB" },
];

const cpuOptions = [
  { value: 1, label: "1 Core" },
  { value: 2, label: "2 Cores" },
  { value: 4, label: "4 Cores" },
  { value: 6, label: "6 Cores" },
  { value: 8, label: "8 Cores" },
];

function CreateServerContent({ game }: { game: Game }) {
  const { sidebarCollapsed } = useLayout();
  const router = useRouter();

  const [serverName, setServerName] = useState("");
  const [selectedRam, setSelectedRam] = useState(game.recommendedRam);
  const [selectedCpu, setSelectedCpu] = useState(2);
  const [port, setPort] = useState(game.defaultPort.toString());
  const [customHost, setCustomHost] = useState("");
  const [autoStart, setAutoStart] = useState(true);
  const [autoRestart, setAutoRestart] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Game-specific settings based on CS2
  const [gameSettings, setGameSettings] = useState({
    maxPlayers: "10",
    tickrate: "128",
    gameMode: "competitive",
    mapGroup: "mg_active",
    rconPassword: "",
    serverPassword: "",
    enableGotv: true,
    gotvPort: "27020",
    workshopMaps: false,
  });

  const handleCreate = async () => {
    setIsCreating(true);
    // Simulate server creation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push("/servers");
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return serverName.trim().length >= 3;
      case 2:
        return selectedRam >= game.minRam;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-10 w-10 shrink-0"
        >
          <Link href="/games">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl">
            <Image
              src={getGameCover(game.slug)}
              alt={game.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Server - {game.name}</h1>
            <p className="text-muted-foreground">Configure your dedicated server</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Basic Info */}
          <div className={cn("glass rounded-xl p-6", currentStep === 1 && "ring-1 ring-primary/50")}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  currentStep > 1 ? "bg-primary text-primary-foreground" : currentStep === 1 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
                </div>
                <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
              </div>
              {currentStep > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                  Edit
                </Button>
              )}
            </div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="serverName">Server Name</Label>
                  <Input
                    id="serverName"
                    placeholder="Ex: Meu Servidor Competitivo"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                  />
                  {serverName.length > 0 && serverName.length < 3 && (
                    <p className="mt-1 text-xs text-destructive">Nome deve ter pelo menos 3 caracteres</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="port">Porta</Label>
                    <Input
                      id="port"
                      type="number"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customHost">Host Personalizado (opcional)</Label>
                    <Input
                      id="customHost"
                      placeholder="Ex: cs2.meusite.com.br"
                      value={customHost}
                      onChange={(e) => setCustomHost(e.target.value)}
                      className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!isStepValid(1)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continuar
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Resources */}
          <div className={cn("glass rounded-xl p-6", currentStep === 2 && "ring-1 ring-primary/50")}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  currentStep > 2 ? "bg-primary text-primary-foreground" : currentStep === 2 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
                </div>
                <h2 className="text-lg font-semibold text-foreground">Recursos</h2>
              </div>
              {currentStep > 2 && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                  Editar
                </Button>
              )}
            </div>

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Memória RAM
                  </Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {ramOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedRam(option.value)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                          selectedRam === option.value
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-primary/50 hover:text-foreground",
                          option.value < game.minRam && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={option.value < game.minRam}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {selectedRam < game.minRam && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      {game.name} requer mínimo de {game.minRam / 1024} GB de RAM
                    </p>
                  )}
                  {selectedRam === game.recommendedRam && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <Check className="h-3 w-3" />
                      Configuração recomendada
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-3 flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    CPU Cores
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {cpuOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedCpu(option.value)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                          selectedCpu === option.value
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!isStepValid(2)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continuar
                </Button>
              </div>
            )}
          </div>

          {/* Step 3: Game Settings */}
          <div className={cn("glass rounded-xl p-6", currentStep === 3 && "ring-1 ring-primary/50")}>
            <div className="mb-4 flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                currentStep === 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                3
              </div>
              <h2 className="text-lg font-semibold text-foreground">Configurações do Jogo</h2>
            </div>

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="maxPlayers">Máximo de Jogadores</Label>
                    <Input
                      id="maxPlayers"
                      type="number"
                      value={gameSettings.maxPlayers}
                      onChange={(e) => setGameSettings({ ...gameSettings, maxPlayers: e.target.value })}
                      className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tickrate">Tickrate</Label>
                    <Select
                      value={gameSettings.tickrate}
                      onValueChange={(value) => setGameSettings({ ...gameSettings, tickrate: value })}
                    >
                      <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                        <SelectValue placeholder="Selecione o tickrate" />
                      </SelectTrigger>
                      <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                        <SelectItem value="64" className="focus:bg-white/10">64 tick</SelectItem>
                        <SelectItem value="128" className="focus:bg-white/10">128 tick (Competitivo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="gameMode">Modo de Jogo</Label>
                    <Select
                      value={gameSettings.gameMode}
                      onValueChange={(value) => setGameSettings({ ...gameSettings, gameMode: value })}
                    >
                      <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                        <SelectValue placeholder="Selecione o modo" />
                      </SelectTrigger>
                      <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                        <SelectItem value="competitive" className="focus:bg-white/10">Competitivo</SelectItem>
                        <SelectItem value="casual" className="focus:bg-white/10">Casual</SelectItem>
                        <SelectItem value="deathmatch" className="focus:bg-white/10">Deathmatch</SelectItem>
                        <SelectItem value="wingman" className="focus:bg-white/10">Wingman</SelectItem>
                        <SelectItem value="custom" className="focus:bg-white/10">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mapGroup">Grupo de Mapas</Label>
                    <Select
                      value={gameSettings.mapGroup}
                      onValueChange={(value) => setGameSettings({ ...gameSettings, mapGroup: value })}
                    >
                      <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                        <SelectValue placeholder="Selecione o grupo de mapas" />
                      </SelectTrigger>
                      <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                        <SelectItem value="mg_active" className="focus:bg-white/10">Active Duty</SelectItem>
                        <SelectItem value="mg_reserves" className="focus:bg-white/10">Reserves</SelectItem>
                        <SelectItem value="mg_hostage" className="focus:bg-white/10">Hostage</SelectItem>
                        <SelectItem value="mg_demolition" className="focus:bg-white/10">Demolition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="rconPassword">Senha RCON</Label>
                    <Input
                      id="rconPassword"
                      type="password"
                      placeholder="Senha para acesso remoto"
                      value={gameSettings.rconPassword}
                      onChange={(e) => setGameSettings({ ...gameSettings, rconPassword: e.target.value })}
                      className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serverPassword">Senha do Servidor (opcional)</Label>
                    <Input
                      id="serverPassword"
                      type="password"
                      placeholder="Deixe vazio para público"
                      value={gameSettings.serverPassword}
                      onChange={(e) => setGameSettings({ ...gameSettings, serverPassword: e.target.value })}
                      className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="gotv">Habilitar GOTV</Label>
                      <p className="text-xs text-muted-foreground">Permite espectadores assistirem partidas</p>
                    </div>
                    <Switch
                      id="gotv"
                      checked={gameSettings.enableGotv}
                      onCheckedChange={(checked) => setGameSettings({ ...gameSettings, enableGotv: checked })}
                    />
                  </div>

                  {gameSettings.enableGotv && (
                    <div>
                      <Label htmlFor="gotvPort">Porta GOTV</Label>
                      <Input
                        id="gotvPort"
                        type="number"
                        value={gameSettings.gotvPort}
                        onChange={(e) => setGameSettings({ ...gameSettings, gotvPort: e.target.value })}
                        className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="workshop">Workshop Maps</Label>
                      <p className="text-xs text-muted-foreground">Permitir mapas da Workshop</p>
                    </div>
                    <Switch
                      id="workshop"
                      checked={gameSettings.workshopMaps}
                      onCheckedChange={(checked) => setGameSettings({ ...gameSettings, workshopMaps: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoStart">Iniciar automaticamente</Label>
                      <p className="text-xs text-muted-foreground">Servidor inicia após criação</p>
                    </div>
                    <Switch
                      id="autoStart"
                      checked={autoStart}
                      onCheckedChange={setAutoStart}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoRestart">Auto-reiniciar em falhas</Label>
                      <p className="text-xs text-muted-foreground">Reinicia automaticamente se crashar</p>
                    </div>
                    <Switch
                      id="autoRestart"
                      checked={autoRestart}
                      onCheckedChange={setAutoRestart}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="glass sticky top-24 rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Resumo</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                  <Image
                    src={getGameCover(game.slug)}
                    alt={game.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{game.name}</p>
                  <p className="text-sm text-muted-foreground">{game.category}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="text-foreground">{serverName || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Porta</span>
                  <span className="font-mono text-foreground">{port}</span>
                </div>
                {customHost && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Host</span>
                    <span className="font-mono text-foreground">{customHost}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">RAM</span>
                  <span className="text-foreground">{selectedRam / 1024} GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU</span>
                  <span className="text-foreground">{selectedCpu} Cores</span>
                </div>
              </div>

              {currentStep === 3 && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Jogadores</span>
                    <span className="text-foreground">{gameSettings.maxPlayers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tickrate</span>
                    <span className="text-foreground">{gameSettings.tickrate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Modo</span>
                    <span className="text-foreground capitalize">{gameSettings.gameMode}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                <Info className="h-4 w-4 shrink-0" />
                <span>O servidor será criado e iniciado automaticamente após confirmação.</span>
              </div>

              <Button
                onClick={handleCreate}
                disabled={currentStep < 3 || isCreating || !serverName}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isCreating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Criar Servidor
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CreateServerPageClient({ slug }: { slug: string }) {
  const game = getGameBySlug(slug);

  if (!game) {
    return (
      <LayoutProvider>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">Jogo não encontrado</h1>
            <Button asChild>
              <Link href="/jogos">Ver todos os jogos</Link>
            </Button>
          </div>
        </div>
      </LayoutProvider>
    );
  }

  return (
    <LayoutProvider>
      <CreateServerContent game={game} />
    </LayoutProvider>
  );
}

export default function CreateServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <CreateServerPageClient slug={slug} />;
}
