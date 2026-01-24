"use client";

import { useState } from "react";
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
import { CS2_MAPS, CS2_GAME_MODES } from "@/lib/cs2-utils";
import { createGameServer } from "@/actions/server-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DomainSelector } from "@/components/domain-selector";
import { SystemCheck } from "@/components/system-check";
import { checkDockerStatus } from "@/actions/system-actions";

const ramOptions = [
    { value: 2048, label: "2 GB" },
    { value: 4096, label: "4 GB" },
    { value: 8192, label: "8 GB" },
    { value: 16384, label: "16 GB" },
];

const cpuOptions = [
    { value: 2, label: "2 Cores" },
    { value: 4, label: "4 Cores" },
    { value: 6, label: "6 Cores" },
    { value: 8, label: "8 Cores" },
];

export function CS2ServerForm() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Basic settings
    const [serverName, setServerName] = useState("");
    const [port, setPort] = useState("27015");
    const [domainId, setDomainId] = useState("");
    const [subdomain, setSubdomain] = useState("");

    // Resources
    const [selectedRam, setSelectedRam] = useState(4096);
    const [selectedCpu, setSelectedCpu] = useState(2);

    // Game settings
    const [srcdsToken, setSrcdsToken] = useState("");
    const [startMap, setStartMap] = useState("de_dust2");
    const [gameAlias, setGameAlias] = useState("competitive");
    const [maxPlayers, setMaxPlayers] = useState("12");
    const [password, setPassword] = useState("");
    const [rconPassword, setRconPassword] = useState("");
    const [autoStart, setAutoStart] = useState(true);
    const [autoRestart, setAutoRestart] = useState(true);
    const [dnsValid, setDnsValid] = useState<boolean | undefined>(undefined);

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return serverName.trim().length >= 3;
            case 2:
                return selectedRam >= 4096;
            case 3:
                return srcdsToken.trim().length > 0;
            default:
                return false;
        }
    };

    const handleCreate = async () => {
        if (!srcdsToken) {
            toast.error("SRCDS Token is required for CS2");
            return;
        }

        setIsCreating(true);

        const dockerStatus = await checkDockerStatus();
        if (!dockerStatus.online) {
            toast.error("O Docker não está rodando. Por favor, inicie o Docker para criar o servidor.");
            setIsCreating(false);
            return;
        }

        if (domainId && dnsValid === false) {
            if (!confirm("O domínio selecionado não parece estar apontando para este servidor. Deseja continuar assim mesmo?")) {
                setIsCreating(false);
                return;
            }
        }

        const formData = new FormData();
        formData.append("name", serverName);
        formData.append("gameSlug", "cs2");
        formData.append("port", port);
        formData.append("domainId", domainId);
        formData.append("subdomain", subdomain);
        formData.append("ramMb", selectedRam.toString());
        formData.append("cpuCores", selectedCpu.toString());
        formData.append("autoStart", autoStart.toString());
        formData.append("autoRestart", autoRestart.toString());

        const gameConfig = {
            serverName,
            srcdsToken,
            map: startMap,
            gameAlias,
            maxPlayers: parseInt(maxPlayers),
            password,
            rconPassword: rconPassword || "gsh-rcon-pass",
            steamAppValidate: false,
        };
        formData.append("gameConfig", JSON.stringify(gameConfig));

        try {
            const result = await createGameServer(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("CS2 Server created successfully!");
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
            <div className={cn("glass rounded-xl p-6", currentStep === 1 && "ring-1 ring-primary/50")}>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold", currentStep > 1 ? "bg-primary text-primary-foreground" : currentStep === 1 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                            {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                    </div>
                    {currentStep > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>Edit</Button>
                    )}
                </div>

                {currentStep === 1 && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="serverName">Server Name</Label>
                            <Input
                                id="serverName"
                                placeholder="Ex: My CS2 Server"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-1">
                            <div>
                                <Label htmlFor="port">Port (UDP)</Label>
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
            <div className={cn("glass rounded-xl p-6", currentStep === 2 && "ring-1 ring-primary/50")}>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold", currentStep > 2 ? "bg-primary text-primary-foreground" : currentStep === 2 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                            {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Resources</h2>
                    </div>
                    {currentStep > 2 && (
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>Edit</Button>
                    )}
                </div>

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <Label className="mb-3 block">RAM Memory (Min 4GB recommended)</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {ramOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedRam(option.value)}
                                        className={cn(
                                            "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                            selectedRam === option.value
                                                ? "border-primary bg-primary/20 text-primary"
                                                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label className="mb-3 block">CPU Cores</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {cpuOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedCpu(option.value)}
                                        className={cn(
                                            "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                            selectedCpu === option.value
                                                ? "border-primary bg-primary/20 text-primary"
                                                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={() => setCurrentStep(3)} disabled={!isStepValid(2)} className="w-full bg-primary text-primary-foreground transition-all">Continue</Button>
                    </div>
                )}
            </div>

            {/* Step 3: CS2 Settings */}
            <div className={cn("glass rounded-xl p-6", currentStep === 3 && "ring-1 ring-primary/50")}>
                <div className="mb-4 flex items-center gap-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold", currentStep === 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>3</div>
                    <h2 className="text-lg font-semibold text-foreground">CS2 Settings</h2>
                </div>

                {currentStep === 3 && (
                    <div className="space-y-6">
                        {/* ... Info alerts omitted for brevity ... */}
                        <div>
                            <Label htmlFor="srcdsToken">SRCDS Token</Label>
                            <Input
                                id="srcdsToken"
                                placeholder="Paste your Steam GSLT here"
                                value={srcdsToken}
                                onChange={(e) => setSrcdsToken(e.target.value)}
                                className="mt-1.5 border-white/5 bg-white/[0.02]"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="map">Starting Map</Label>
                                <Select value={startMap} onValueChange={setStartMap}>
                                    <SelectTrigger className="mt-1.5 border-white/5 bg-white/[0.02]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background/95 backdrop-blur-xl">
                                        {CS2_MAPS.map(map => (
                                            <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="mode">Game Mode</Label>
                                <Select value={gameAlias} onValueChange={setGameAlias}>
                                    <SelectTrigger className="mt-1.5 border-white/5 bg-white/[0.02]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background/95 backdrop-blur-xl">
                                        {CS2_GAME_MODES.map(mode => (
                                            <SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="maxPlayers">Max Players</Label>
                                <Input id="maxPlayers" type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} className="mt-1.5 border-white/5 bg-white/[0.02]" />
                            </div>
                            <div>
                                <Label htmlFor="rconPw">RCON Password</Label>
                                <Input id="rconPw" type="password" value={rconPassword} onChange={(e) => setRconPassword(e.target.value)} placeholder="Default: gsh-rcon-pass" className="mt-1.5 border-white/5 bg-white/[0.02]" />
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.01] p-4 text-sm">
                            <div className="flex items-center justify-between">
                                <Label>Auto Start</Label>
                                <Switch checked={autoStart} onCheckedChange={setAutoStart} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Auto Restart</Label>
                                <Switch checked={autoRestart} onCheckedChange={setAutoRestart} />
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !isStepValid(3)}
                            className="w-full bg-primary text-primary-foreground"
                        >
                            {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create CS2 Server"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
