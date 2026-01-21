"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, File, Upload, Download, Trash2, RefreshCw, ChevronRight, FileCode, HardDrive, Archive, AlertCircle, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listServerFiles, uploadFileToServer, deleteServerFile, downloadWorld, uploadWorld } from "@/actions/config-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileManagerProps {
    serverId: string;
    isRunning: boolean;
}

interface FileItem {
    name: string;
    type: "file" | "directory";
    size: number;
    permissions: string;
}

export function FileManager({ serverId, isRunning }: FileManagerProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState("/data");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const loadFiles = useCallback(async (path: string) => {
        if (!isRunning) return;
        setLoading(true);
        try {
            const result = await listServerFiles(serverId, path);
            if (result.error) {
                toast.error(result.error);
            } else {
                setFiles(result.files || []);
                setCurrentPath(path);
            }
        } catch (error) {
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [serverId, isRunning]);

    useEffect(() => {
        loadFiles(currentPath);
    }, [loadFiles, currentPath]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                const buffer = Buffer.from(reader.result as ArrayBuffer);
                const result = await uploadFileToServer(serverId, buffer, file.name, currentPath);

                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success(`File ${file.name} uploaded!`);
                    loadFiles(currentPath);
                }
            } catch (error) {
                toast.error("Failed to upload file");
            } finally {
                setUploading(false);
            }
        };

        reader.readAsArrayBuffer(file);
        e.target.value = ''; // Reset input
    };

    const handleWorldUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!confirm("This will replace your current world. Are you sure?")) return;

        setUploading(true);
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                const base64 = (reader.result as string).split(',')[1];
                const result = await uploadWorld(serverId, base64);

                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success(`World uploaded! Restart the server to apply changes.`);
                    loadFiles(currentPath);
                }
            } catch (error) {
                toast.error("Failed to upload world");
            } finally {
                setUploading(false);
            }
        };

        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleDownloadWorld = async () => {
        setLoading(true);
        toast.loading("Preparing world download...", { id: "download-world" });
        try {
            const result = await downloadWorld(serverId);
            if (result.error) {
                toast.error(result.error, { id: "download-world" });
            } else if (result.base64) {
                const link = document.createElement("a");
                link.href = `data:application/x-tar;base64,${result.base64}`;
                link.download = `world-${serverId}-${Date.now()}.tar`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("World downloaded!", { id: "download-world" });
            }
        } catch (error) {
            toast.error("Failed to download world", { id: "download-world" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

        try {
            const fullPath = `${currentPath}/${fileName}`.replace(/\/+/g, "/");
            const result = await deleteServerFile(serverId, fullPath);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("File deleted");
                loadFiles(currentPath);
            }
        } catch (error) {
            toast.error("Failed to delete file");
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "-";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="flex flex-col gap-6">
            {/* World Management Card */}
            <div className="glass rounded-xl p-6 border border-primary/20 bg-primary/5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Archive className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-foreground">World Management</h4>
                            <p className="text-xs text-muted-foreground">Download or replace your entire world directory</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleDownloadWorld}
                            disabled={!isRunning || loading}
                            className="bg-white/5 border-white/10 hover:bg-white/10 h-10 px-6"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download World
                        </Button>

                        <label htmlFor="world-upload">
                            <Button
                                variant="default"
                                disabled={!isRunning || uploading}
                                asChild
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
                            >
                                <div className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploading ? "Uploading..." : "Replace World"}
                                </div>
                            </Button>
                        </label>
                        <input
                            id="world-upload"
                            type="file"
                            accept=".tar"
                            className="hidden"
                            onChange={handleWorldUpload}
                        />
                    </div>
                </div>

                {!isRunning && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-amber-500 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>The server must be online to perform world management actions.</span>
                    </div>
                )}
            </div>

            {/* Main File Manager */}
            <div className="glass rounded-xl overflow-hidden flex flex-col h-[600px] border border-white/5">
                {/* Toolbar */}
                <div className="border-b border-white/5 bg-white/[0.02] p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (currentPath === "/data") return;
                                const parts = currentPath.split("/").filter(Boolean);
                                parts.pop();
                                setCurrentPath("/" + parts.join("/"));
                            }}
                            disabled={currentPath === "/data" || loading}
                            className="shrink-0"
                        >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                        </Button>
                        <div className="flex items-center bg-black/40 rounded-lg px-3 py-1.5 border border-white/5 flex-1 overflow-hidden">
                            <Folder className="h-4 w-4 text-primary mr-2 shrink-0" />
                            <span className="text-sm font-mono truncate text-muted-foreground">{currentPath}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => loadFiles(currentPath)}
                            disabled={loading || !isRunning}
                            className="h-10 w-10 border-white/10"
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>

                        <label htmlFor="file-upload">
                            <Button variant="outline" className="h-10 border-white/10 hover:bg-white/5" disabled={!isRunning || uploading} asChild>
                                <div className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploading ? "Uploading..." : "Add File"}
                                </div>
                            </Button>
                        </label>
                        <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-auto">
                    {!isRunning ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <HardDrive className="mb-4 h-16 w-16 text-muted-foreground/10" />
                            <h3 className="text-xl font-bold text-muted-foreground/40">Storage Inactive</h3>
                            <p className="text-sm text-muted-foreground/40 max-w-xs mt-2">
                                Connect your server to browse and manage persistent storage.
                            </p>
                        </div>
                    ) : loading && files.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                            <span className="text-sm text-muted-foreground">Syncing files...</span>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <Folder className="mb-4 h-16 w-16 text-muted-foreground/10" />
                            <p className="text-sm text-muted-foreground">This directory appears to be empty.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#070707]/90 border-b border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4">Permissions</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {files.map((file) => (
                                    <tr
                                        key={file.name}
                                        className="hover:bg-primary/5 transition-all duration-200 group border-l-2 border-l-transparent hover:border-l-primary"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {file.type === "directory" ? (
                                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                        <Folder className="h-4 w-4 text-primary fill-primary/20" />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center">
                                                        <FileCode className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (file.type === "directory") {
                                                            const newPath = `${currentPath}/${file.name}`.replace(/\/+/g, "/");
                                                            setCurrentPath(newPath);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "text-sm font-semibold transition-colors",
                                                        file.type === "directory" ? "hover:text-primary underline-offset-4 hover:underline cursor-pointer" : "text-foreground"
                                                    )}
                                                >
                                                    {file.name}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                            {file.type === "file" ? formatSize(file.size) : "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[10px] px-1.5 py-0.5 border border-white/10 bg-white/5 rounded text-muted-foreground/60">
                                                {file.permissions}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                                    onClick={() => handleDelete(file.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer info bar */}
                <div className="border-t border-white/5 bg-white/[0.01] px-6 py-3 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-4">
                        <span>{files.length} items found</span>
                        <span className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            Server Connection Established
                        </span>
                    </div>
                    <span className="hidden sm:inline">Path: {currentPath}</span>
                </div>
            </div>
        </div>
    );
}
