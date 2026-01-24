import { PrismaClient } from "@prisma/client";
import path from 'path';

declare global {
    var prisma: PrismaClient | undefined;
}

const dbPath = process.env.DATABASE_URL || "file:./prisma/app.db";


export const db = globalThis.prisma || new PrismaClient({
    datasources: {
        db: {
            url: dbPath,
        },
    },
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
