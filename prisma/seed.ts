import { db } from '../lib/db';

async function main() {
    console.log('Seeding database...');

    const gamesData = [
        {
            slug: 'minecraft',
            name: 'Minecraft',
            category: 'Sandbox',
            description: 'Exploração infinita, construção e sobrevivência. Suporta Java Edition com mods e plugins.',
            image: '/games/minecraft.jpg',
            defaultPort: 25565,
            minRam: 1024,
            recommendedRam: 2048,
            supportsTcp: true,
            supportsUdp: false,
            dockerImage: 'itzg/minecraft-server',
        },
        {
            slug: 'cs2',
            name: 'Counter-Strike 2',
            category: 'FPS',
            description: 'A nova era do shooter tático mais popular do mundo. Servidores dedicados competitivos.',
            image: '/games/cs2.jpg',
            defaultPort: 27015,
            minRam: 4096,
            recommendedRam: 8192,
            supportsTcp: true,
            supportsUdp: true,
            dockerImage: 'joedwards32/cs2',
        },
        {
            slug: 'rust',
            name: 'Rust',
            category: 'Survival',
            description: 'Sobreviva em um ambiente hostil construindo bases e combatendo outros jogadores.',
            image: '/games/rust.jpg',
            defaultPort: 28015,
            minRam: 8192,
            recommendedRam: 16384,
            supportsTcp: false,
            supportsUdp: true,
            dockerImage: 'didstopia/rust-server',
        },
        {
            slug: 'valheim',
            name: 'Valheim',
            category: 'Survival',
            description: 'Um brutal jogo de exploração e sobrevivência para 1-10 jogadores, ambientado em um purgatório inspirado na cultura viking.',
            image: '/games/valheim.jpg',
            defaultPort: 2456,
            minRam: 2048,
            recommendedRam: 4096,
            supportsTcp: false,
            supportsUdp: true,
            dockerImage: 'lloesche/valheim-server',
        },
        {
            slug: 'assetto-corsa',
            name: 'Assetto Corsa',
            category: 'Corrida',
            description: 'O simulador de corrida mais realista, com suporte extensivo a mods e comunidades.',
            image: '/games/assetto-corsa.jpg',
            defaultPort: 9600,
            minRam: 1024,
            recommendedRam: 2048,
            supportsTcp: true,
            supportsUdp: true,
            dockerImage: 'pablokbs/assetto-corsa-server',
        },
        {
            slug: 'gmod',
            name: "Garry's Mod",
            category: 'Sandbox',
            description: 'Sandbox de física com addons e gamemodes ilimitados.',
            image: '/games/gmod.jpg',
            defaultPort: 27015,
            minRam: 2048,
            recommendedRam: 4096,
            supportsTcp: false,
            supportsUdp: true,
            dockerImage: 'cm2network/steamcmd:root',
        },
        {
            slug: 'terraria',
            name: 'Terraria',
            category: 'Sandbox',
            description: 'Aventura 2D com construção, exploração e combate.',
            image: '/games/terraria.jpg',
            defaultPort: 7777,
            minRam: 512,
            recommendedRam: 1024,
            supportsTcp: true,
            supportsUdp: false,
            dockerImage: 'ghcr.io/beardedio/terraria',
        },
        {
            slug: 'palworld',
            name: 'Palworld',
            category: 'Survival',
            description: 'Capture Pals e construa sua base neste mundo aberto.',
            image: '/games/palworld.jpg',
            defaultPort: 8211,
            minRam: 8192,
            recommendedRam: 16384,
            supportsTcp: true,
            supportsUdp: true,
            dockerImage: 'thijsvanloef/palworld-server-docker',
        },
        {
            slug: 'hytale',
            name: 'Hytale',
            category: 'Sandbox',
            description: 'Servidor dedicado Hytale com download automático e atualizações.',
            image: '/games/hytale.jpg',
            defaultPort: 5520,
            minRam: 4096,
            recommendedRam: 8192,
            supportsTcp: false,
            supportsUdp: true,
            dockerImage: 'indifferentbroccoli/hytale-server-docker',
        }
    ];

    for (const gameData of gamesData) {
        await db.game.upsert({
            where: { slug: gameData.slug },
            update: gameData,
            create: gameData,
        });
        console.log(`- Game seeded: ${gameData.name}`);
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
