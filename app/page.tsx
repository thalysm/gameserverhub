import { FeaturedCarousel } from "@/components/featured-carousel";
import { GameStoreGrid } from "@/components/game-store-grid";
import { MyServers } from "@/components/my-servers";
import { AppLayout } from "@/components/app-layout";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { LayoutProvider } from "@/components/layout-context";

export const dynamic = "force-dynamic";

async function getGamesWithFavorites() {
  const userId = await verifySession();
  const games = await db.game.findMany({
    orderBy: { name: "asc" },
    take: 6
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

export default async function HomePage() {
  const hasUser = await db.user.findFirst();

  if (!hasUser) {
    redirect("/setup");
  }

  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  const games = await getGamesWithFavorites();

  return (
    <LayoutProvider>
      <AppLayout>
        <FeaturedCarousel />
        <MyServers />
        <GameStoreGrid games={games} />
      </AppLayout>
    </LayoutProvider>
  );
}
