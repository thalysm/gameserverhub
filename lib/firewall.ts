import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function openFirewallPort(port: number, protocol: "tcp" | "udp" | "both"): Promise<void> {
    const protocols = protocol === "both" ? ["tcp", "udp"] : [protocol];

    for (const proto of protocols) {
        const ruleName = `GSH Port ${port} ${proto.toUpperCase()}`;
        try {
            // First try to delete existing rule to avoid duplicates
            await execAsync(`netsh advfirewall firewall delete rule name="${ruleName}"`).catch(() => { });

            // Add new rule
            const command = `netsh advfirewall firewall add rule name="${ruleName}" dir=in action=allow protocol=${proto.toUpperCase()} localport=${port}`;
            await execAsync(command);
            console.log(`Firewall: Opened ${proto.toUpperCase()} port ${port}`);
        } catch (error) {
            console.error(`Failed to open firewall port ${port}/${proto}:`, error);
            // On non-Windows or if lacking permissions, this will fail. 
            // We log but don't necessarily block server start unless it's critical.
        }
    }
}

export async function closeFirewallPort(port: number, protocol: "tcp" | "udp" | "both"): Promise<void> {
    const protocols = protocol === "both" ? ["tcp", "udp"] : [protocol];

    for (const proto of protocols) {
        const ruleName = `GSH Port ${port} ${proto.toUpperCase()}`;
        try {
            await execAsync(`netsh advfirewall firewall delete rule name="${ruleName}"`);
            console.log(`Firewall: Closed ${proto.toUpperCase()} port ${port}`);
        } catch (error) {
            console.error(`Failed to close firewall port ${port}/${proto}:`, error);
        }
    }
}
