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
import { Check, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    TERRARIA_WORLD_SIZES,
    TERRARIA_DIFFICULTIES,
} from "@/lib/terraria-utils";
import { createGameServer } from "@/actions/server-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DomainSelector } from "@/components/domain-selector";
import { SystemCheck } from "@/components/system-check";
import { checkDockerStatus } from "@/actions/system-actions";

const ramOptions = [
    { value: 512, label: "512 MB" },
    { value: 1024, label: "1 GB" },
    { value: 2048, label: "2 GB" },
    { value: 4096, label: "4 GB" },
];

const cpuOptions = [
    { value: 1, label: "1 Core" },
    { value: 2, label: "2 Cores" },
    { value: 4, label: "4 Cores" },
];

export function TerrariaServerForm() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Basic settings
    const [serverName, setServerName] = useState("");
    const [domainId, setDomainId] = useState("");
    const [subdomain, setSubdomain] = useState("");

    // Resources
    const [selectedRam, setSelectedRam] = useState(1024);
    const [selectedCpu, setSelectedCpu] = useState(2);

    // Game settings
    const [worldName, setWorldName] = useState("MyWorld");
    const [worldSize, setWorldSize] = useState("2");
    const [difficulty, setDifficulty] = useState("0");
    const [maxPlayers, setMaxPlayers] = useState("8");
    const [password, setPassword] = useState("");
    const [motd, setMotd] = useState("Welcome to Terraria!");
    const [secure, setSecure] = useState(true);
    const [worldSeed, setWorldSeed] = useState("");
    const [autoStart, setAutoStart] = useState(true);
    const [autoRestart, setAutoRestart] = useState(true);
    const [dnsValid, setDnsValid] = useState<boolean | undefined>(undefined);

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return serverName.trim().length >= 3;
            case 2:
                return selectedRam >= 512;
            case 3:
                return worldName.trim().length >= 3;
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
        formData.append("gameSlug", "terraria");
        formData.append("domainId", domainId);
        formData.append("subdomain", subdomain);
        formData.append("ramMb", selectedRam.toString());
        formData.append("cpuCores", selectedCpu.toString());
        formData.append("autoStart", autoStart.toString());
        formData.append("autoRestart", autoRestart.toString());

        const gameConfig = {
            worldName,
            worldSize,
            difficulty,
            maxPlayers: parseInt(maxPlayers),
            password: password || undefined,
            motd,
            secure,
            language: "en-US",
            worldSeed: worldSeed || undefined,
            npcStream: 60,
        };
        formData.append("gameConfig", JSON.stringify(gameConfig));

        try {
            const result = await createGameServer(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Servidor Terraria criado com sucesso!");
                router.push(`/servers/${result.serverId}`);
            }
        } catch (error) {
            toast.error("Falha ao criar servidor");
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
                                placeholder="Ex: My Terraria Server"
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
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {ramOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedRam(option.value)}
                                        className={cn(
                                            "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                            selectedRam === option.value
                                                ? "border-primary bg-primary/20 text-primary"
                                                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                        )}
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
                            <div className="grid grid-cols-3 gap-2">
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
                        Terraria Settings
                    </h2>
                </div>

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                            <div className="flex gap-2">
                                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-400">
                                    <strong>TShock</strong> está incluído nesta imagem. O servidor suporta plugins e comandos administrativos avançados.
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="worldName">World Name</Label>
                            <Input
                                id="worldName"
                                placeholder="Ex: MyWorld"
                                value={worldName}
                                onChange={(e) => setWorldName(e.target.value)}
                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                            />
                            {worldName.length > 0 && worldName.length < 3 && (
                                <p className="mt-1 text-xs text-destructive">
                                    World name must be at least 3 characters
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="worldSize">World Size</Label>
                                <Select value={worldSize} onValueChange={setWorldSize}>
                                    <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                                        {TERRARIA_WORLD_SIZES.map((size) => (
                                            <SelectItem
                                                key={size.value}
                                                value={size.value}
                                                className="focus:bg-white/10"
                                            >
                                                {size.label}
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
                                        {TERRARIA_DIFFICULTIES.map((diff) => (
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="maxPlayers">Max Players</Label>
                                <Input
                                    id="maxPlayers"
                                    type="number"
                                    min="1"
                                    max="255"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(e.target.value)}
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Password (Optional)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Leave empty for no password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="worldSeed">World Seed (Optional)</Label>
                            <Input
                                id="worldSeed"
                                placeholder="Leave empty for random"
                                value={worldSeed}
                                onChange={(e) => setWorldSeed(e.target.value)}
                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                            />
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
                                <div>
                                    <Label htmlFor="secure">Secure Mode</Label>
                                    <p className="text-xs text-muted-foreground">Prevents cheats and hacks</p>
                                </div>
                                <Switch id="secure" checked={secure} onCheckedChange={setSecure} />
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
                            disabled={isCreating || !serverName || !worldName}
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
