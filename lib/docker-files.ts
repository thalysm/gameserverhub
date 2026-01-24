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
    fileContent: Buffer | Readable,
    fileName: string,
    targetPath: string = '/data',
    fileSize?: number
): Promise<void> {
    try {
        const container = docker.getContainer(containerId);

        // Create tar archive with the file
        const pack = tar.pack();

        if (Buffer.isBuffer(fileContent)) {
            pack.entry({ name: fileName }, fileContent);
            pack.finalize();
        } else {
            if (!fileSize) throw new Error("File size required for stream upload");
            const entry = pack.entry({ name: fileName, size: fileSize }, (err) => {
                if (err) console.error("Tar entry error:", err);
                pack.finalize();
            });
            fileContent.pipe(entry);
        }

        // Ensure target path exists and has correct permissions
        try {
            // We use 'sh -c' to run multiple commands. Assuming standard Linux container.
            // Hytale user is usually 1000.
            const exec = await container.exec({
                Cmd: ['sh', '-c', `mkdir -p "${targetPath}" && chown -R 1000:1000 "${targetPath}"`],
                User: "root", // Ensure we run as root to fix permissions
                AttachStdout: false,
                AttachStderr: false,
            });
            await exec.start({ Detach: false });
        } catch (e) {
            console.warn("Failed to ensure directory exists/permissions, trying upload anyway:", e);
        }

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

export async function extractContainerArchive(
    containerId: string,
    filePath: string,
    destPath: string
): Promise<void> {
    try {
        const container = docker.getContainer(containerId);

        let cmd = '';
        if (filePath.endsWith('.zip')) {
            cmd = `unzip -o "${filePath}" -d "${destPath}" || jar xf "${filePath}"`;
        } else if (filePath.endsWith('.tar.gz') || filePath.endsWith('.tgz')) {
            cmd = `tar -xzf "${filePath}" -C "${destPath}"`;
        } else if (filePath.endsWith('.tar')) {
            cmd = `tar -xf "${filePath}" -C "${destPath}"`;
        } else {
            throw new Error('Unsupported archive format');
        }

        const exec = await container.exec({
            Cmd: ['sh', '-c', `${cmd} && chown -R 1000:1000 "${destPath}"`],
            User: "root",
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ Detach: false });

        await new Promise((resolve, reject) => {
            let err = '';
            stream.on('data', (c) => err += c.toString());
            stream.on('end', () => resolve(true));
            stream.on('error', reject);
        });

    } catch (error) {
        console.error('Error extracting archive:', error);
        throw error;
    }
}
