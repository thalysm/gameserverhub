"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Check,
  Copy,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDomains, addDomain, deleteDomain, getPublicIp } from "@/actions/domain-actions";
import { verifyDomainDns } from "@/actions/system-actions";
import { toast } from "sonner";

interface Host {
  id: string;
  name: string;
  servers: any[];
  createdAt: string | Date;
}

export function HostsSettings() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [publicIp, setPublicIp] = useState<string>("Carregando...");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [dnsStatus, setDnsStatus] = useState<Record<string, { ok: boolean, checked: boolean }>>({});

  const [newHost, setNewHost] = useState({
    domain: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [domainsData, ipData] = await Promise.all([
      getDomains(),
      getPublicIp()
    ]);
    // @ts-ignore
    setHosts(domainsData);
    setPublicIp(ipData);
    setLoading(false);
  };

  const handleAddHost = async () => {
    if (!newHost.domain) return;
    setIsSubmitting(true);

    const result = await addDomain(newHost.domain);
    if (result.success) {
      toast.success("Domain added successfully!");
      setNewHost({ domain: "" });
      setShowAddForm(false);
      fetchData();
    } else {
      toast.error(result.error || "Failed to add domain");
    }
    setIsSubmitting(false);
  };

  const handleDeleteHost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this domain? This will affect servers using it.")) return;

    const result = await deleteDomain(id);
    if (result.success) {
      toast.success("Domain deleted!");
      fetchData();
    } else {
      toast.error(result.error || "Failed to delete domain");
    }
  };

  const handleVerifyDns = async (id: string, domain: string) => {
    setVerifyingId(id);
    const result = await verifyDomainDns(domain, publicIp);
    if (result.success) {
      setDnsStatus(prev => ({ ...prev, [id]: { ok: result.isPointed || false, checked: true } }));
      if (result.isPointed) {
        toast.success("DNS configured correctly!");
      } else {
        toast.error(`DNS does not yet point to ${publicIp}.`);
      }
    } else {
      toast.error(result.error || "Error checking DNS");
    }
    setVerifyingId(null);
  };

  const copyToClipboard = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              Hosts & Domains
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure custom domains. Point your DNS to the public IP below.
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>

        <div className="glass mb-6 overflow-hidden rounded-xl border border-white/5">
          <div className="bg-primary/10 px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">DNS Configuration Tutorial</span>
          </div>

          <div className="p-4 grid gap-6 md:grid-cols-2">
            {/* Registro A */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</div>
                <h3 className="font-semibold text-foreground text-sm">Step 1: Main Domain (A Record)</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                In your domain provider (Cloudflare, GoDaddy, etc), create an <span className="text-foreground font-bold underline decoration-primary/50">A</span> record.
              </p>
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-4 border border-white/5">
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">IP Value (@ Record)</p>
                  <code className="text-xl font-black text-primary tracking-tighter">{publicIp}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(publicIp, 'ip')}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
                  title="Copy IP"
                >
                  {copiedId === 'ip' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Registro CNAME */}
            <div className="space-y-4 border-l border-white/5 pl-6">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">2</div>
                <h3 className="font-semibold text-foreground text-sm">Step 2: Subdomains (CNAME Record)</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For each server (e.g. <span className="text-foreground font-bold">play</span>.site.com), create a <span className="text-foreground font-bold underline decoration-primary/50">CNAME</span> pointing to your main domain:
              </p>
              <div className="space-y-3 rounded-lg bg-white/[0.03] p-4 border border-white/5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium uppercase tracking-widest text-[9px]">Type:</span>
                  <span className="font-mono text-foreground font-bold bg-white/5 px-2 py-1 rounded">CNAME</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium uppercase tracking-widest text-[9px]">Name (Host):</span>
                  <span className="font-mono text-foreground font-bold bg-white/5 px-2 py-1 rounded">play / mc / server</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium uppercase tracking-widest text-[9px]">Target:</span>
                  <span className="font-mono text-primary font-bold bg-primary/5 px-2 py-1 rounded border border-primary/20">your-domain.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] px-4 py-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-yellow-500/20">
                <span className="text-yellow-500 text-[10px] font-black">!</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                <span className="text-foreground font-bold">Why use CNAME?</span> If your IP changes in the future, you only need to update Step 1 (A Record). All subdomains will keep working automatically.
              </p>
            </div>
          </div>
        </div>

        {showAddForm && (
          <div className="glass mb-6 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="mb-4 font-medium text-foreground">New Domain</h3>
            <div className="grid gap-4 sm:grid-cols-1">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Main Domain
                </label>
                <input
                  type="text"
                  placeholder="mysite.com"
                  value={newHost.domain}
                  onChange={(e) =>
                    setNewHost({ ...newHost, domain: e.target.value })
                  }
                  className="glass h-10 w-full rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHost()}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddHost}
                disabled={isSubmitting || !newHost.domain}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {hosts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No domains configured.
            </div>
          ) : (
            hosts.map((host) => (
              <div
                key={host.id}
                className="glass glass-hover flex flex-wrap items-center gap-4 rounded-lg p-4 transition-all sm:flex-nowrap"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      dnsStatus[host.id]?.checked
                        ? (dnsStatus[host.id]?.ok ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]")
                        : "bg-muted"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground text-lg">
                        {host.name}
                      </span>
                      <button
                        onClick={() => copyToClipboard(host.name, host.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {copiedId === host.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {host.servers.length} servidor(es)
                      </p>
                      {dnsStatus[host.id]?.checked && (
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          dnsStatus[host.id]?.ok ? "text-green-500" : "text-red-500"
                        )}>
                          • {dnsStatus[host.id]?.ok ? "DNS OK" : "DNS PENDING"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => handleVerifyDns(host.id, host.name)}
                    disabled={verifyingId === host.id}
                  >
                    {verifyingId === host.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Verify DNS
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDeleteHost(host.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
