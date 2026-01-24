export interface ValheimConfig {
    serverName?: string;
    worldName?: string;
    serverPassword?: string;
    serverPublic?: boolean;
    crossplay?: boolean;
    adminIds?: string;
    bannedIds?: string;
    permittedIds?: string;
    updateCron?: string;
    restartCron?: string;
    backups?: boolean;
    backupsCron?: string;
    backupsMaxAge?: number;
    timezone?: string;
}

export function buildValheimEnv(config: ValheimConfig): Record<string, string> {
    const env: Record<string, string> = {
        // Required settings
        SERVER_NAME: config.serverName || "Valheim Server",
        WORLD_NAME: config.worldName || "Dedicated",
        SERVER_PASS: config.serverPassword || "secret123", // Min 5 characters
        SERVER_PUBLIC: config.serverPublic !== false ? "true" : "false",

        // Crossplay support
        CROSSPLAY: config.crossplay === true ? "true" : "false",

        // Server arguments (add -crossplay if enabled)
        SERVER_ARGS: config.crossplay === true ? "-crossplay" : "",

        // Update and restart schedules
        UPDATE_CRON: config.updateCron || "*/15 * * * *",
        RESTART_CRON: config.restartCron || "10 5 * * *",

        // Backup settings
        BACKUPS: config.backups !== false ? "true" : "false",
        BACKUPS_CRON: config.backupsCron || "5 * * * *",
        BACKUPS_MAX_AGE: (config.backupsMaxAge || 3).toString(),

        // Timezone
        TZ: config.timezone || "Etc/UTC",

        // Permissions
        PERMISSIONS_UMASK: "022",
    };

    // Optional admin/banned/permitted lists
    if (config.adminIds) {
        env.ADMINLIST_IDS = config.adminIds;
    }
    if (config.bannedIds) {
        env.BANNEDLIST_IDS = config.bannedIds;
    }
    if (config.permittedIds) {
        env.PERMITTEDLIST_IDS = config.permittedIds;
    }

    return env;
}

export const defaultValheimConfig: ValheimConfig = {
    serverName: "Valheim Server",
    worldName: "Dedicated",
    serverPassword: "secret123",
    serverPublic: true,
    crossplay: false,
    updateCron: "*/15 * * * *",
    restartCron: "10 5 * * *",
    backups: true,
    backupsCron: "5 * * * *",
    backupsMaxAge: 3,
    timezone: "Etc/UTC",
};
