// Minecraft version utilities

export interface MinecraftVersion {
    id: string;
    type: "release" | "snapshot";
    releaseTime: string;
}

export async function getMinecraftVersions(): Promise<MinecraftVersion[]> {
    try {
        const response = await fetch(
            "https://launchermeta.mojang.com/mc/game/version_manifest.json",
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!response.ok) {
            throw new Error("Failed to fetch Minecraft versions");
        }

        const data = await response.json();
        return data.versions || [];
    } catch (error) {
        console.error("Error fetching Minecraft versions:", error);
        return [];
    }
}

export async function getMinecraftReleaseVersions(): Promise<string[]> {
    const versions = await getMinecraftVersions();
    return versions
        .filter((v) => v.type === "release")
        .map((v) => v.id)
        .slice(0, 20); // Return last 20 releases
}

export const MINECRAFT_GAME_MODES = [
    { value: "survival", label: "Survival" },
    { value: "creative", label: "Creative" },
    { value: "adventure", label: "Adventure" },
    { value: "spectator", label: "Spectator" },
];

export const MINECRAFT_DIFFICULTIES = [
    { value: "peaceful", label: "Peaceful" },
    { value: "easy", label: "Easy" },
    { value: "normal", label: "Normal" },
    { value: "hard", label: "Hard" },
];

export interface MinecraftServerProperties {
    // Server settings
    "server-port": number;
    "max-players": number;
    motd: string;
    "online-mode": boolean;
    pvp: boolean;
    difficulty: string;
    gamemode: string;
    "view-distance": number;
    "simulation-distance": number;

    // World settings
    "level-name": string;
    "level-seed": string;
    "level-type": string;
    "generate-structures": boolean;
    "spawn-protection": number;
    "spawn-animals": boolean;
    "spawn-monsters": boolean;
    "spawn-npcs": boolean;

    // Performance
    "max-tick-time": number;
    "network-compression-threshold": number;

    // Whitelist & ops
    "white-list": boolean;
    "enforce-whitelist": boolean;
    "enable-command-block": boolean;
    "op-permission-level": number;

    // Other
    "allow-flight": boolean;
    "allow-nether": boolean;
    "enable-query": boolean;
    "enable-rcon": boolean;
    "rcon-port": number;
    "rcon-password": string;

    // Additional properties
    "force-gamemode": boolean;
    "hardcore": boolean;
    "max-build-height": number;
    "resource-pack": string;
    "resource-pack-sha1": string;
    "sync-chunk-writes": boolean;
    "use-native-transport": boolean;
    "enable-status": boolean;
    "broadcast-rcon-to-ops": boolean;
    "broadcast-console-to-ops": boolean;
    "entity-broadcast-range-percentage": number;
}

export const SERVER_PROPERTIES_DESCRIPTIONS: Record<keyof MinecraftServerProperties, string> = {
    "server-port": "The port number the server listens on",
    "max-players": "Maximum number of players that can join",
    "motd": "Message of the day shown in the server list",
    "online-mode": "Verify players through Mojang's authentication servers",
    "pvp": "Enable player vs player combat",
    "difficulty": "Game difficulty level",
    "gamemode": "Default game mode for new players",
    "view-distance": "Amount of world data the server sends to clients (in chunks)",
    "simulation-distance": "Distance in chunks around players where mobs spawn and crops grow",
    "level-name": "Name of the world folder",
    "level-seed": "Seed for world generation (leave empty for random)",
    "level-type": "Type of world to generate (default, flat, largeBiomes, amplified)",
    "generate-structures": "Generate structures like villages and mineshafts",
    "spawn-protection": "Radius of spawn protection (0 to disable)",
    "spawn-animals": "Spawn passive mobs",
    "spawn-monsters": "Spawn hostile mobs",
    "spawn-npcs": "Spawn villagers",
    "max-tick-time": "Maximum time a single tick may take before server watchdog stops the server",
    "network-compression-threshold": "Compress network traffic above this threshold",
    "white-list": "Only allow whitelisted players to join",
    "enforce-whitelist": "Kick non-whitelisted players when whitelist is enabled",
    "enable-command-block": "Enable command blocks",
    "op-permission-level": "Permission level for operators (1-4)",
    "allow-flight": "Allow players to fly in survival mode (e.g. cheats/mods)",
    "allow-nether": "Allow players to travel to the Nether",
    "enable-query": "Enable GameSpy4 protocol server listener for server status",
    "enable-rcon": "Enable remote console",
    "rcon-port": "Port for RCON",
    "rcon-password": "Password for RCON access",
    "force-gamemode": "Force players to join in the default gamemode",
    "hardcore": "Players are banned on death",
    "max-build-height": "Maximum height players can build (default 256)",
    "resource-pack": "URL to a server resource pack",
    "resource-pack-sha1": "SHA1 checksum of the resource pack",
    "sync-chunk-writes": "Synchronous chunk writes (better reliability, slower performance)",
    "use-native-transport": "Optimized Linux packet sending/receiving (Linux only)",
    "enable-status": "Makes the server appear 'online' in server list",
    "broadcast-rcon-to-ops": "Send RCON command output to all online operators",
    "broadcast-console-to-ops": "Send console command output to all online operators",
    "entity-broadcast-range-percentage": "Controls how close entities must be to be visibly rendered",
};

export function buildServerProperties(config: any): string {
    const properties: string[] = [];

    // Dynamically build all properties from config object
    for (const [key, value] of Object.entries(config)) {
        // Skip keys that are not strings or numbers or booleans
        if (value === undefined || value === null || typeof value === 'object') continue;

        properties.push(`${key}=${value}`);
    }

    return properties.join("\n");
}
