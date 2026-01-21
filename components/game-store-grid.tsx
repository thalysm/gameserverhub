"use client";

import { Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { games, type Game } from "@/lib/games-data";

function GameCard({ game }: { game: Game }) {
  const [isFavorite, setIsFavorite] = useState(game.favorite);

  return (
    <div className="glass glass-hover group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={game.image || "/placeholder.svg"}
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
          <span className="mb-1 text-xs font-medium text-primary">
            {game.category}
          </span>
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            {game.name}
          </h3>
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {game.description}
          </p>
          <p className="mb-3 font-mono text-xs text-muted-foreground">
            Porta: {game.defaultPort}
          </p>

          <Button
            asChild
            size="sm"
            className="w-full bg-primary/20 text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
          >
            <Link href={`/criar-servidor/${game.slug}`}>
              <Plus className="mr-1 h-4 w-4" />
              Criar Servidor
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GameStoreGrid() {
  // Show only the first 6 games on the homepage
  const displayedGames = games.slice(0, 6);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Jogos Disponíveis
        </h2>
        <Button 
          variant="ghost" 
          className="text-sm text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/jogos">Ver todos</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {displayedGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
