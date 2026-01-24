"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal as TerminalIcon, Send, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { executeServerCommand, getServerLogs } from "@/actions/server-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ServerTerminalProps {
    serverId: string;
    isRunning: boolean;
}

export function ServerTerminal({ serverId, isRunning }: ServerTerminalProps) {
    const [command, setCommand] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadLogs = useCallback(async (silent = true) => {
        if (!silent) setIsRefreshing(true);
        try {
            const serverLogs = await getServerLogs(serverId, 100);
            if (serverLogs) {
                const logLines = serverLogs.split("\n").filter((line) => line.trim());
                setLogs(logLines);
            }
        } finally {
            if (!silent) setIsRefreshing(false);
        }
    }, [serverId]);

    useEffect(() => {
        loadLogs();

        if (isRunning) {
            // Poll every 2 seconds for a snappier feel
            const interval = setInterval(() => loadLogs(true), 2000);
            return () => clearInterval(interval);
        }
    }, [loadLogs, isRunning]);

    useEffect(() => {
        if (bottomRef.current?.parentElement) {
            bottomRef.current.parentElement.scrollTop = bottomRef.current.parentElement.scrollHeight;
        }
    }, [logs]);

    const handleExecuteCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim() || !isRunning || isExecuting) return;

        const currentCommand = command.trim();
        setIsExecuting(true);
        setCommand(""); // Clear input immediately

        // Optimistic log entry
        setLogs(prev => [...prev, `> ${currentCommand}`]);

        try {
            const result = await executeServerCommand(serverId, currentCommand);

            if (result.error) {
                toast.error(result.error);
            } else if (result.output) {
                // Refresh logs immediately to show server output
                await loadLogs(true);
            }
        } catch (error) {
            toast.error("Failed to execute command");
        } finally {
            setIsExecuting(false);
        }
    };

    const clearConsole = () => {
        setLogs([]);
    };

    return (
        <div className="glass flex h-[500px] flex-col rounded-xl overflow-hidden border border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-2">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Console</h3>
                    {isRunning && (
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => loadLogs(false)}
                        disabled={!isRunning || isRefreshing}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={clearConsole}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-black/20 p-4 font-mono text-[11px] sm:text-xs">
                {logs.length === 0 ? (
                    <p className="text-muted-foreground italic">
                        {isRunning ? "Waiting for logs..." : "Start the server to see real-time logs"}
                    </p>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={index}
                            className={cn(
                                "break-all",
                                log.startsWith(">")
                                    ? "text-primary font-bold mt-2"
                                    : log.toLowerCase().includes("error") || log.toLowerCase().includes("exception")
                                        ? "text-red-400 bg-red-400/5 px-1 rounded"
                                        : log.toLowerCase().includes("warn")
                                            ? "text-amber-400"
                                            : "text-foreground/70"
                            )}
                        >
                            {log}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <form
                onSubmit={handleExecuteCommand}
                className="border-t border-white/5 bg-white/[0.03] p-3"
            >
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono text-sm opacity-50">{">"}</span>
                        <Input
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder={isRunning ? "Type a command..." : "Server is offline"}
                            disabled={!isRunning || isExecuting}
                            className="w-full pl-8 border-white/10 bg-black/40 font-mono text-sm focus:border-primary/50 transition-all"
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!isRunning || !command.trim() || isExecuting}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
