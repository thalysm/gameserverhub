"use client";

import { FeaturedCarousel } from "@/components/featured-carousel";
import { GameStoreGrid } from "@/components/game-store-grid";
import { MyServers } from "@/components/my-servers";
import { LayoutProvider } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";

function MainContent() {
  return (
    <AppLayout>
      <FeaturedCarousel />
      <MyServers />
      <GameStoreGrid />
    </AppLayout>
  );
}

export default function HomePage() {
  return (
    <LayoutProvider>
      <MainContent />
    </LayoutProvider>
  );
}
