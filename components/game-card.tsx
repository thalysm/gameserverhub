"use client";

import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toggleFavorite } from "@/actions/game-actions";
import { toast } from "sonner";
import { getGameCover } from "@/lib/games-data";

interface GameCardProps {
    game: {
        id: string;
        slug: string;
        name: string;
        category: string;
        description: string;
        defaultPort: number;
        minRam: number;
        supportsTcp: boolean;
        supportsUdp: boolean;
    };
    isFavoriteInitial: boolean;
    viewMode?: "grid" | "list";
}

export function GameCard({ game, isFavoriteInitial, viewMode = "grid" }: GameCardProps) {
    const [isFav, setIsFav] = useState(isFavoriteInitial);
    const [loading, setLoading] = useState(false);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        const result = await toggleFavorite(game.id);
        setLoading(false);

        if ("error" in result) {
            toast.error(result.error);
        } else {
            setIsFav(result.action === "added");
            toast.success(result.action === "added" ? "Added to favorites" : "Removed from favorites");
        }
    };

    if (viewMode === "list") {
        return (
            <div className="glass glass-hover flex items-center gap-4 rounded-xl p-4 transition-all">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image
                        src={getGameCover(game.slug)}
                        alt={game.name}
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{game.name}</h3>
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                            {game.category}
                        </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{game.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Port: {game.defaultPort}</span>
                        <span>RAM Min: {game.minRam}MB</span>
                        {game.supportsTcp && <span className="text-blue-400">TCP</span>}
                        {game.supportsUdp && <span className="text-green-400">UDP</span>}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleFavorite}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Heart
                            className={cn(
                                "h-5 w-5 transition-colors",
                                isFav ? "fill-red-500 text-red-500" : ""
                            )}
                        />
                    </button>
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href={`/create-server/${game.slug}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Server
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass glass-hover group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                    src={getGameCover(game.slug)}
                    alt={game.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                <button
                    onClick={handleToggleFavorite}
                    disabled={loading}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60"
                >
                    <Heart
                        className={cn(
                            "h-4 w-4 transition-colors",
                            isFav ? "fill-red-500 text-red-500" : "text-white"
                        )}
                    />
                </button>

                <div className="absolute left-3 top-3 flex gap-1.5">
                    {game.supportsTcp && (
                        <span className="rounded bg-blue-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            TCP
                        </span>
                    )}
                    {game.supportsUdp && (
                        <span className="rounded bg-green-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            UDP
                        </span>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="mb-1 text-xs font-medium text-primary">{game.category}</span>
                    <h3 className="mb-1 text-lg font-semibold text-foreground">{game.name}</h3>
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{game.description}</p>
                    <p className="mb-3 font-mono text-xs text-muted-foreground">Port: {game.defaultPort}</p>

                    <Button
                        asChild
                        size="sm"
                        className="w-full bg-primary/20 text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
                    >
                        <Link href={`/create-server/${game.slug}`}>
                            <Plus className="mr-1 h-4 w-4" />
                            Create Server
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
