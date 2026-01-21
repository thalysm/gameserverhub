import { Suspense } from "react";
import { StoreSidebar } from "@/components/store-sidebar";
import { StoreHeader } from "@/components/store-header";
import { LayoutProvider } from "@/components/layout-context";
import { GamesList } from "@/components/games-list";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";

async function getGamesWithFavorites() {
  const userId = await verifySession();
  const games = await db.game.findMany({
    orderBy: { name: "asc" }
  });

  const favorites = userId
    ? await db.favorite.findMany({ where: { userId } })
    : [];

  const favoriteIds = new Set(favorites.map((f: any) => f.gameId));

  return games.map((game: any) => ({
    ...game,
    isFavorite: favoriteIds.has(game.id)
  }));
}

export default async function JogosPage() {
  const games = await getGamesWithFavorites();
  const categories = Array.from(new Set(games.map((g: any) => g.category)));

  return (
    <LayoutProvider>
      <div className="flex min-h-screen bg-background">
        <StoreSidebar />
        <div className="flex-1 transition-all duration-300 ml-72">
          <StoreHeader />
          <main className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Supported Games</h1>
              <p className="text-muted-foreground">
                {games.length} games available to create dedicated servers
              </p>
            </div>

            <Suspense fallback={<div>Loading games...</div>}>
              <GamesList initialGames={games} categories={categories as string[]} />
            </Suspense>
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
