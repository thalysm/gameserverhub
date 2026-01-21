"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(gameId: string) {
    const userId = await verifySession();
    if (!userId) {
        return { error: "Não autorizado" };
    }

    try {
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
                    userId_gameId: {
                        userId,
                        gameId,
                    },
                },
            });
            revalidatePath("/games");
            revalidatePath("/home");
            revalidatePath("/favorites");
            return { success: true, action: "removed" };
        } else {
            await db.favorite.create({
                data: {
                    userId,
                    gameId,
                },
            });
            revalidatePath("/games");
            revalidatePath("/home");
            revalidatePath("/favorites");
            return { success: true, action: "added" };
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return { error: "Erro ao processar favorito" };
    }
}

export async function getFavorites() {
    const userId = await verifySession();
    if (!userId) return [];

    const favorites = await db.favorite.findMany({
        where: { userId },
        include: {
            game: true,
        },
    });

    return favorites.map(f => f.game);
}

export async function isFavorite(gameId: string) {
    const userId = await verifySession();
    if (!userId) return false;

    const favorite = await db.favorite.findUnique({
        where: {
            userId_gameId: {
                userId,
                gameId,
            },
        },
    });

    return !!favorite;
}
