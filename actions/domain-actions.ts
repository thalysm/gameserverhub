"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/session";

export async function getPublicIp() {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip as string;
    } catch (error) {
        console.error("Error fetching public IP:", error);
        return "Indisponível";
    }
}

export async function getDomains() {
    try {
        const userId = await verifySession();
        if (!userId) return [];

        return await db.userDomain.findMany({
            where: { userId },
            include: {
                servers: {
                    include: {
                        game: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    } catch (error) {
        console.error("Error fetching domains:", error);
        return [];
    }
}

export async function addDomain(name: string) {
    try {
        const userId = await verifySession();
        if (!userId) return { error: "Não autorizado" };

        const domain = await db.userDomain.create({
            data: {
                name,
                userId
            }
        });

        revalidatePath("/settings");
        return { success: true, domain };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: "Este domínio já está cadastrado." };
        }
        console.error("Error adding domain:", error);
        return { error: "Falha ao adicionar domínio" };
    }
}

export async function deleteDomain(id: string) {
    try {
        const userId = await verifySession();
        if (!userId) return { error: "Não autorizado" };

        await db.userDomain.delete({
            where: { id, userId }
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Error deleting domain:", error);
        return { error: "Falha ao deletar domínio" };
    }
}
