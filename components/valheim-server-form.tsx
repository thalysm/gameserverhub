"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { createGameServer } from "@/actions/server-actions";
import { toast } from "sonner";
import { DomainSelector } from "./domain-selector";
import { SystemCheck } from "./system-check";
import { checkDockerStatus } from "@/actions/system-actions";
import { cn } from "@/lib/utils";

const ramOptions = [
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

interface ValheimServerFormProps {
    game: any;
}

export function ValheimServerForm({ game }: ValheimServerFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Basic settings
    const [serverName, setServerName] = useState("");
    const [domainId, setDomainId] = useState("");
    const [subdomain, setSubdomain] = useState("");
    const [dnsValid, setDnsValid] = useState<boolean | undefined>(undefined);

    // Resources
    const [selectedRam, setSelectedRam] = useState(game.recommendedRam || 4096);
    const [selectedCpu, setSelectedCpu] = useState(2);

    // Valheim specific settings
    const [valheimServerName, setValheimServerName] = useState("Valheim Server");
    const [worldName, setWorldName] = useState("Dedicated");
    const [serverPassword, setServerPassword] = useState("secret123");
    const [serverPublic, setServerPublic] = useState(true);
    const [crossplay, setCrossplay] = useState(false);
    const [updateCron, setUpdateCron] = useState("*/15 * * * *");
    const [restartCron, setRestartCron] = useState("10 5 * * *");
    const [backups, setBackups] = useState(true);
    const [backupsCron, setBackupsCron] = useState("5 * * * *");
    const [backupsMaxAge, setBackupsMaxAge] = useState(3);
    const [timezone, setTimezone] = useState("Etc/UTC");
    const [adminIds, setAdminIds] = useState("");
    const [bannedIds, setBannedIds] = useState("");
    const [permittedIds, setPermittedIds] = useState("");
    const [autoStart, setAutoStart] = useState(true);
    const [autoRestart, setAutoRestart] = useState(true);

    const handleDomainChange = useCallback((domainId: string, subdomain: string, isValid?: boolean) => {
        setDomainId(domainId || "");
        setSubdomain(subdomain || "");
        setDnsValid(isValid);
    }, []);

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return serverName.trim().length >= 3;
            case 2:
                return selectedRam >= game.minRam;
            case 3:
                return serverPassword.length >= 5 && worldName.trim().length > 0;
            default:
                return false;
        }
    };

    const handleCreate = async () => {
        if (serverPassword && serverPassword.length < 5) {
            toast.error("Server password must be at least 5 characters long!");
            return;
        }

        setLoading(true);

        // Check docker status again before creating
        const dockerStatus = await checkDockerStatus();
        if (!dockerStatus.online) {
            toast.error("Docker is not running. Please start Docker to create the server.");
            setLoading(false);
            return;
        }

        // Warning for DNS
        if (domainId && dnsValid === false) {
            if (!confirm("The selected domain doesn't appear to be pointing to this server. Do you want to continue anyway?")) {
                setLoading(false);
                return;
            }
        }

        const data = new FormData();
        data.append("name", serverName);
        data.append("gameSlug", game.slug);
        data.append("ramMb", selectedRam.toString());
        data.append("cpuCores", selectedCpu.toString());
        data.append("autoStart", autoStart.toString());
        data.append("autoRestart", autoRestart.toString());

        if (domainId) {
            data.append("domainId", domainId);
        }
        if (subdomain) {
            data.append("subdomain", subdomain);
        }

        const gameConfig = {
            serverName: valheimServerName,
            worldName,
            serverPassword,
            serverPublic,
            crossplay,
            updateCron,
            restartCron,
            backups,
            backupsCron,
            backupsMaxAge,
            timezone,
            adminIds,
            bannedIds,
            permittedIds,
        };

        data.append("gameConfig", JSON.stringify(gameConfig));

        const result = await createGameServer(data);

        setLoading(false);

        if ("error" in result) {
            toast.error(result.error);
        } else {
            toast.success("Valheim server created successfully!");
            router.push(`/servers/${result.serverId}`);
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
                                placeholder="Ex: My Valheim Server"
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
                            <DomainSelector onDomainChange={handleDomainChange} />
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
                                                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                            option.value < game.minRam && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={option.value < game.minRam}
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

            {/* Step 3: Valheim Settings */}
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
                        Valheim Settings
                    </h2>
                </div>

                {currentStep === 3 && (
                    <div className="space-y-6">
                        {/* World Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">World Configuration</h3>

                            <div>
                                <Label htmlFor="valheimServerName">Server Name</Label>
                                <Input
                                    id="valheimServerName"
                                    value={valheimServerName}
                                    onChange={(e) => setValheimServerName(e.target.value)}
                                    placeholder="My Valheim Server"
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Name shown in the server browser
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="worldName">World Name</Label>
                                    <Input
                                        id="worldName"
                                        value={worldName}
                                        onChange={(e) => setWorldName(e.target.value)}
                                        placeholder="Dedicated"
                                        className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Name of the world without .db/.fwl extension
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="serverPassword">Server Password</Label>
                                    <Input
                                        id="serverPassword"
                                        type="password"
                                        value={serverPassword}
                                        onChange={(e) => setServerPassword(e.target.value)}
                                        minLength={5}
                                        required
                                        className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Minimum 5 characters required
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="serverPublic">Public Server</Label>
                                        <p className="text-xs text-muted-foreground">List in server browser</p>
                                    </div>
                                    <Switch id="serverPublic" checked={serverPublic} onCheckedChange={setServerPublic} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="crossplay">Crossplay</Label>
                                        <p className="text-xs text-muted-foreground">Enable crossplay with Xbox/Microsoft Store</p>
                                    </div>
                                    <Switch id="crossplay" checked={crossplay} onCheckedChange={setCrossplay} />
                                </div>
                            </div>
                        </div>

                        {/* Automation & Backups */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Automation & Backups</h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="updateCron">Update Check Schedule (Cron)</Label>
                                    <Input
                                        id="updateCron"
                                        value={updateCron}
                                        onChange={(e) => setUpdateCron(e.target.value)}
                                        placeholder="*/15 * * * *"
                                        className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Default: Check every 15 minutes
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="restartCron">Restart Schedule (Cron)</Label>
                                    <Input
                                        id="restartCron"
                                        value={restartCron}
                                        onChange={(e) => setRestartCron(e.target.value)}
                                        placeholder="10 5 * * *"
                                        className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Default: Daily at 5:10 AM
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.01] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="backups">Enable Backups</Label>
                                        <p className="text-xs text-muted-foreground">Periodic world backups</p>
                                    </div>
                                    <Switch id="backups" checked={backups} onCheckedChange={setBackups} />
                                </div>

                                {backups && (
                                    <>
                                        <div>
                                            <Label htmlFor="backupsCron">Backup Schedule (Cron)</Label>
                                            <Input
                                                id="backupsCron"
                                                value={backupsCron}
                                                onChange={(e) => setBackupsCron(e.target.value)}
                                                placeholder="5 * * * *"
                                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Default: Every hour at 5 minutes past
                                            </p>
                                        </div>

                                        <div>
                                            <Label htmlFor="backupsMaxAge">Backup Retention (Days)</Label>
                                            <Input
                                                id="backupsMaxAge"
                                                type="number"
                                                min="1"
                                                value={backupsMaxAge}
                                                onChange={(e) => setBackupsMaxAge(parseInt(e.target.value))}
                                                className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input
                                    id="timezone"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    placeholder="Etc/UTC"
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    TZ database format (e.g., America/Sao_Paulo)
                                </p>
                            </div>
                        </div>

                        {/* Access Control */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Access Control (Optional)</h3>

                            <div>
                                <Label htmlFor="adminIds">Admin Steam IDs</Label>
                                <Input
                                    id="adminIds"
                                    value={adminIds}
                                    onChange={(e) => setAdminIds(e.target.value)}
                                    placeholder="76561198012345678 76561198087654321"
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Space-separated SteamID64 format
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="bannedIds">Banned Steam IDs</Label>
                                <Input
                                    id="bannedIds"
                                    value={bannedIds}
                                    onChange={(e) => setBannedIds(e.target.value)}
                                    placeholder="76561198012345678"
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                            </div>

                            <div>
                                <Label htmlFor="permittedIds">Whitelist Steam IDs</Label>
                                <Input
                                    id="permittedIds"
                                    value={permittedIds}
                                    onChange={(e) => setPermittedIds(e.target.value)}
                                    placeholder="76561198012345678 76561198087654321"
                                    className="mt-1.5 border-white/5 bg-white/[0.02] focus:border-primary/30"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    If set, only these players can join
                                </p>
                            </div>
                        </div>

                        {/* Auto Start/Restart */}
                        <div className="space-y-3 rounded-lg border border-white/5 bg-white/[0.01] p-4">
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
                            disabled={loading || !isStepValid(3)}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {loading ? (
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
