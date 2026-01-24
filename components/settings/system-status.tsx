"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    ShieldCheck,
    ShieldAlert,
    Loader2,
    RefreshCw,
    Info,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkDockerStatus } from "@/actions/system-actions";
import { getRouterUPnPStatus } from "@/actions/settings-actions";

export function SystemStatus() {
    const [status, setStatus] = useState<{ online: boolean; upnp: boolean; loading: boolean; error?: string }>({
        online: false,
        upnp: false,
        loading: true
    });

    const checkStatus = async () => {
        setStatus(prev => ({ ...prev, loading: true }));
        const [docker, upnp] = await Promise.all([
            checkDockerStatus(),
            getRouterUPnPStatus()
        ]);
        setStatus({
            online: docker.online,
            upnp: upnp,
            loading: false,
            error: docker.error
        });
    };

    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <Activity className="h-5 w-5 text-primary" />
                        System Status
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Check if required services are operational.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkStatus}
                    disabled={status.loading}
                    className="h-8 w-8 p-0"
                >
                    <RefreshCw className={cn("h-4 w-4", status.loading && "animate-spin")} />
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Docker Engine Card */}
                <div className="glass flex items-center justify-between rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            status.loading ? "bg-muted" : (status.online ? "bg-green-500/10" : "bg-red-500/10")
                        )}>
                            {status.loading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : status.online ? (
                                <ShieldCheck className="h-5 w-5 text-green-500" />
                            ) : (
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Docker Engine</p>
                            <p className={cn(
                                "text-xs",
                                status.loading ? "text-muted-foreground" : (status.online ? "text-green-500" : "text-red-500")
                            )}>
                                {status.loading ? "Checking..." : (status.online ? "Operational" : "Offline")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Database Card */}
                <div className="glass flex items-center justify-between rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Database</p>
                            <p className="text-xs text-blue-500">Connected (SQLite)</p>
                        </div>
                    </div>
                </div>

                {/* Router/UPnP Card */}
                <div className="glass flex items-center justify-between rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            status.loading ? "bg-muted" : (status.upnp ? "bg-primary/10" : "bg-red-500/10")
                        )}>
                            <Globe className={cn("h-5 w-5", status.upnp ? "text-primary" : "text-red-500")} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Modem (UPnP)</p>
                            <p className={cn(
                                "text-xs",
                                status.loading ? "text-muted-foreground" : (status.upnp ? "text-primary font-bold" : "text-red-500")
                            )}>
                                {status.loading ? "Checking..." : (status.upnp ? "Forwarding Active" : "Not detected")}
                            </p>
                        </div>
                    </div>
                    {status.upnp && !status.loading && (
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="System ready to open ports" />
                    )}
                </div>
            </div>

            {!status.loading && !status.online && (
                <div className="glass flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <p className="font-semibold">Docker Error</p>
                        <p className="text-xs opacity-80">{status.error}</p>
                        <p className="mt-2 text-xs">
                            Ensure Docker Desktop is open and running on your computer.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
