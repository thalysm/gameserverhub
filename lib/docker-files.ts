import { docker } from './docker';
import { Readable } from 'stream';
import * as tar from 'tar-stream';

export async function listContainerFiles(containerId: string, path: string = '/data'): Promise<any[]> {
    try {
        const container = docker.getContainer(containerId);

        // Execute ls command in container
        const exec = await container.exec({
            Cmd: ['ls', '-lah', path],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ Detach: false });

        return new Promise((resolve, reject) => {
            let output = '';
            stream.on('data', (chunk: Buffer) => {
                output += chunk.toString('utf-8');
            });
            stream.on('end', () => {
                // Parse ls output
                const files = parseLsOutput(output);
                resolve(files);
            });
            stream.on('error', reject);
        });
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
}

function parseLsOutput(output: string): any[] {
    const lines = output.split('\n').filter(line => line.trim());
    const files: any[] = [];

    // Skip first line (total) and parse each file
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Remove ANSI codes
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');

        const parts = cleanLine.split(/\s+/);
        if (parts.length < 9) continue;

        const permissions = parts[0];
        const isDirectory = permissions.startsWith('d');
        const size = parts[4];
        const name = parts.slice(8).join(' ');

        // Skip . and ..
        if (name === '.' || name === '..') continue;

        files.push({
            name,
            type: isDirectory ? 'directory' : 'file',
            size: isDirectory ? 0 : parseInt(size) || 0,
            permissions,
        });
    }

    return files;
}

export async function uploadFileToContainer(
    containerId: string,
    fileBuffer: Buffer,
    fileName: string,
    targetPath: string = '/data'
): Promise<void> {
    try {
        const container = docker.getContainer(containerId);

        // Create tar archive with the file
        const pack = tar.pack();
        pack.entry({ name: fileName }, fileBuffer);
        pack.finalize();

        // Upload to container
        await container.putArchive(pack, { path: targetPath });
        console.log(`File ${fileName} uploaded to ${targetPath}`);
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

export async function downloadFileFromContainer(
    containerId: string,
    filePath: string
): Promise<Buffer> {
    try {
        const container = docker.getContainer(containerId);

        // Get file as tar archive
        const stream = await container.getArchive({ path: filePath });

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            stream.on('end', () => {
                const tarBuffer = Buffer.concat(chunks);

                // Extract file from tar
                const extract = tar.extract();
                let fileBuffer: Buffer | null = null;

                extract.on('entry', (header, stream, next) => {
                    const chunks: Buffer[] = [];
                    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                    stream.on('end', () => {
                        fileBuffer = Buffer.concat(chunks);
                        next();
                    });
                    stream.resume();
                });

                extract.on('finish', () => {
                    if (fileBuffer) {
                        resolve(fileBuffer);
                    } else {
                        reject(new Error('File not found in archive'));
                    }
                });

                extract.end(tarBuffer);
            });

            stream.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

export async function deleteFileFromContainer(
    containerId: string,
    filePath: string
): Promise<void> {
    try {
        const container = docker.getContainer(containerId);

        const exec = await container.exec({
            Cmd: ['rm', '-rf', filePath],
            AttachStdout: true,
            AttachStderr: true,
        });

        await exec.start({ Detach: false });
        console.log(`File ${filePath} deleted`);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

export async function createContainerBackup(containerId: string, path: string = "/data"): Promise<Buffer> {
    try {
        const container = docker.getContainer(containerId);
        const stream = await container.getArchive({ path });

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => resolve(Buffer.concat(chunks)));
            stream.on("error", reject);
        });
    } catch (error) {
        console.error("Error creating backup:", error);
        throw error;
    }
}
