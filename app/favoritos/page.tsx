"use client";

import { Heart, Plus, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
// import { StoreSidebar } from "@/components/store-sidebar";
// import { StoreHeader } from "@/components/store-header";
import { LayoutProvider, useLayout } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import Link from "next/link";
import { getGameCover } from "@/lib/games-data";

const favoriteGames = [
  {
    id: 2,
    slug: "cs2",
    name: "Counter-Strike 2",
    image: "/games/cs2.jpg",
    category: "FPS",
    description: "Servidores competitivos com anti-cheat e configurações avançadas.",
    supportsTcp: false,
    supportsUdp: true,
    defaultPort: 27015,
    serversCreated: 2,
  },
  {
    id: 5,
    slug: "valheim",
    name: "Valheim",
    image: "/games/valheim.jpg",
    category: "Survival",
    description: "Mundos Viking para explorar com seus amigos em co-op.",
    supportsTcp: false,
    supportsUdp: true,
    defaultPort: 2456,
    serversCreated: 1,
  },
];

function FavoriteGameCard({
  game,
  onRemove,
}: {
  game: (typeof favoriteGames)[0];
  onRemove: (id: number) => void;
}) {
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
          onClick={() => onRemove(game.id)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-red-500/50"
          title="Remover dos favoritos"
        >
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
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
          {game.serversCreated > 0 && (
            <p className="mb-3 text-xs text-primary">
              {game.serversCreated} servidor{game.serversCreated > 1 ? "es" : ""} criado{game.serversCreated > 1 ? "s" : ""}
            </p>
          )}

          <Button
            size="sm"
            className="w-full bg-primary/20 text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="mr-1 h-4 w-4" />
            Criar Servidor
          </Button>
        </div>
      </div>
    </div>
  );
}

function FavoritosContent() {
  const { sidebarCollapsed } = useLayout();
  const [favorites, setFavorites] = useState(favoriteGames);

  const handleRemove = (id: number) => {
    setFavorites((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold text-foreground">Favoritos</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Seus jogos favoritos para acesso rápido
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favorites.map((game) => (
            <FavoriteGameCard key={game.id} game={game} onRemove={handleRemove} />
          ))}
        </div>
      ) : (
        <div className="glass flex flex-col items-center justify-center rounded-xl py-16">
          <HeartOff className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhum favorito</h3>
          <p className="mb-4 text-center text-muted-foreground">
            Adicione jogos aos favoritos para acessá-los rapidamente
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Explorar Jogos</Link>
          </Button>
        </div>
      )}
    </AppLayout>
  );
}

export default function FavoritosPage() {
  return (
    <LayoutProvider>
      <FavoritosContent />
    </LayoutProvider>
  );
}
