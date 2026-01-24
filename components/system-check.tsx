"use client";

import { useEffect, useState } from "react";
import { checkDockerStatus } from "@/actions/system-actions";
import { AlertCircle, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function SystemCheck() {
    const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
    const [error, setError] = useState<string | null>(null);

    const check = async () => {
        setStatus('loading');
        const result = await checkDockerStatus();
        if (result.online) {
            setStatus('online');
            setError(null);
        } else {
            setStatus('offline');
            setError(result.error || "Docker is not reachable");
        }
    };

    useEffect(() => {
        check();
    }, []);

    if (status === 'online') {
        return (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Docker Engine is running and ready.</span>
            </div>
        );
    }

    if (status === 'offline') {
        return (
            <div className="flex flex-col gap-3 rounded-lg bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold text-red-500">Docker is Offline</p>
                        <p className="mt-1 opacity-80">{error}</p>
                        <p className="mt-2 text-[10px] uppercase font-bold tracking-wider">Please start Docker to create or manage servers.</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={check}
                    className="w-fit h-7 text-[10px] border-red-500/30 hover:bg-red-500/10 text-red-400"
                >
                    <RefreshCcw className="mr-1.5 h-3 w-3" />
                    Retry Check
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3 text-xs text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking system status...</span>
        </div>
    );
}

export function useDockerStatus() {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            const result = await checkDockerStatus();
            setIsOnline(result.online);
        };
        check();
    }, []);

    return isOnline;
}
