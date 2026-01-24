"use server";

import { db } from "@/lib/db";
import { getPortPoolConfig as getInternalConfig, updatePortPoolConfig as updateInternalConfig, getUsedPorts as getInternalUsedPorts, getUPNPConfig as getInternalUPNPConfig } from "@/lib/port-manager";
import { checkUPnPStatus as getLocalUPnPStatus, openRouterPort, closeRouterPort } from "@/lib/upnp";
import { revalidatePath } from "next/cache";

export async function getRouterUPnPStatus() {
    return await getLocalUPnPStatus();
}

export async function toggleRouterPort(port: number, gameSlug: string, enabled: boolean) {
    const protocol = gameSlug === 'cs2' ? 'both' : 'TCP';
    if (enabled) {
        await openRouterPort(port, protocol as any);
    } else {
        await closeRouterPort(port, protocol as any);
    }
    revalidatePath("/settings");
}

export async function syncRouterPort(port: number, gameSlug: string) {
    const protocol = gameSlug === 'cs2' ? 'both' : 'TCP'; // CS2 needs both, others usually TCP for connection
    await openRouterPort(port, protocol as any);
    revalidatePath("/settings");
}

export async function getUPNPConfig() {
    return await getInternalUPNPConfig();
}

export async function updateUPNPConfig(enabled: boolean) {
    await (db as any).systemSetting.upsert({
        where: { key: "AUTO_UPNP" },
        update: { value: enabled.toString() },
        create: { key: "AUTO_UPNP", value: enabled.toString() }
    });
    revalidatePath("/settings");
}

export async function getUsedPorts() {
    return await getInternalUsedPorts();
}

export async function getPortPoolConfig() {
    return await getInternalConfig();
}

export async function updatePortPoolConfig(start: number, end: number) {
    await updateInternalConfig(start, end);
    revalidatePath("/settings");
}
