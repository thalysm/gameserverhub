export interface Game {
  id: number;
  slug: string;
  name: string;
  image: string;
  category: string;
  description: string;
  supportsTcp: boolean;
  supportsUdp: boolean;
  defaultPort: number;
  favorite: boolean;
  minRam: number;
  recommendedRam: number;
  features: string[];
}

export const games: Game[] = [
  {
    id: 1,
    slug: "minecraft",
    name: "Minecraft",
    image: "/games/minecraft.jpg",
    category: "Sandbox",
    description: "Crie mundos infinitos e servidores customizados com mods e plugins.",
    supportsTcp: true,
    supportsUdp: false,
    defaultPort: 25565,
    favorite: false,
    minRam: 2048,
    recommendedRam: 4096,
    features: ["Mods", "Plugins", "Whitelist", "RCON", "Query"],
  },
  {
    id: 2,
    slug: "cs2",
    name: "Counter-Strike 2",
    image: "/games/cs2.jpg",
    category: "FPS",
    description: "Servidores competitivos com anti-cheat e configurações avançadas.",
    supportsTcp: false,
    supportsUdp: true,
    defaultPort: 27015,
    favorite: true,
    minRam: 2048,
    recommendedRam: 4096,
    features: ["VAC", "SourceMod", "Workshop Maps", "GOTV", "Competitive"],
  },
  {
    id: 3,
    slug: "assetto-corsa",
    name: "Assetto Corsa",
    image: "/games/assetto-corsa.jpg",
    category: "Corrida",
    description: "Simulação de corrida com suporte a mods, carros e pistas.",
    supportsTcp: true,
    supportsUdp: true,
    defaultPort: 9600,
    favorite: false,
    minRam: 1024,
    recommendedRam: 2048,
    features: ["Mods", "Custom Tracks", "Custom Cars", "Booking", "Practice"],
  },
  {
    id: 4,
    slug: "rust",
    name: "Rust",
    image: "/games/rust.jpg",
    category: "Survival",
    description: "Servidores de sobrevivência com wipes e configurações customizadas.",
    supportsTcp: false,
    supportsUdp: true,
    defaultPort: 28015,
    favorite: false,
    minRam: 8192,
    recommendedRam: 16384,
    features: ["Oxide/uMod", "Custom Maps", "Wipes", "RCON", "Anti-Cheat"],
  },
  {
    id: 5,
    slug: "valheim",
    name: "Valheim",
    image: "/games/valheim.jpg",
    category: "Survival",
    description: "Mundos Viking para explorar com seus amigos em co-op.",
    supportsTcp: false,
    supportsUdp: true,
    defaultPort: 2456,
    favorite: true,
    minRam: 2048,
    recommendedRam: 4096,
    features: ["Password Protection", "Crossplay", "Mods", "World Backup"],
  },
  {
    id: 6,
    slug: "gmod",
    name: "Garry's Mod",
    image: "/games/gmod.jpg",
    category: "Sandbox",
    description: "Sandbox de física com addons e gamemodes ilimitados.",
    supportsTcp: false,
    supportsUdp: true,
    defaultPort: 27015,
    favorite: false,
    minRam: 2048,
    recommendedRam: 4096,
    features: ["Workshop", "Addons", "Gamemodes", "ULX", "DarkRP"],
  },
  {
    id: 7,
    slug: "terraria",
    name: "Terraria",
    image: "/games/terraria.jpg",
    category: "Sandbox",
    description: "Aventura 2D com construção, exploração e combate.",
    supportsTcp: true,
    supportsUdp: false,
    defaultPort: 7777,
    favorite: false,
    minRam: 512,
    recommendedRam: 1024,
    features: ["TShock", "Mods", "Password", "Journey Mode"],
  },
  {
    id: 8,
    slug: "ark",
    name: "ARK: Survival Evolved",
    image: "/games/rust.jpg",
    category: "Survival",
    description: "Sobrevivência com dinossauros e base building massivo.",
    supportsTcp: true,
    supportsUdp: true,
    defaultPort: 7777,
    favorite: false,
    minRam: 8192,
    recommendedRam: 16384,
    features: ["Mods", "Clusters", "Custom Maps", "RCON", "Breeding"],
  },
  {
    id: 9,
    slug: "palworld",
    name: "Palworld",
    image: "/games/valheim.jpg",
    category: "Survival",
    description: "Capture Pals e construa sua base neste mundo aberto.",
    supportsTcp: true,
    supportsUdp: true,
    defaultPort: 8211,
    favorite: false,
    minRam: 8192,
    recommendedRam: 16384,
    features: ["Dedicated Server", "Password", "PvP/PvE", "Multiplayer"],
  },
  {
    id: 10,
    slug: "factorio",
    name: "Factorio",
    image: "/games/gmod.jpg",
    category: "Sandbox",
    description: "Construa e automatize fábricas complexas com amigos.",
    supportsTcp: true,
    supportsUdp: true,
    defaultPort: 34197,
    favorite: false,
    minRam: 1024,
    recommendedRam: 2048,
    features: ["Mods", "Autosave", "Multiplayer", "Headless Server"],
  },
];


export function getGameBySlug(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

export function getGamesByCategory(category: string): Game[] {
  return games.filter((g) => g.category === category);
}

export function getCategories(): string[] {
  return [...new Set(games.map((g) => g.category))];
}

export function getGameCover(slug: string): string {
  return `/games/${slug}.jpg`;
}

export function getGameBanner(slug: string): string {
  return `/games/${slug}-banner.jpg`;
}
