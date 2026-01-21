"use client";

import { useState } from "react";
import { Search, Filter, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GameCard } from "@/components/game-card";
import { useLayout } from "@/components/layout-context";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface GamesListProps {
    initialGames: any[];
    categories: string[];
}

export function GamesList({ initialGames, categories }: GamesListProps) {
    const { sidebarCollapsed } = useLayout();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filteredGames = initialGames.filter((game) => {
        const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || game.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className={cn("transition-all duration-300", sidebarCollapsed ? "-ml-56" : "")}>
            {/* Filters */}
            <div className="glass mb-6 flex flex-wrap items-center gap-4 rounded-xl p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 border-white/5 bg-white/[0.02] pl-10 focus:border-primary/30 focus:bg-white/[0.04]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                        value={selectedCategory || "all"}
                        onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="h-10 w-[180px] rounded-lg border-white/5 bg-white/[0.02] px-3">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent className="border-white/5 bg-background/80 backdrop-blur-xl">
                            <SelectItem value="all" className="focus:bg-white/10">All categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="focus:bg-white/10">{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-white/5 p-1">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded transition-colors",
                            viewMode === "grid" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded transition-colors",
                            viewMode === "list" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Games Grid/List */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredGames.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            isFavoriteInitial={game.isFavorite}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredGames.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            isFavoriteInitial={game.isFavorite}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            )}

            {filteredGames.length === 0 && (
                <div className="glass flex flex-col items-center justify-center rounded-xl py-16">
                    <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold text-foreground">No games found</h3>
                    <p className="text-muted-foreground">Try searching with different terms</p>
                </div>
            )}
        </div>
    );
}
