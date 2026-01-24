"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Re-export checkDockerStatus from another location or implement it here
import { docker } from "@/lib/docker";
import dns from 'dns/promises';

export async function checkDockerStatus() {
    try {
        await docker.ping();
        return { online: true };
    } catch (error) {
        return {
            online: false,
            error: error instanceof Error ? error.message : "Docker unavailable"
        };
    }
}

export async function verifyDomainDns(domain: string, expectedIp: string) {
    try {
        const addresses = await dns.resolve4(domain);
        const isPointed = addresses.includes(expectedIp);
        return { success: true, isPointed, addresses };
    } catch (error) {
        return { success: false, error: "Failed to resolve DNS" };
    }
}

export async function getSystemSettings() {
    try {
        const settings = await db.systemSetting.findMany();
        const settingsMap: Record<string, string> = {};

        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return settingsMap;
    } catch (error) {
        console.error("Error fetching system settings:", error);
        return {};
    }
}

export async function saveSystemSettings(settings: Record<string, string>) {
    try {
        const promises = Object.entries(settings).map(([key, value]) => {
            return db.systemSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            });
        });

        await Promise.all(promises);
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Error saving system settings:", error);
        return { error: "Failed to save settings" };
    }
}

export async function updateGameCovers() {
    try {
        // 1. Get credentials
        const settings = await getSystemSettings();
        const clientId = settings["TWITCH_CLIENT_ID"];
        const clientSecret = settings["TWITCH_CLIENT_SECRET"];

        if (!clientId || !clientSecret) {
            return { error: "Missing Twitch Client ID or Secret" };
        }

        // 2. Get Access Token
        const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
            method: "POST"
        });

        if (!tokenResponse.ok) {
            return { error: "Failed to authenticate with Twitch" };
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 3. Get all games from DB
        const games = await db.game.findMany();
        const updates = [];

        for (const game of games) {
            // Search for game on IGDB
            const searchResponse = await fetch("https://api.igdb.com/v4/games", {
                method: "POST",
                headers: {
                    "Client-ID": clientId,
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "text/plain" // IGDB requires plain text body
                },
                body: `search "${game.name}"; fields name, cover; limit 1;`
            });

            if (!searchResponse.ok) continue;

            const searchData = await searchResponse.json();
            if (searchData.length === 0 || !searchData[0].cover) continue;

            const coverId = searchData[0].cover;

            // Get cover URL
            const coverResponse = await fetch("https://api.igdb.com/v4/covers", {
                method: "POST",
                headers: {
                    "Client-ID": clientId,
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "text/plain"
                },
                body: `fields url; where id = ${coverId};`
            });

            if (!coverResponse.ok) continue;

            const coverData = await coverResponse.json();
            if (coverData.length > 0 && coverData[0].url) {
                // Replace thumb with 1080p or 720p
                // //images.igdb.com/igdb/image/upload/t_thumb/co1r7x.jpg
                // default is t_thumb, we want t_cover_big or t_1080p
                let imageUrl = coverData[0].url;
                if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;

                // Use high quality image
                imageUrl = imageUrl.replace("t_thumb", "t_1080p");

                updates.push(db.game.update({
                    where: { id: game.id },
                    data: { image: imageUrl }
                }));
            }
        }

        await Promise.all(updates);
        revalidatePath("/jogos");
        return { success: true, updatedCount: updates.length };

    } catch (error) {
        console.error("Error updating game covers:", error);
        return { error: "Failed to update game covers" };
    }
}
