"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, File, Upload, Download, Trash2, RefreshCw, ChevronRight, FileCode, HardDrive, Archive, AlertCircle, FileArchive, Edit3, X, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listServerFiles, uploadFileToServer, deleteServerFile, downloadWorld, uploadWorld, readTextFileFromServer, saveTextFileToServer, downloadFileFromServer } from "@/actions/config-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileManagerProps {
    serverId: string;
    isRunning: boolean;
    gameSlug: string;
}

interface FileItem {
    name: string;
    type: "file" | "directory";
    size: number;
    permissions: string;
}

const EDITABLE_EXTENSIONS = [".txt", ".cfg", ".json", ".properties", ".yml", ".yaml", ".sh", ".log", ".lua", ".vdf"];

export function FileManager({ serverId, isRunning, gameSlug }: FileManagerProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState("");
    const [rootPath, setRootPath] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const loadFiles = useCallback(async (path?: string) => {
        if (!isRunning) return;
        setLoading(true);
        try {
            const result = await listServerFiles(serverId, path);
            if (result.error) {
                toast.error(result.error);
            } else {
                setFiles(result.files || []);
                setCurrentPath(result.currentPath || "");
                if (!rootPath) setRootPath(result.rootPath || "");
            }
        } catch (error) {
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [serverId, isRunning, rootPath]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

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

    const isEditable = (fileName: string) => {
        return EDITABLE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    const handleEditFile = async (fileName: string) => {
        const fullPath = `${currentPath}/${fileName}`.replace(/\/+/g, "/");
        setLoading(true);
        try {
            const result = await readTextFileFromServer(serverId, fullPath);
            if (result.error) {
                toast.error(result.error);
            } else {
                setEditingFile(fullPath);
                setEditContent(result.content || "");
            }
        } catch (error) {
            toast.error("Failed to read file");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFile = async () => {
        if (!editingFile) return;
        setIsSaving(true);
        try {
            const result = await saveTextFileToServer(serverId, editingFile, editContent);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("File saved successfully!");
                setEditingFile(null);
                loadFiles(currentPath);
            }
        } catch (error) {
            toast.error("Failed to save file");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadFile = async (fileName: string) => {
        const fullPath = `${currentPath}/${fileName}`.replace(/\/+/g, "/");
        try {
            const result = await downloadFileFromServer(serverId, fullPath);
            if (result.error) {
                toast.error(result.error);
            } else if (result.base64) {
                const link = document.createElement("a");
                link.href = `data:application/octet-stream;base64,${result.base64}`;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            toast.error("Failed to download file");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* World Management Card - Only for Minecraft */}
            {gameSlug === "minecraft" && (
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
            )}

            {/* Main File Manager */}
            <div className="glass rounded-xl overflow-hidden flex flex-col h-[600px] border border-white/5">
                {/* Toolbar */}
                <div className="border-b border-white/5 bg-white/[0.02] p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (currentPath === rootPath) return;
                                const parts = currentPath.split("/").filter(Boolean);
                                parts.pop();
                                setCurrentPath("/" + parts.join("/"));
                            }}
                            disabled={currentPath === rootPath || loading}
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

                {/* Content View: Editor or File List */}
                <div className="flex-1 overflow-hidden relative">
                    {editingFile ? (
                        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="border-b border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-mono truncate">{editingFile}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSaveFile}
                                        disabled={isSaving}
                                        className="h-8 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
                                    >
                                        <Save className="mr-2 h-3.5 w-3.5" />
                                        {isSaving ? "Saving..." : "Salvar"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingFile(null)}
                                        className="h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 p-4 overflow-hidden">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full h-full bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:border-primary/50 custom-scrollbar text-foreground"
                                    spellCheck={false}
                                    placeholder="Carregando conteúdo..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-auto">
                            {!isRunning ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <HardDrive className="mb-4 h-16 w-16 text-muted-foreground/10" />
                                    <h3 className="text-xl font-bold text-muted-foreground/40">Armazenamento Inativo</h3>
                                    <p className="text-sm text-muted-foreground/40 max-w-xs mt-2">
                                        Conecte seu servidor para navegar e gerenciar o armazenamento persistente.
                                    </p>
                                </div>
                            ) : loading && files.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                                    <span className="text-sm text-muted-foreground">Sincronizando arquivos...</span>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <Folder className="mb-4 h-16 w-16 text-muted-foreground/10" />
                                    <p className="text-sm text-muted-foreground">Este diretório parece estar vazio.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-[#070707]/90 border-b border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] backdrop-blur-md z-10">
                                        <tr>
                                            <th className="px-6 py-4">Nome</th>
                                            <th className="px-6 py-4">Tamanho</th>
                                            <th className="px-6 py-4">Permissões</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
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
                                                                } else if (isEditable(file.name)) {
                                                                    handleEditFile(file.name);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "text-sm font-semibold transition-colors text-left",
                                                                file.type === "directory"
                                                                    ? "hover:text-primary underline-offset-4 hover:underline cursor-pointer"
                                                                    : isEditable(file.name)
                                                                        ? "hover:text-primary cursor-pointer"
                                                                        : "text-foreground cursor-default"
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
                                                        {file.type === "file" && isEditable(file.name) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                                                onClick={() => handleEditFile(file.name)}
                                                                title="Editar Arquivo"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {file.type === "file" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                                                                onClick={() => handleDownloadFile(file.name)}
                                                                title="Baixar Arquivo"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                                            onClick={() => handleDelete(file.name)}
                                                            title="Excluir Arquivo"
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
