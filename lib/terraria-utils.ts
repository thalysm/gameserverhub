// Terraria Server Configuration Utilities
// Based on ghcr.io/beardedio/terraria Docker image
// Docs: https://github.com/beardedio/terraria

export const TERRARIA_WORLD_SIZES = [
    { value: "1", label: "Small" },
    { value: "2", label: "Medium" },
    { value: "3", label: "Large" },
] as const;

export const TERRARIA_DIFFICULTIES = [
    { value: "0", label: "Classic" },
    { value: "1", label: "Expert" },
    { value: "2", label: "Master" },
    { value: "3", label: "Journey" },
] as const;

export interface TerrariaConfig {
    worldName: string;
    worldSize: string;
    difficulty: string;
    maxPlayers: number;
    password?: string;
    motd?: string;
    secure: boolean;
    language: string;
    worldSeed?: string;
    npcStream: number;
}

/**
 * Build environment variables for beardedio/terraria
 * The main world file is specified via env var
 */
export function buildTerrariaEnv(config: TerrariaConfig): Record<string, string> {
    // We don't set 'world' env var here to avoid duplicate argument errors
    // because we are using serverconfig.txt which already contains world config.
    // The beardedio/terraria image adds -world arg if 'world' env var is properly set.
    return {};
}

/**
 * Build command-line arguments for Terraria server
 * Uses TerrariaServer.exe CLI for world auto-creation
 */
export function buildTerrariaStartArgs(config: TerrariaConfig): string[] {
    const args: string[] = [];

    // Auto-create the world if it doesn't exist
    args.push('-autocreate', config.worldSize);

    // Set max players
    args.push('-maxplayers', config.maxPlayers.toString());

    // Set difficulty
    args.push('-difficulty', config.difficulty);

    // Set world seed if provided
    if (config.worldSeed) {
        args.push('-seed', config.worldSeed);
    }

    // Set password if provided
    if (config.password) {
        args.push('-password', config.password);
    }

    // Set MOTD if provided
    if (config.motd) {
        args.push('-motd', config.motd);
    }

    return args;
}

export const DEFAULT_TERRARIA_CONFIG: TerrariaConfig = {
    worldName: "MyWorld",
    worldSize: "2",
    difficulty: "0",
    maxPlayers: 8,
    password: "",
    motd: "Welcome to Terraria!",
    secure: true,
    language: "en-US",
    worldSeed: "",
    npcStream: 60,
};
