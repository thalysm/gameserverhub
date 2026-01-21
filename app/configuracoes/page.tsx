"use client";

import { AppLayout } from "@/components/app-layout";
import { LayoutProvider } from "@/components/layout-context";
import { cn } from "@/lib/utils";
import { HostsSettings } from "@/components/settings/hosts-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { useState } from "react";
import { Globe, Settings, Server, Bell } from "lucide-react";

const tabs = [
  { id: "geral", label: "Geral", icon: Settings },
  { id: "hosts", label: "Hosts & Domínios", icon: Globe },
  { id: "servidores", label: "Servidores", icon: Server },
  { id: "notificacoes", label: "Notificações", icon: Bell },
];

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("hosts");

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações do seu GameServerHub
        </p>
      </div>

      <div className="flex gap-6">
        <nav className="glass w-64 shrink-0 rounded-xl p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                activeTab === tab.id
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {activeTab === "geral" && <GeneralSettings />}
          {activeTab === "hosts" && <HostsSettings />}
          {activeTab === "servidores" && (
            <div className="glass rounded-xl p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Configurações de Servidores
              </h2>
              <p className="text-sm text-muted-foreground">
                Em breve: Configurações padrão para novos servidores.
              </p>
            </div>
          )}
          {activeTab === "notificacoes" && (
            <div className="glass rounded-xl p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Notificações
              </h2>
              <p className="text-sm text-muted-foreground">
                Em breve: Configure alertas e notificações.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function ConfiguracoesPage() {
  return (
    <LayoutProvider>
      <SettingsContent />
    </LayoutProvider>
  );
}
