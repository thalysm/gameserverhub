"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GameCard } from "@/components/game-card";

interface GameStoreGridProps {
  games: any[];
}

export function GameStoreGrid({ games }: GameStoreGridProps) {
  // Show only the first 6 games on the homepage
  const displayedGames = games.slice(0, 6);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Available Games
        </h2>
        <Button
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/games">View all</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {displayedGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isFavoriteInitial={game.isFavorite}
          />
        ))}
      </div>
    </section>
  );
}
