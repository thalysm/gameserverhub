import natUpnp from 'nat-upnp';

const client = natUpnp.createClient();

export async function openRouterPort(port: number, protocol: 'TCP' | 'UDP' | 'both'): Promise<boolean> {
    const protocols = protocol === 'both' ? ['TCP', 'UDP'] : [protocol];

    try {
        for (const proto of protocols) {
            await new Promise<void>((resolve, reject) => {
                client.portMapping({
                    public: port,
                    private: port,
                    ttl: 0,
                    protocol: proto,
                    description: `GSH Server Port ${port}`
                }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log(`UPnP: Opened ${proto} port ${port} on router`);
        }
        return true;
    } catch (error) {
        console.error('UPnP Error opening port:', error);
        return false;
    }
}

export async function closeRouterPort(port: number, protocol: 'TCP' | 'UDP' | 'both'): Promise<boolean> {
    const protocols = protocol === 'both' ? ['TCP', 'UDP'] : [protocol];

    try {
        for (const proto of protocols) {
            await new Promise<void>((resolve, reject) => {
                client.portUnmapping({
                    public: port,
                    protocol: proto
                }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log(`UPnP: Closed ${proto} port ${port} on router`);
        }
        return true;
    } catch (error) {
        console.error('UPnP Error closing port:', error);
        return false;
    }
}

export async function checkUPnPStatus(): Promise<boolean> {
    try {
        return await new Promise<boolean>((resolve) => {
            client.externalIp((err, ip) => {
                if (err || !ip) resolve(false);
                else resolve(true);
            });
            // Timeout if router doesn't respond
            setTimeout(() => resolve(false), 3000);
        });
    } catch {
        return false;
    }
}

export async function getRouterMappings(): Promise<any[]> {
    try {
        return await new Promise<any[]>((resolve, reject) => {
            client.getMappings((err, list) => {
                if (err) resolve([]);
                else resolve(list || []);
            });
            // Timeout to avoid hanging
            setTimeout(() => resolve([]), 3000);
        });
    } catch {
        return [];
    }
}

export function isPortMappedInList(mappings: any[], port: number): boolean {
    return mappings.some(m => {
        const publicPort = typeof m.public === 'object' ? m.public.port : m.public;
        return Number(publicPort) === port;
    });
}
