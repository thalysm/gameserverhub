"use server";

import Docker from 'dockerode';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

const docker = new Docker({
    socketPath: process.platform === 'win32'
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock'
});

export async function checkDockerStatus() {
    try {
        await docker.ping();
        return { online: true };
    } catch (error) {
        return { online: false, error: "Docker não está rodando ou não está acessível." };
    }
}

export async function verifyDomainDns(domain: string, expectedIp: string) {
    try {
        const addresses = await resolve4(domain);
        const isPointed = addresses.includes(expectedIp);
        return {
            success: true,
            isPointed,
            foundIps: addresses
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.code === 'ENOTFOUND' ? 'Domínio não encontrado' : 'Erro ao verificar DNS'
        };
    }
}

import { db } from '@/lib/db';
