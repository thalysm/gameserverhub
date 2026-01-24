
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
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGameServer } from "@/actions/server-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DomainSelector } from "@/components/domain-selector";
import { SystemCheck } from "@/components/system-check";
import { checkDockerStatus } from "@/actions/system-actions";

const ramOptions = [
    { value: 4096, label: "4 GB" },
    { value: 6144, label: "6 GB" },
    { value: 8192, label: "8 GB" },
    { value: 12288, label: "12 GB" },
    { value: 16384, label: "16 GB" },
];

const cpuOptions = [
    { value: 4, label: "4 Cores" },
    { value: 6, label: "6 Cores" },
    { value: 8, label: "8 Cores" },
];

export function HytaleServerForm() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Basic settings
    const [serverName, setServerName] = useState("");
    const [domainId, setDomainId] = useState("");
    const [subdomain, setSubdomain] = useState("");

    // Resources
    const [selectedRam, setSelectedRam] = useState(8192);
    const [selectedCpu, setSelectedCpu] = useState(4);

    // Game settings
    const [maxPlayers, setMaxPlayers] = useState("20");
    const [viewDistance, setViewDistance] = useState("12");
    const [authMode, setAuthMode] = useState("authenticated");
    const [enableBackups, setEnableBackups] = useState(false);
    const [autoStart, setAutoStart] = useState(true);
    const [autoRestart, setAutoRestart] = useState(true);
    const [dnsValid, setDnsValid] = useState<boolean | undefined>(undefined);

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return serverName.trim().length >= 3;
            case 2:
                // Hytale min logic for RAM? README says 4GB min.
                return selectedRam >= 4096;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);

        const dockerStatus = await checkDockerStatus();
        if (!dockerStatus.online) {
            toast.error("Docker is not running. Please start Docker to create a server.");
            setIsCreating(false);
            return;
        }

        if (domainId && dnsValid === false) {
            if (!confirm("The selected domain does not seem to point to this server. Continue anyway?")) {
                setIsCreating(false);
                return;
            }
        }

        const formData = new FormData();
        formData.append("name", serverName);
        formData.append("gameSlug", "hytale"); // SLUG
        formData.append("domainId", domainId);
        formData.append("subdomain", subdomain);
        formData.append("ramMb", selectedRam.toString());
        formData.append("cpuCores", selectedCpu.toString());
        formData.append("autoStart", autoStart.toString());
        formData.append("autoRestart", autoRestart.toString());

        const gameConfig = {
            maxPlayers: parseInt(maxPlayers),
            viewDistance: parseInt(viewDistance),
            authMode,
            enableBackups,
            serverName
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
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-500">Atenção: Requer Jogo Original</p>
                                    <p className="text-xs text-amber-400/80 leading-relaxed">
                                        Para que o servidor funcione corretamente, você precisará autenticar com uma conta que <b>possua o jogo Hytale</b>.
                                        O servidor não conseguirá baixar os arquivos necessários sem essa validação inicial.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="serverName">Server Name</Label>
                            <Input
                                id="serverName"
                                placeholder="Ex: My Hytale Server"
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
                                RAM Memory (Min: 4GB)
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
                                            option.value < 4096 && "opacity-50 cursor-not-allowed hidden" // Hytale needs 4GB
                                        )}
                                        disabled={option.value < 4096}
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
                        Hytale Settings
                    </h2>
                </div>

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
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

                            <div>
                                <Label htmlFor="viewDistance">View Distance (Chunks)</Label>
                                <Input
                                    id="viewDistance"
                                    type="number"
                                    value={viewDistance}
                                    onChange={(e) => setViewDistance(e.target.value)}
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                    placeholder="12"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Default: 12. Higher values use more RAM.</p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="authMode">Authentication Mode</Label>
                            <Select value={authMode} onValueChange={setAuthMode}>
                                <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border-white/5 bg-white/[0.02] px-3">
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                                    <SelectItem value="authenticated" className="focus:bg-white/10">Authenticated (Online)</SelectItem>
                                    <SelectItem value="offline" className="focus:bg-white/10">Offline (Insecure)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="enableBackups" className="cursor-pointer">Enable Auto Backups</Label>
                                    <p className="text-xs text-muted-foreground">Backup world data every 30 minutes</p>
                                </div>
                                <Switch id="enableBackups" checked={enableBackups} onCheckedChange={setEnableBackups} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="autoStart" className="cursor-pointer">Auto Start</Label>
                                <Switch id="autoStart" checked={autoStart} onCheckedChange={setAutoStart} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="autoRestart" className="cursor-pointer">Auto Restart</Label>
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
