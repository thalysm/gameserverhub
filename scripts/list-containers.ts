import Docker from 'dockerode';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

async function run() {
    const containers = await docker.listContainers();
    console.log(JSON.stringify(containers.map(c => ({
        Names: c.Names,
        Image: c.Image,
        Ports: c.Ports
    })), null, 2));
}
run();
