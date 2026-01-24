"use client";

import { AppLayout } from "@/components/app-layout";
import { LayoutProvider } from "@/components/layout-context";
import { cn } from "@/lib/utils";
import { HostsSettings } from "@/components/settings/hosts-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { useState } from "react";
import { Globe, Settings, Server, Bell, Activity, Zap } from "lucide-react";
import { SystemStatus } from "@/components/settings/system-status";
import { PortPoolSettings } from "@/components/settings/port-pool-settings";



const tabs = [
  { id: "geral", label: "General", icon: Settings },
  { id: "hosts", label: "Hosts & Domains", icon: Globe },

  { id: "sistema", label: "System Status", icon: Activity },
  { id: "rede", label: "Connectivity", icon: Zap },
  { id: "notificacoes", label: "Notifications", icon: Bell },
];

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("hosts");

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your GameServerHub settings
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

          {activeTab === "sistema" && (
            <div className="glass rounded-xl p-6">
              <SystemStatus />
            </div>
          )}
          {activeTab === "rede" && (
            <PortPoolSettings />
          )}
          {activeTab === "notificacoes" && (
            <div className="glass rounded-xl p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Notifications
              </h2>
              <p className="text-sm text-muted-foreground">
                Coming soon: Configure alerts and notifications.
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
