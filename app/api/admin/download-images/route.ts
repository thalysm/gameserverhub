import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { games } from '@/lib/games-data';
import { getTwitchAccessToken } from '@/lib/igdb';

// Force dynamic since we're using file system and external APIs
export const dynamic = 'force-dynamic';

export async function GET() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientSecret === 'YOUR_SECRET_HERE') {
        return NextResponse.json({ error: 'Missing Twitch credentials in .env.local' }, { status: 400 });
    }

    const token = await getTwitchAccessToken();
    if (!token) {
        return NextResponse.json({ error: 'Failed to authenticate with Twitch' }, { status: 401 });
    }

    const results = [];
    const publicDir = path.join(process.cwd(), 'public', 'games');

    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    for (const game of games) {
        try {
            // Fetch Game info from IGDB
            const response = await fetch('https://api.igdb.com/v4/games', {
                method: 'POST',
                headers: {
                    'Client-ID': clientId,
                    'Authorization': `Bearer ${token}`,
                },
                body: `fields name, cover.url, artworks.url; search "${game.name}"; limit 1;`
            });

            if (!response.ok) {
                results.push({ name: game.name, status: 'failed', reason: 'IGDB API error' });
                continue;
            }

            const data = await response.json();
            if (!data || data.length === 0) {
                if (game.slug === 'hytale') {
                    // Manual fallback for Hytale
                    const coverUrl = "https://images.igdb.com/igdb/image/upload/t_720p/co1lat.jpg";
                    const coverPath = path.join(publicDir, `${game.slug}.jpg`);
                    const coverBuffer = await fetch(coverUrl).then(res => res.arrayBuffer());
                    fs.writeFileSync(coverPath, Buffer.from(coverBuffer));

                    // Banner fallback
                    const bannerUrl = "https://github.com/user-attachments/assets/b8b4ae5c-06bb-46a7-8d94-903a04595036";
                    const bannerPath = path.join(publicDir, `${game.slug}-banner.jpg`);
                    const bannerBuffer = await fetch(bannerUrl).then(res => res.arrayBuffer());
                    fs.writeFileSync(bannerPath, Buffer.from(bannerBuffer));

                    results.push({ name: game.name, status: 'success', method: 'fallback' });
                    continue;
                }

                results.push({ name: game.name, status: 'failed', reason: 'Not found' });
                continue;
            }

            const gameData = data[0];

            // Download Cover
            if (gameData.cover && gameData.cover.url) {
                const coverUrl = gameData.cover.url.replace('t_thumb', 't_720p').replace('//', 'https://');
                const coverPath = path.join(publicDir, `${game.slug}.jpg`);
                const coverBuffer = await fetch(coverUrl).then(res => res.arrayBuffer());
                fs.writeFileSync(coverPath, Buffer.from(coverBuffer));
            }

            // Download Banner (Artwork)
            if (gameData.artworks && gameData.artworks.length > 0) {
                const artUrl = gameData.artworks[0].url.replace('t_thumb', 't_1080p').replace('//', 'https://');
                const artPath = path.join(publicDir, `${game.slug}-banner.jpg`);
                const artBuffer = await fetch(artUrl).then(res => res.arrayBuffer());
                fs.writeFileSync(artPath, Buffer.from(artBuffer));
            }

            results.push({ name: game.name, status: 'success' });

        } catch (error: any) {
            console.error(`Error processing ${game.name}:`, error);
            results.push({ name: game.name, status: 'error', reason: error.message });
        }
    }

    return NextResponse.json({
        message: 'Download process completed',
        results
    });
}
