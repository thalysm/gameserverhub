import { db } from '../lib/db';

async function main() {
    console.log('Seeding database...');

    // Create Minecraft game
    const minecraft = await db.game.upsert({
        where: { slug: 'minecraft' },
        update: {},
        create: {
            slug: 'minecraft',
            name: 'Minecraft',
            category: 'Sandbox',
            description: 'Create and manage your own Minecraft Java Edition server with full control over mods, plugins, and world settings.',
            image: '/games/minecraft.jpg',
            defaultPort: 25565,
            minRam: 1024,
            recommendedRam: 2048,
            supportsTcp: true,
            supportsUdp: false,
            dockerImage: 'itzg/minecraft-server',
        },
    });

    console.log('Created game:', minecraft.name);

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
