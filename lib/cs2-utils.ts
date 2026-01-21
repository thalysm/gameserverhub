export const CS2_MAPS = [
    { id: "de_dust2", name: "Dust II", type: "Active Duty" },
    { id: "de_mirage", name: "Mirage", type: "Active Duty" },
    { id: "de_inferno", name: "Inferno", type: "Active Duty" },
    { id: "de_nuke", name: "Nuke", type: "Active Duty" },
    { id: "de_vertigo", name: "Vertigo", type: "Active Duty" },
    { id: "de_ancient", name: "Ancient", type: "Active Duty" },
    { id: "de_anubis", name: "Anubis", type: "Active Duty" },
    { id: "de_overpass", name: "Overpass", type: "Reserve" },
    { id: "de_train", name: "Train", type: "Reserve" },
    { id: "de_cache", name: "Cache", type: "Reserve" },
];

export const CS2_GAME_MODES = [
    { id: "competitive", name: "Competitive", type: "0", mode: "1" },
    { id: "casual", name: "Casual", type: "0", mode: "0" },
    { id: "deathmatch", name: "Deathmatch", type: "1", mode: "2" },
    { id: "wingman", name: "Wingman", type: "0", mode: "2" },
];

export interface CS2Config {
    // Server Configuration
    srcdsToken: string;
    serverName?: string;
    map: string;
    gameAlias: string;
    maxPlayers: number;
    password?: string;
    rconPassword?: string;
    cheats?: boolean;
    hibernate?: boolean;
    lan?: boolean;
    additionalArgs?: string;
    overtimeEnabled?: boolean;

    // Workshop
    workshopId?: string; // Maps to CS2_HOST_WORKSHOP_MAP
    workshopCollection?: string; // Maps to CS2_HOST_WORKSHOP_COLLECTION

    // Bots
    botDifficulty?: string;
    botQuota?: number;
    botQuotaMode?: string;

    // CSTV
    tvEnable?: boolean;
    tvPort?: number;
    tvAutoRecord?: boolean;
    tvPassword?: string;
    tvRelayPassword?: string;
    tvMaxRate?: number;
    tvDelay?: number;

    // Logs
    log?: boolean;
    logMoney?: boolean;
    logDetail?: string;
    logItems?: boolean;

    // Troubleshooting/Advanced
    debug?: string;
    steamAppValidate?: boolean;
    cfgUrl?: string;
}

export function buildCS2Env(config: CS2Config) {
    const env: Record<string, string> = {
        "SRCDS_TOKEN": config.srcdsToken,
        "CS2_SERVERNAME": config.serverName || "GSH Dedicated Server",
        "CS2_STARTMAP": config.map || "de_dust2",
        "CS2_GAMEALIAS": config.gameAlias || "competitive",
        "CS2_MAXPLAYERS": (config.maxPlayers || 10).toString(),
        "CS2_PW": config.password || "",
        "CS2_RCONPW": config.rconPassword || "gsh-rcon-pass",
        "CS2_CHEATS": config.cheats ? "1" : "0",
        "CS2_SERVER_HIBERNATE": config.hibernate ? "1" : "0",
        "CS2_LAN": config.lan ? "1" : "0",
        "CS2_ADDITIONAL_ARGS": config.additionalArgs || "",
    };

    // Workshop
    if (config.workshopId) env["CS2_HOST_WORKSHOP_MAP"] = config.workshopId;
    if (config.workshopCollection) env["CS2_HOST_WORKSHOP_COLLECTION"] = config.workshopCollection;

    // Bots
    if (config.botDifficulty !== undefined) env["CS2_BOT_DIFFICULTY"] = config.botDifficulty;
    if (config.botQuota !== undefined) env["CS2_BOT_QUOTA"] = config.botQuota.toString();
    if (config.botQuotaMode) env["CS2_BOT_QUOTA_MODE"] = config.botQuotaMode;

    // CSTV
    if (config.tvEnable !== undefined) {
        env["TV_ENABLE"] = config.tvEnable ? "1" : "0";
        env["TV_PORT"] = (config.tvPort || 27020).toString();
        env["TV_AUTORECORD"] = config.tvAutoRecord ? "1" : "0";
        env["TV_PW"] = config.tvPassword || "";
        env["TV_RELAY_PW"] = config.tvRelayPassword || "";
        env["TV_MAXRATE"] = (config.tvMaxRate || 0).toString();
        env["TV_DELAY"] = (config.tvDelay || 0).toString();
    }

    // Logs
    env["CS2_LOG"] = config.log === false ? "off" : "on";
    if (config.logMoney !== undefined) env["CS2_LOG_MONEY"] = config.logMoney ? "1" : "0";
    if (config.logDetail) env["CS2_LOG_DETAIL"] = config.logDetail;
    if (config.logItems !== undefined) env["CS2_LOG_ITEMS"] = config.logItems ? "1" : "0";

    // Advanced
    if (config.debug) env["DEBUG"] = config.debug;
    if (config.steamAppValidate !== undefined) {
        env["STEAMAPPVALIDATE"] = config.steamAppValidate ? "1" : "0";
    } else {
        env["STEAMAPPVALIDATE"] = "0"; // Default to no validation for speed
    }
    if (config.cfgUrl) env["CS2_CFG_URL"] = config.cfgUrl;

    // Overtime
    if (config.overtimeEnabled) {
        env["CS2_ADDITIONAL_ARGS"] = (env["CS2_ADDITIONAL_ARGS"] || "") + " +mp_overtime_enable 1";
    }

    return env;
}
