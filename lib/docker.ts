import Docker from 'dockerode';

// Initialize Docker client
const docker = new Docker({
    socketPath: process.platform === 'win32'
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock'
});

export interface ContainerConfig {
    name: string;
    image: string;
    port: number;
    internalPort: number;
    protocol: 'tcp' | 'udp' | 'both';
    ramMb: number;
    cpuCores: number;
    env: Record<string, string>;
    dataDir: string;
    tty?: boolean;
    cmd?: string[];
    extraPorts?: { port: number; internalPort: number; protocol: 'tcp' | 'udp' | 'both' }[];
}

export async function createAndStartContainer(config: ContainerConfig): Promise<string> {
    try {
        // Ensure network exists
        const networks = await docker.listNetworks();
        if (!networks.find(n => n.Name === 'game-server-hub_app-network')) {
            console.log('Creating network game-server-hub_app-network...');
            await docker.createNetwork({
                Name: 'game-server-hub_app-network',
                Driver: 'bridge'
            });
        }

        // ...
        const existingContainers = await docker.listContainers({ all: true });
        const existing = existingContainers.find(c =>
            c.Names.some(name => name === `/${config.name}`)
        );

        if (existing) {
            console.log(`Container ${config.name} already exists. Removing to apply fresh configuration...`);
            const container = docker.getContainer(existing.Id);
            if (existing.State === 'running') {
                await container.stop({ t: 2 });
            }
            await container.remove({ force: true });
        }

        await pullImage(config.image);

        const portKey = `${config.internalPort}/${config.protocol === 'both' ? 'tcp' : config.protocol}`;
        const portBindings: any = {};
        const exposedPorts: any = {};

        if (config.internalPort > 0) {
            const addPort = (p: number, ip: number, proto: string) => {
                if (proto === 'both') {
                    portBindings[`${ip}/tcp`] = [{ HostPort: p.toString() }];
                    portBindings[`${ip}/udp`] = [{ HostPort: p.toString() }];
                    exposedPorts[`${ip}/tcp`] = {};
                    exposedPorts[`${ip}/udp`] = {};
                } else {
                    portBindings[`${ip}/${proto}`] = [{ HostPort: p.toString() }];
                    exposedPorts[`${ip}/${proto}`] = {};
                }
            };

            const addInternalOnly = (ip: number, proto: string) => {
                if (proto === 'both') {
                    exposedPorts[`${ip}/tcp`] = {};
                    exposedPorts[`${ip}/udp`] = {};
                } else {
                    exposedPorts[`${ip}/${proto}`] = {};
                }
            };

            if (config.port > 0) {
                addPort(config.port, config.internalPort, config.protocol);
            } else {
                addInternalOnly(config.internalPort, config.protocol);
            }

            // Handle extra ports
            if (config.extraPorts) {
                for (const extra of config.extraPorts) {
                    addPort(extra.port, extra.internalPort, extra.protocol);
                }
            }
        }

        const container = await docker.createContainer({
            name: config.name,
            Image: config.image,
            Env: Object.entries(config.env).map(([key, value]) => `${key}=${value}`),
            Cmd: config.cmd,
            HostConfig: {
                PortBindings: portBindings,
                Memory: config.ramMb * 1024 * 1024,
                NanoCpus: config.cpuCores * 1000000000,
                RestartPolicy: {
                    Name: 'unless-stopped',
                },
                Binds: [
                    `${config.name}-data:${config.dataDir}`,
                ],
                NetworkMode: 'game-server-hub_app-network',
            },
            ExposedPorts: exposedPorts,
            Tty: config.tty || false,
        });

        // Start container
        console.log(`Creating container with PortBindings:`, JSON.stringify(portBindings));
        await container.start();
        console.log(`Container ${config.name} created and started`);

        // Get container info
        const info = await container.inspect();
        return info.Id;
    } catch (error) {
        console.error('Error creating container:', error);
        throw error;
    }
}

export async function stopContainer(containerId: string): Promise<void> {
    try {
        const container = docker.getContainer(containerId);
        await container.stop({ t: 10 }); // 10 seconds grace period
    } catch (error) {
        console.error('Error stopping container:', error);
        throw error;
    }
}

export async function removeContainer(containerId: string): Promise<void> {
    try {
        const container = docker.getContainer(containerId);
        await container.remove({ force: true, v: true });
    } catch (error) {
        console.error('Error removing container:', error);
        throw error;
    }
}

