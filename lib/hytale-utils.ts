
export interface HytaleServerConfig {
    serverName?: string;
    maxPlayers?: number;
    viewDistance?: number;
    authMode?: 'authenticated' | 'offline';
    enableBackups?: boolean;
    backupFrequency?: number;
    disableSentry?: boolean;
    downloadOnStart?: boolean;
    jvmArgs?: string;
}

export function buildHytaleEnv(config: HytaleServerConfig): Record<string, string> {
    const env: Record<string, string> = {
        SERVER_NAME: config.serverName || "Hytale Server",
        DEFAULT_PORT: "5520",
        MAX_PLAYERS: (config.maxPlayers || 20).toString(),
        VIEW_DISTANCE: (config.viewDistance || 12).toString(),
        AUTH_MODE: config.authMode || "authenticated",
        ENABLE_BACKUPS: (config.enableBackups ?? false).toString(),
        BACKUP_FREQUENCY: (config.backupFrequency || 30).toString(),
        DISABLE_SENTRY: (config.disableSentry ?? true).toString(),
        DOWNLOAD_ON_START: (config.downloadOnStart ?? true).toString(),
        MAX_MEMORY: "8G", // Recommend default as per docs, but ideally dynamic based on allocation
        PATCHLINE: "release",
        PUID: "1000",
        PGID: "1000",
    };

    if (config.jvmArgs) {
        env.JVM_ARGS = config.jvmArgs;
    }

    return env;
}
