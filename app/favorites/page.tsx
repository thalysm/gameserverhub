import { Heart, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutProvider } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import Link from "next/link";
import { GameCard } from "@/components/game-card";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

async function getFavorites() {
  const userId = await verifySession();
  if (!userId) {
    redirect("/login");
  }

  const favorites = await db.favorite.findMany({
    where: { userId },
    include: {
      game: true,
    },
  });

  return favorites.map((f: any) => ({
    ...f.game,
    isFavorite: true
  }));
}

export default async function FavoritosPage() {
  const favorites = await getFavorites();

  return (
    <LayoutProvider>
      <AppLayout>
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Your favorite games for quick access
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {favorites.map((game: any) => (
              <GameCard
                key={game.id}
                game={game}
                isFavoriteInitial={true}
              />
            ))}
          </div>
        ) : (
          <div className="glass flex flex-col items-center justify-center rounded-xl py-16">
            <HeartOff className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No favorites</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Add games to favorites to access them quickly
            </p>
            <Button variant="outline" asChild>
              <Link href="/games">Explore Games</Link>
            </Button>
          </div>
        )}
      </AppLayout>
    </LayoutProvider>
  );
}
