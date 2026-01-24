import { PrismaClient } from "@prisma/client";
import path from 'path';

declare global {
    var prisma: PrismaClient | undefined;
}

// Force absolute path to avoid confusion between dev and production/scripts
const dbPath = "file:C:/Users/thaly/Downloads/game-server-hub/prisma/app.db";

export const db = globalThis.prisma || new PrismaClient({
    datasources: {
        db: {
            url: dbPath,
        },
    },
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
