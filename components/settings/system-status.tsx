"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    ShieldCheck,
    ShieldAlert,
    Loader2,
    RefreshCw,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkDockerStatus } from "@/actions/system-actions";

export function SystemStatus() {
    const [status, setStatus] = useState<{ online: boolean; loading: boolean; error?: string }>({
        online: false,
        loading: true
    });

    const checkStatus = async () => {
        setStatus(prev => ({ ...prev, loading: true }));
        const result = await checkDockerStatus();
        setStatus({
            online: result.online,
            loading: false,
            error: result.error
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
                        Status do Sistema
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Verifique se os serviços necessários estão operacionais.
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

            <div className="grid gap-4 sm:grid-cols-2">
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
                                {status.loading ? "Verificando..." : (status.online ? "Operacional" : "Offline")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass flex items-center justify-between rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Database</p>
                            <p className="text-xs text-blue-500">Conectado (SQLite)</p>
                        </div>
                    </div>
                </div>
            </div>

            {!status.loading && !status.online && (
                <div className="glass flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <p className="font-semibold">Erro no Docker</p>
                        <p className="text-xs opacity-80">{status.error}</p>
                        <p className="mt-2 text-xs">
                            Certifique-se de que o Docker Desktop está aberto e funcionando no seu computador.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
