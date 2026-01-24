"use client";

import { useState, useEffect } from "react";
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
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getMinecraftReleaseVersions,
    MINECRAFT_GAME_MODES,
    MINECRAFT_DIFFICULTIES,
} from "@/lib/minecraft-utils";
import { createGameServer } from "@/actions/server-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DomainSelector } from "@/components/domain-selector";
import { SystemCheck } from "@/components/system-check";
import { checkDockerStatus } from "@/actions/system-actions";

const ramOptions = [
    { value: 1024, label: "1 GB" },
    { value: 2048, label: "2 GB" },
    { value: 4096, label: "4 GB" },
    { value: 8192, label: "8 GB" },
    { value: 16384, label: "16 GB" },
];

const cpuOptions = [
    { value: 1, label: "1 Core" },
    { value: 2, label: "2 Cores" },
    { value: 4, label: "4 Cores" },
    { value: 6, label: "6 Cores" },
    { value: 8, label: "8 Cores" },
];

export function MinecraftServerForm() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [versions, setVersions] = useState<string[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(true);

    // Basic settings
    const [serverName, setServerName] = useState("");
    const [port, setPort] = useState("25565");
    const [domainId, setDomainId] = useState("");
    const [subdomain, setSubdomain] = useState("");

    // Resources
    const [selectedRam, setSelectedRam] = useState(2048);
    const [selectedCpu, setSelectedCpu] = useState(2);

    // Game settings
    const [version, setVersion] = useState("LATEST");
    const [gameMode, setGameMode] = useState("survival");
    const [difficulty, setDifficulty] = useState("normal");
    const [maxPlayers, setMaxPlayers] = useState("20");
    const [motd, setMotd] = useState("A Minecraft Server");
    const [pvp, setPvp] = useState(true);
    const [onlineMode, setOnlineMode] = useState(true);
    const [autoStart, setAutoStart] = useState(true);
    const [autoRestart, setAutoRestart] = useState(true);
    const [dockerOnline, setDockerOnline] = useState<boolean | null>(null);
    const [dnsValid, setDnsValid] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        async function loadVersions() {
            try {
                const versionList = await getMinecraftReleaseVersions();
                setVersions(versionList);
            } catch (error) {
                console.error("Failed to load versions:", error);
            } finally {
                setLoadingVersions(false);
            }
        }
        loadVersions();
    }, []);

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return serverName.trim().length >= 3;
            case 2:
                return selectedRam >= 1024;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);

        // Check docker status again before creating
        const dockerStatus = await checkDockerStatus();
        if (!dockerStatus.online) {
            toast.error("O Docker não está rodando. Por favor, inicie o Docker para criar o servidor.");
            setIsCreating(false);
            return;
        }

        // Warning for DNS
        if (domainId && dnsValid === false) {
            if (!confirm("O domínio selecionado não parece estar apontando para este servidor. Deseja continuar assim mesmo?")) {
                setIsCreating(false);
                return;
            }
        }

        const formData = new FormData();
        formData.append("name", serverName);
        formData.append("gameSlug", "minecraft");
        formData.append("port", port);
        formData.append("domainId", domainId);
        formData.append("subdomain", subdomain);
        formData.append("ramMb", selectedRam.toString());
        formData.append("cpuCores", selectedCpu.toString());
        formData.append("autoStart", autoStart.toString());
        formData.append("autoRestart", autoRestart.toString());

        const gameConfig = {
            eula: "TRUE",
            version,
            gameMode,
            difficulty,
            maxPlayers: parseInt(maxPlayers),
            motd,
            pvp,
            onlineMode,
        };
        formData.append("gameConfig", JSON.stringify(gameConfig));

        try {
            const result = await createGameServer(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Server created successfully!");
                router.push(`/servers/${result.serverId}`);
            }
        } catch (error) {
            toast.error("Failed to create server");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Step 1: Basic Info */}
            <div
                className={cn(
                    "glass rounded-xl p-6",
                    currentStep === 1 && "ring-1 ring-primary/50"
                )}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                                currentStep > 1
                                    ? "bg-primary text-primary-foreground"
                                    : currentStep === 1
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground"
                            )}
                        >
                            {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Basic Information
                        </h2>
                    </div>
                    {currentStep > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(1)}
                        >
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
                                placeholder="Ex: My Minecraft Server"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                            />
                            {serverName.length > 0 && serverName.length < 3 && (
                                <p className="mt-1 text-xs text-destructive">
                                    Name must be at least 3 characters
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-1">
                            <div>
                                <Label htmlFor="port">Port (Default: 25565)</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                            </div>
                        </div>

                        <div className="py-2">
                            <SystemCheck />
                        </div>

                        <div className="py-2">
                            <Label className="mb-2 block">Choose Domain</Label>
                            <DomainSelector onDomainChange={(id, sub, isValid) => {
                                setDomainId(id);
                                setSubdomain(sub);
                                setDnsValid(isValid);
                            }} />
                        </div>

                        <Button
                            onClick={() => setCurrentStep(2)}
                            disabled={!isStepValid(1)}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Continue
                        </Button>
                    </div>
                )}
            </div>

            {/* Step 2: Resources */}
            <div
                className={cn(
                    "glass rounded-xl p-6",
                    currentStep === 2 && "ring-1 ring-primary/50"
                )}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                                currentStep > 2
                                    ? "bg-primary text-primary-foreground"
                                    : currentStep === 2
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground"
                            )}
                        >
                            {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Resources
                        </h2>
                    </div>
                    {currentStep > 2 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(2)}
                        >
                            Edit
                        </Button>
                    )}
                </div>

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <Label className="mb-3 flex items-center gap-2">
                                RAM Memory
                            </Label>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {ramOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedRam(option.value)}
                                        className={cn(
                                            "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                            selectedRam === option.value
                                                ? "border-primary bg-primary/20 text-primary"
                                                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                            option.value < 1024 && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={option.value < 1024}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="mb-3 flex items-center gap-2">
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
                            Continue
                        </Button>
                    </div>
                )}
            </div>

            {/* Step 3: Game Settings */}
            <div
                className={cn(
                    "glass rounded-xl p-6",
                    currentStep === 3 && "ring-1 ring-primary/50"
                )}
            >
                <div className="mb-4 flex items-center gap-3">
                    <div
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                            currentStep === 3
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        3
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Minecraft Settings
                    </h2>
                </div>

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="version">Minecraft Version</Label>
                                <Select value={version} onValueChange={setVersion}>
                                    <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                                        <SelectValue placeholder="Select version" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                                        <SelectItem value="LATEST" className="focus:bg-white/10">
                                            Latest Release
                                        </SelectItem>
                                        {loadingVersions ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            versions.map((v) => (
                                                <SelectItem
                                                    key={v}
                                                    value={v}
                                                    className="focus:bg-white/10"
                                                >
                                                    {v}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="maxPlayers">Max Players</Label>
                                <Input
                                    id="maxPlayers"
                                    type="number"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(e.target.value)}
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="gameMode">Game Mode</Label>
                                <Select value={gameMode} onValueChange={setGameMode}>
                                    <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                                        {MINECRAFT_GAME_MODES.map((mode) => (
                                            <SelectItem
                                                key={mode.value}
                                                value={mode.value}
                                                className="focus:bg-white/10"
                                            >
                                                {mode.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="difficulty">Difficulty</Label>
                                <Select value={difficulty} onValueChange={setDifficulty}>
                                    <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                                        {MINECRAFT_DIFFICULTIES.map((diff) => (
                                            <SelectItem
                                                key={diff.value}
                                                value={diff.value}
                                                className="focus:bg-white/10"
                                            >
                                                {diff.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="motd">Message of the Day (MOTD)</Label>
                            <Input
                                id="motd"
                                value={motd}
                                onChange={(e) => setMotd(e.target.value)}
                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                            />
                        </div>

                        <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pvp">PvP</Label>
                                <Switch id="pvp" checked={pvp} onCheckedChange={setPvp} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="onlineMode">Online Mode</Label>
                                <Switch id="onlineMode" checked={onlineMode} onCheckedChange={setOnlineMode} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="autoStart">Auto Start</Label>
                                <Switch id="autoStart" checked={autoStart} onCheckedChange={setAutoStart} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="autoRestart">Auto Restart</Label>
                                <Switch id="autoRestart" checked={autoRestart} onCheckedChange={setAutoRestart} />
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !serverName}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Server"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
