"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getDomains, getPublicIp } from "@/actions/domain-actions";
import { verifyDomainDns } from "@/actions/system-actions";
import { Globe, Loader2, RefreshCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Domain {
    id: string;
    name: string;
}

interface DomainSelectorProps {
    onDomainChange: (domainId: string, subdomain: string, isDnsValid?: boolean) => void;
}

export function DomainSelector({ onDomainChange }: DomainSelectorProps) {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDomainId, setSelectedDomainId] = useState<string>("none");
    const [subdomain, setSubdomain] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [dnsStatus, setDnsStatus] = useState<{ pointed: boolean; message: string } | null>(null);

    const handleVerifyDns = async () => {
        const domain = domains.find(d => d.id === selectedDomainId);
        if (!domain) return;

        setVerifying(true);
        try {
            const publicIp = await getPublicIp();
            const fullDomain = subdomain ? `${subdomain}.${domain.name}` : domain.name;
            const result = await verifyDomainDns(fullDomain, publicIp);

            if (result.success) {
                if (result.isPointed) {
                    setDnsStatus({
                        pointed: true,
                        message: `O domínio está apontando corretamente para ${publicIp}.`
                    });
                } else {
                    setDnsStatus({
                        pointed: false,
                        message: `O domínio está apontando para ${result.foundIps?.join(', ') || 'outro lugar'}, mas deveria apontar para ${publicIp}.`
                    });
                }
            } else {
                setDnsStatus({
                    pointed: false,
                    message: `Não foi possível resolver o domínio. Verifique se você criou o registro ${subdomain ? 'CNAME' : 'A'} corretamente.`
                });
            }
        } catch (error) {
            setDnsStatus({ pointed: false, message: "Erro ao verificar DNS." });
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        async function loadDomains() {
            const data = await getDomains();
            // @ts-ignore
            setDomains(data);
            setLoading(false);
        }
        loadDomains();
    }, []);

    useEffect(() => {
        onDomainChange(selectedDomainId === "none" ? "" : selectedDomainId, subdomain, dnsStatus?.pointed);
    }, [selectedDomainId, subdomain, dnsStatus, onDomainChange]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando domínios...
            </div>
        );
    }

    if (domains.length === 0) {
        return (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-muted-foreground">
                Nenhum domínio configurado. Você pode adicionar um na página de <a href="/settings" className="text-primary hover:underline">Configurações</a>.
            </div>
        );
    }

    const selectedDomain = domains.find(d => d.id === selectedDomainId);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="domainId">Domínio</Label>
                    <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                        <SelectTrigger className="mt-1.5 border-white/5 bg-white/[0.02]">
                            <SelectValue placeholder="Selecione um domínio" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-xl">
                            <SelectItem value="none">Endereço padrão (IP:Porta)</SelectItem>
                            {domains.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedDomainId !== "none" && (
                    <div>
                        <Label htmlFor="subdomain">Subdomínio (opcional)</Label>
                        <Input
                            id="subdomain"
                            placeholder="Ex: mc, play, cs"
                            value={subdomain}
                            onChange={(e) => setSubdomain(e.target.value)}
                            className="mt-1.5 border-white/5 bg-white/[0.02]"
                        />
                    </div>
                )}
            </div>

            {selectedDomainId !== "none" && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3 text-xs text-primary">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>
                                Seu servidor será acessível por: <strong>{subdomain ? `${subdomain}.` : ""}{selectedDomain?.name}</strong>
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] uppercase font-bold tracking-wider hover:bg-primary/10"
                            onClick={handleVerifyDns}
                            disabled={verifying}
                        >
                            {verifying ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            ) : (
                                <RefreshCcw className="mr-1.5 h-3 w-3" />
                            )}
                            Verificar DNS
                        </Button>
                    </div>

                    {dnsStatus && (
                        <div className={cn(
                            "flex items-start gap-2 rounded-lg p-3 text-xs",
                            dnsStatus.pointed
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                            {dnsStatus.pointed ? (
                                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                            ) : (
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1">
                                <p className="font-semibold">{dnsStatus.pointed ? "DNS Configurado Corretamente" : "Atenção: DNS não resolvido"}</p>
                                <p className="mt-1 opacity-80">
                                    {dnsStatus.message}
                                </p>
                                {!dnsStatus.pointed && (
                                    <p className="mt-1 text-[10px] opacity-70 italic">
                                        * Pode levar alguns minutos para o DNS propagar.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
