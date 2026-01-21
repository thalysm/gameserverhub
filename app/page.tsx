import { FeaturedCarousel } from "@/components/featured-carousel";
import { GameStoreGrid } from "@/components/game-store-grid";
import { MyServers } from "@/components/my-servers";
import { AppLayout } from "@/components/app-layout";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

function MainContent() {
  return (
    <AppLayout>
      <FeaturedCarousel />
      <MyServers />
      <GameStoreGrid />
    </AppLayout>
  );
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

  return (
    <MainContent />
  );
}
