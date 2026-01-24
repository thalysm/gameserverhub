"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { games, getGameBanner } from "@/lib/games-data";

// Define types locally or import
interface FeaturedGame {
  slug: string;
  name: string;
  tag: string;
  description: string;
  features: string[];
  image?: string; // Add this
}

const featuredGames: any[] = [ // Using any[] to bypass strict check for now as we enrich data
  {
    ...games.find((g) => g.slug === "minecraft")!,
    tag: "Most Popular",
  },
  {
    ...games.find((g) => g.slug === "cs2")!,
    tag: "Competitive",
  },
  {
    ...games.find((g) => g.slug === "palworld")!,
    tag: "Survival",
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
  // Logic to determine banner URL: if game.image exists (from DB), try to derive banner or use fallback
  // Since featuredGames is static here, we might need to pass dynamic data or just use the helper which we can update
  const bannerSrc = getGameBanner(game.slug);

  return (
    <section className="relative mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Featured</h2>

      <div className="glass relative overflow-hidden rounded-xl">
        <div className="relative aspect-[28/7] w-full">
          <Image
            src={bannerSrc}
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
                <Link href={`/create-server/${game.slug}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Server
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass border-white/10 bg-transparent text-foreground hover:bg-white/10">
                <Link href="/games">
                  <Globe className="mr-2 h-4 w-4" />
                  View All
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
