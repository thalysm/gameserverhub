export async function getTwitchAccessToken() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientSecret === 'YOUR_SECRET_HERE') {
        console.error('Twitch Credentials missing');
        return null;
    }

    try {
        const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
            method: 'POST',
        });

        if (!res.ok) {
            console.error('Twitch Token Error', await res.text());
            return null;
        }

        const data = await res.json();
        return data.access_token;
    } catch (error) {
        console.error('Failed to get twitch token', error);
        return null;
    }
}

export async function fetchIGDBGame(gameName: string) {
    const token = await getTwitchAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!token || !clientId) return null;

    try {
        const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${token}`,
            },
            body: `fields name, cover.url, artworks.url; search "${gameName}"; limit 1;`
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data && data.length > 0) {
            const game = data[0];
            const cover = game.cover ? game.cover.url.replace('t_thumb', 't_cover_big').replace('//', 'https://') : null;
            const artwork = game.artworks && game.artworks.length > 0 ? game.artworks[0].url.replace('t_thumb', 't_screenshot_big').replace('//', 'https://') : null;
            return { cover, artwork };
        }
        return null;
    } catch (error) {
        console.error('IGDB Fetch Error', error);
        return null;
    }
}
