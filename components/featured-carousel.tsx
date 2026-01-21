"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { games, getGameBanner } from "@/lib/games-data";

const featuredGames = [
  {
    ...games.find((g) => g.slug === "minecraft")!,
    tag: "Mais Popular",
  },
  {
    ...games.find((g) => g.slug === "cs2")!,
    tag: "Competitivo",
  },
  {
    ...games.find((g) => g.slug === "palworld")!,
    tag: "Sobrevivência",
  },
];

export function FeaturedCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featuredGames.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const game = featuredGames[current];

  return (
    <section className="relative mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Destaque</h2>

      <div className="glass relative overflow-hidden rounded-xl">
        <div className="relative aspect-[21/9] w-full">
          <Image
            src={getGameBanner(game.slug)}
            alt={game.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 p-8">
            <span className="glass mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium text-primary">
              {game.tag}
            </span>
            <h3 className="mb-2 text-3xl font-bold text-foreground">
              {game.name}
            </h3>
            <p className="mb-4 max-w-lg text-sm text-muted-foreground">
              {game.description}
            </p>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {game.features.slice(0, 3).map((feature) => (
                <span
                  key={feature}
                  className="glass rounded-full px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href={`/criar-servidor/${game.slug}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Servidor
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass border-white/10 bg-transparent text-foreground hover:bg-white/10">
                <Link href="/jogos">
                  <Globe className="mr-2 h-4 w-4" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            setCurrent(
              (prev) =>
                (prev - 1 + featuredGames.length) % featuredGames.length
            )
          }
          className="glass glass-hover absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() =>
            setCurrent((prev) => (prev + 1) % featuredGames.length)
          }
          className="glass glass-hover absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {featuredGames.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === current
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
