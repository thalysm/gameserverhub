"use client";

import { LayoutGrid, Plus, Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { getGameCover } from "@/lib/games-data";

interface Game {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    supportsTcp: boolean;
    supportsUdp: boolean;
    category: string;
}

interface Category {
    id: string;
    name: string;
    description: string;
    games: Game[];
}

interface CategoriesContentProps {
    categories: Category[];
}

function GameMiniCard({ game }: { game: Game }) {
    const [isFavorite, setIsFavorite] = useState(false);

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
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60"
                >
                    <Heart
                        className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isFavorite ? "fill-red-500 text-red-500" : "text-white"
                        )}
                    />
                </button>

                <div className="absolute left-2 top-2 flex gap-1">
                    {game.supportsTcp && (
                        <span className="rounded bg-blue-500/80 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                            TCP
                        </span>
                    )}
                    {game.supportsUdp && (
                        <span className="rounded bg-green-500/80 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                            UDP
                        </span>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-foreground line-clamp-1">
                        {game.name}
                    </h4>
                    <Button
                        asChild
                        size="sm"
                        className="h-8 w-full bg-primary/20 text-xs text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
                    >
                        <Link href={`/create-server/${game.slug}`}>
                            <Plus className="mr-1 h-3 w-3" />
                            Create
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CategorySection({ category }: { category: Category }) {
    return (
        <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                    View all
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {category.games.map((game) => (
                    <GameMiniCard key={game.id} game={game} />
                ))}
            </div>
        </section>
    );
}

export function CategoriesContent({ categories }: CategoriesContentProps) {
    const totalGames = categories.reduce((acc, cat) => acc + cat.games.length, 0);

    return (
        <AppLayout>
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                </div>
                <p className="mt-1 text-muted-foreground">
                    {categories.length} categories, {totalGames} available games
                </p>
            </div>

            {/* Quick category pills */}
            <div className="mb-6 flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            const element = document.getElementById(cat.id);
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="glass glass-hover rounded-full px-4 py-2 text-sm text-foreground transition-all"
                    >
                        {cat.name}
                        <span className="ml-2 text-muted-foreground">({cat.games.length})</span>
                    </button>
                ))}
            </div>

            {/* Category sections */}
            {categories.map((category) => (
                <div key={category.id} id={category.id} className="scroll-mt-20">
                    <CategorySection category={category} />
                </div>
            ))}
        </AppLayout>
    );
}
