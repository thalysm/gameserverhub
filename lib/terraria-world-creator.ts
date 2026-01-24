import { docker } from './docker';
import { writeToVolume } from './docker';

/**
 * Creates a minimal Terraria server config to help with world creation
 * For beardedio/terraria, we'll create a simple serverconfig.txt that
 * will be used by the server when it prompts for world creation
 */
export async function prepareTerrariaVolume(
    volumeName: string,
    worldName: string,
    worldSize: string,
    difficulty: string,
    maxPlayers: number,
    password?: string,
    seed?: string,
    motd?: string
): Promise<void> {
    console.log(`Preparing Terraria volume ${volumeName} for world ${worldName}...`);

    try {
        // Create a basic serverconfig.txt that can be used for initial setup
        // We use boolean flags where appropriate or simple key=value
        const serverConfig = [
            `world=/config/${worldName}.wld`,
            `autocreate=${worldSize}`,
            `worldname=${worldName}`,
            `difficulty=${difficulty}`,
            `maxplayers=${maxPlayers}`,
            password ? `password=${password}` : '',
            seed ? `seed=${seed}` : '',
            motd ? `motd=${motd}` : '',
            'port=7777',
            'npcstream=60',
            'priority=1',
            'secure=1',
            'language=en-US',
            '', // Ensure newline at end
        ].filter(Boolean).join('\n');

        // Write the config file to the volume
        await writeToVolume(volumeName, 'serverconfig.txt', serverConfig);

        console.log(`Terraria volume prepared with serverconfig.txt`);
    } catch (error) {
        console.error('Error preparing Terraria volume:', error);
        throw error;
    }
}

/**
 * Updates the serverconfig.txt in the volume
 */
export async function updateTerrariaConfig(
    volumeName: string,
    newConfig: any
): Promise<void> {
    // Re-use prepare logic but with new values
    // We assume the world name hasn't changed or we use the existing one if possible
    // Ideally we should read the existing one, but recreating it is safer to ensure consistency

    await prepareTerrariaVolume(
        volumeName,
        newConfig.worldName,
        newConfig.worldSize,
        newConfig.difficulty,
        newConfig.maxPlayers,
        newConfig.password,
        newConfig.worldSeed,
        newConfig.motd
    );
}
