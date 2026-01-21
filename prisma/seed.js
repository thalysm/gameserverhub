const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const games = [
    {
        slug: "minecraft",
        name: "Minecraft",
        category: "Sandbox",
        description: "Crie mundos infinitos e servidores customizados com mods e plugins.",
        supportsTcp: true,
        supportsUdp: false,
        defaultPort: 25565,
        minRam: 2048,
        recommendedRam: 4096,
        dockerImage: "itzg/minecraft-server",
    },
    {
        slug: "cs2",
        name: "Counter-Strike 2",
        category: "FPS",
        description: "Servidores competitivos com anti-cheat e configurações avançadas.",
        supportsTcp: false,
        supportsUdp: true,
        defaultPort: 27015,
        minRam: 2048,
        recommendedRam: 4096,
        dockerImage: "joedwards32/cs2",
    },
    {
        slug: "assetto-corsa",
        name: "Assetto Corsa",
        category: "Corrida",
        description: "Simulação de corrida com suporte a mods, carros e pistas.",
        supportsTcp: true,
        supportsUdp: true,
        defaultPort: 9600,
        minRam: 1024,
        recommendedRam: 2048,
        dockerImage: "pizofreude/assetto-corsa-dedicated",
    },
    {
        slug: "rust",
        name: "Rust",
        category: "Survival",
        description: "Servidores de sobrevivência com wipes e configurações customizadas.",
        supportsTcp: false,
        supportsUdp: true,
        defaultPort: 28015,
        minRam: 8192,
        recommendedRam: 16384,
        dockerImage: "didier69/rust-server",
    },
    {
        slug: "valheim",
        name: "Valheim",
        category: "Survival",
        description: "Mundos Viking para explorar com seus amigos em co-op.",
        supportsTcp: false,
        supportsUdp: true,
        defaultPort: 2456,
        minRam: 2048,
        recommendedRam: 4096,
        dockerImage: "llarsson/valheim-server",
    },
    {
        slug: "gmod",
        name: "Garry's Mod",
        category: "Sandbox",
        description: "Sandbox de física com addons e gamemodes ilimitados.",
        supportsTcp: false,
        supportsUdp: true,
        defaultPort: 27015,
        minRam: 2048,
        recommendedRam: 4096,
        dockerImage: "cm2network/steamcmd:root",
    },
    {
        slug: "terraria",
        name: "Terraria",
        category: "Sandbox",
        description: "Aventura 2D com construção, exploração e combate.",
        supportsTcp: true,
        supportsUdp: false,
        defaultPort: 7777,
        minRam: 512,
        recommendedRam: 1024,
        dockerImage: "ryanspice/terraria",
    },
    {
        slug: "ark",
        name: "ARK: Survival Evolved",
        category: "Survival",
        description: "Sobrevivência com dinossauros e base building massivo.",
        supportsTcp: true,
        supportsUdp: true,
        defaultPort: 7777,
        minRam: 8192,
        recommendedRam: 16384,
        dockerImage: "ark-server",
    },
    {
        slug: "palworld",
        name: "Palworld",
        category: "Survival",
        description: "Capture Pals e construa sua base neste mundo aberto.",
        supportsTcp: true,
        supportsUdp: true,
        defaultPort: 8211,
        minRam: 8192,
        recommendedRam: 16384,
        dockerImage: "thijsvanloef/palworld-server-docker",
    },
    {
        slug: "factorio",
        name: "Factorio",
        category: "Sandbox",
        description: "Construa e automatize fábricas complexas com amigos.",
        supportsTcp: true,
        supportsUdp: true,
        defaultPort: 34197,
        minRam: 1024,
        recommendedRam: 2048,
        dockerImage: "factoriotools/factorio-docker",
    },
];

async function main() {
    for (const game of games) {
        await prisma.game.upsert({
            where: { slug: game.slug },
            update: game,
            create: game,
        });
    }
    console.log("Seed successful");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
