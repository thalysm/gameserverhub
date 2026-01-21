"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const userId = await verifySession();
    if (!userId) return [];

    return await db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20
    });
}

export async function markAsRead(notificationId: string) {
    const userId = await verifySession();
    if (!userId) return { error: "Não autorizado" };

    try {
        await db.notification.update({
            where: { id: notificationId, userId },
            data: { read: true }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: "Erro ao atualizar notificação" };
    }
}

export async function markAllAsRead() {
    const userId = await verifySession();
    if (!userId) return { error: "Não autorizado" };

    try {
        await db.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: "Erro ao atualizar notificações" };
    }
}

export async function createNotification(userId: string, type: string, title: string, message: string) {
    try {
        // Check for similar notification in the last 5 minutes to avoid spam
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existing = await db.notification.findFirst({
            where: {
                userId,
                title,
                createdAt: { gte: fiveMinutesAgo }
            }
        });

        if (existing) return;

        await db.notification.create({
            data: {
                userId,
                type,
                title,
                message
            }
        });
        revalidatePath("/");
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