export async function getContainerStats(containerId: string): Promise<any> {
    try {
        const container = docker.getContainer(containerId);
        const stats = await container.stats({ stream: false });

        // Calculate CPU percentage
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

        // Calculate memory usage
        const memoryUsage = stats.memory_stats.usage;
        const memoryLimit = stats.memory_stats.limit;
        const memoryPercent = (memoryUsage / memoryLimit) * 100;

        return {
            cpu: cpuPercent.toFixed(2),
            memory: {
                usage: (memoryUsage / 1024 / 1024).toFixed(2), // MB
                limit: (memoryLimit / 1024 / 1024).toFixed(2), // MB
                percent: memoryPercent.toFixed(2),
            },
        };
    } catch (error: any) {
        if (error.statusCode !== 404) {
            console.error('Error getting container stats:', error);
        }
        return null;
    }
}

export async function getContainerLogs(containerId: string, tail: number = 100): Promise<string> {
    try {
        const container = docker.getContainer(containerId);
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail,
            timestamps: true,
        });

        return logs.toString('utf-8');
    } catch (error: any) {
        if (error.statusCode !== 404) {
            console.error('Error getting container logs:', error);
        }
        return '';
    }
}

export async function execCommandInContainer(
    containerId: string,
    cmd: string[]
): Promise<string> {
    try {
        const container = docker.getContainer(containerId);
        const exec = await container.exec({
            Cmd: cmd,
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ Detach: false });

        return new Promise((resolve, reject) => {
            let output = '';
            stream.on('data', (chunk: Buffer) => {
                output += chunk.toString('utf-8');
            });
            stream.on('end', () => resolve(output));
            stream.on('error', reject);
        });
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}

export async function getContainerStatus(containerId: string): Promise<string> {
    try {
        const container = docker.getContainer(containerId);
        const info = await container.inspect();
        return info.State.Status;
    } catch (error: any) {
        if (error.statusCode !== 404) {
            console.error('Error getting container status:', error);
        }
        return 'error';
    }
}

async function pullImage(image: string): Promise<void> {
    console.log(`Pulling Docker image: ${image}...`);
    return new Promise((resolve, reject) => {
        docker.pull(image, (err: any, stream: any) => {
            if (err) {
                console.error(`Error pulling image ${image}:`, err);
                reject(err);
                return;
            }

            docker.modem.followProgress(
                stream,
                (err: any) => {
                    if (err) {
                        console.error(`Error during image pull ${image}:`, err);
                        reject(err);
                    } else {
                        console.log(`Successfully pulled image: ${image}`);
                        resolve();
                    }
                },
                (event: any) => {
                    // Log progress
                    if (event.status) {
                        console.log(`${image}: ${event.status} ${event.progress || ''}`);
                    }
                }
            );
        });
    });
}

export async function listContainers(): Promise<any[]> {
    try {
        return await docker.listContainers({ all: true });
    } catch (error) {
        console.error('Error listing containers:', error);
        return [];
    }
}

export async function fixVolumePermissions(volumeName: string): Promise<void> {
    try {
        console.log(`Fixing permissions for volume: ${volumeName}`);

        await pullImage('busybox');

        const container = await docker.createContainer({
            Image: 'busybox',
            User: '0:0', // Run as root
            Cmd: ['sh', '-c', 'chown -R 1000:1000 /data && chmod -R 777 /data'],
            HostConfig: {
                Binds: [`${volumeName}:/data`],
            },
        });
        await container.start();
        await container.wait();
        await container.remove();
        console.log(`Permissions (777) and ownership fixed for volume: ${volumeName}`);
    } catch (error) {
        console.error(`Error fixing permissions for volume ${volumeName}:`, error);
    }
}

export async function writeToVolume(volumeName: string, filePath: string, content: string): Promise<void> {
    try {
        console.log(`Writing to file ${filePath} in volume ${volumeName}`);

        await pullImage('busybox');

        // Use base64 to avoid escaping issues with newlines and special characters
        const base64Content = Buffer.from(content).toString('base64');

        const container = await docker.createContainer({
            Image: 'busybox',
            User: '0:0',
            Cmd: ['sh', '-c', `echo "${base64Content}" | base64 -d > /data/${filePath} && chown 1000:1000 /data/${filePath} && chmod 664 /data/${filePath}`],
            HostConfig: {
                Binds: [`${volumeName}:/data`],
            },
        });
        await container.start();
        await container.wait();
        await container.remove();
        console.log(`Successfully wrote to ${filePath} in volume ${volumeName}`);
    } catch (error) {
        console.error(`Error writing to volume ${volumeName}:`, error);
        throw error;
    }
}

export { docker };
