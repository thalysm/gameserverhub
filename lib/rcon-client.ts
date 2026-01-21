import * as net from 'net';

export async function sendRconCommand(host: string, port: number, password: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const requestId = Math.floor(Math.random() * 100000);
        let authenticated = false;
        let responseBuffer = "";
        let dataAccumulator = Buffer.alloc(0);

        const timeout = setTimeout(() => {
            client.destroy();
            reject(new Error('RCON timeout (15s) - O servidor está muito lento para responder (cheque o uso de CPU).'));
        }, 15000);

        client.connect(port, host, () => {
            const authPacket = createRconPacket(requestId, 3, password);
            client.write(authPacket);
        });

        client.on('data', (data: Buffer) => {
            dataAccumulator = Buffer.concat([dataAccumulator, data]);

            while (dataAccumulator.length >= 12) {
                const size = dataAccumulator.readInt32LE(0);
                if (dataAccumulator.length < size + 4) break; // Aguarda pacote completo

                const id = dataAccumulator.readInt32LE(4);
                const type = dataAccumulator.readInt32LE(8);

                // Extrai o corpo removendo os dois null terminators finais
                const body = dataAccumulator.toString('utf8', 12, 12 + size - 10);

                // Remove o pacote do acumulador
                dataAccumulator = dataAccumulator.subarray(size + 4);

                if (!authenticated) {
                    // Packet type 2 é a resposta de autenticação
                    if (id === requestId && type === 2) {
                        authenticated = true;
                        // 2. Envia o comando real
                        client.write(createRconPacket(requestId + 1, 2, command));
                        // 3. Envia um "Terminador" (pacote vazio) para garantir que recebemos tudo
                        client.write(createRconPacket(requestId + 2, 2, ""));
                    } else if (id === -1) {
                        clearTimeout(timeout);
                        client.destroy();
                        reject(new Error('Autenticação RCON falhou: Senha Inválida.'));
                        return;
                    }
                } else {
                    if (id === requestId + 1) {
                        // Acumula resposta do comando principal
                        responseBuffer += body;
                    } else if (id === requestId + 2) {
                        // Recebeu o terminador, encerra e retorna
                        clearTimeout(timeout);
                        client.destroy();
                        resolve(responseBuffer.trim());
                        return;
                    }
                }
            }
        });

        client.on('error', (err) => {
            clearTimeout(timeout);
            client.destroy();
            reject(new Error(`Erro de rede RCON: ${err.message}`));
        });
    });
}

function createRconPacket(id: number, type: number, body: string): Buffer {
    const bodyBuf = Buffer.from(body, 'utf8');
    const size = bodyBuf.length + 10;
    const packet = Buffer.alloc(size + 4);

    packet.writeInt32LE(size, 0);
    packet.writeInt32LE(id, 4);
    packet.writeInt32LE(type, 8);
    bodyBuf.copy(packet, 12);
    packet.writeUInt8(0, 12 + bodyBuf.length);
    packet.writeUInt8(0, 12 + bodyBuf.length + 1);

    return packet;
}
