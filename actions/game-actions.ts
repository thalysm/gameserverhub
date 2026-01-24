"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getGamesGroupedByCategory() {
    const games = await db.game.findMany({
        orderBy: { name: "asc" }
    });

    const categoriesMap: Record<string, any> = {};

    games.forEach((game) => {
        if (!categoriesMap[game.category]) {
            categoriesMap[game.category] = {
                id: game.category.toLowerCase().replace(/\s+/g, '-'),
                name: game.category,
                description: `${game.category} games`,
                games: []
            };
        }
        categoriesMap[game.category].games.push(game);
    });

    return Object.values(categoriesMap);
}

export async function toggleFavorite(gameId: string) {
    const userId = await verifySession();

    if (!userId) {
        return { error: "You must be logged in to favorite games." };
    }

    const existing = await db.favorite.findUnique({
        where: {
            userId_gameId: {
                userId,
                gameId,
            },
        },
    });

    if (existing) {
        await db.favorite.delete({
            where: {
                id: existing.id,
            },
        });
        revalidatePath("/games");
        revalidatePath("/");
        return { action: "removed" };
    } else {
        await db.favorite.create({
            data: {
                userId,
                gameId,
            },
        });
        revalidatePath("/games");
        revalidatePath("/");
        return { action: "added" };
    }
}
