"use client";

import { useState } from "react";
import { Plus, Heart, Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StoreSidebar } from "@/components/store-sidebar";
import { StoreHeader } from "@/components/store-header";
import { LayoutProvider, useLayout } from "@/components/layout-context";
import { games, getCategories, getGameCover, type Game } from "@/lib/games-data";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function GameCard({ game, viewMode }: { game: Game; viewMode: "grid" | "list" }) {
  const [isFavorite, setIsFavorite] = useState(game.favorite);

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
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : ""
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
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-white"
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

function JogosContent() {
  const { sidebarCollapsed } = useLayout();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = getCategories();

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <StoreSidebar />
      <div className={cn("flex-1 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-72")}>
        <StoreHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Supported Games</h1>
            <p className="text-muted-foreground">
              {games.length} games available to create dedicated servers
            </p>
          </div>

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
                <GameCard key={game.id} game={game} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} viewMode={viewMode} />
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
        </main>
      </div>
    </div>
  );
}

function Loading() {
  return null;
}

export default function JogosPage() {
  return (
    <LayoutProvider>
      <Suspense fallback={<Loading />}>
        <JogosContent />
      </Suspense>
    </LayoutProvider>
  );
}
