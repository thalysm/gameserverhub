"use client";

import { useState } from "react";
import { Save, Server, FolderOpen, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GeneralSettings() {
  const [settings, setSettings] = useState({
    instanceName: "GameServerHub",
    dataPath: "/var/lib/gameserverhub",
    backupPath: "/var/backups/gameserverhub",
    maxServers: "10",
    autoStart: true,
    autoUpdate: true,
  });

  const handleSave = () => {
    // Save settings logic
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Server className="h-5 w-5 text-primary" />
          Configurações Gerais
        </h2>

        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Nome da Instância
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Nome exibido no painel e notificações
            </p>
            <input
              type="text"
              value={settings.instanceName}
              onChange={(e) =>
                setSettings({ ...settings, instanceName: e.target.value })
              }
              className="glass h-10 w-full max-w-md rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Diretório de Dados
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Onde os arquivos dos servidores serão armazenados
            </p>
            <div className="flex max-w-md gap-2">
              <input
                type="text"
                value={settings.dataPath}
                onChange={(e) =>
                  setSettings({ ...settings, dataPath: e.target.value })
                }
                className="glass h-10 w-full rounded-lg bg-transparent px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button
                variant="outline"
                size="icon"
                className="glass h-10 w-10 shrink-0 border-white/10 bg-transparent"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Diretório de Backups
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Onde os backups automáticos serão salvos
            </p>
            <div className="flex max-w-md gap-2">
              <input
                type="text"
                value={settings.backupPath}
                onChange={(e) =>
                  setSettings({ ...settings, backupPath: e.target.value })
                }
                className="glass h-10 w-full rounded-lg bg-transparent px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button
                variant="outline"
                size="icon"
                className="glass h-10 w-10 shrink-0 border-white/10 bg-transparent"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Máximo de Servidores
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Limite de servidores que podem rodar simultaneamente
            </p>
            <input
              type="number"
              value={settings.maxServers}
              onChange={(e) =>
                setSettings({ ...settings, maxServers: e.target.value })
              }
              className="glass h-10 w-24 rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
          <HardDrive className="h-5 w-5 text-primary" />
          Automação
        </h2>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/5">
            <div>
              <p className="font-medium text-foreground">Auto-iniciar servidores</p>
              <p className="text-sm text-muted-foreground">
                Iniciar servidores marcados automaticamente ao ligar o sistema
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoStart}
              onChange={(e) =>
                setSettings({ ...settings, autoStart: e.target.checked })
              }
              className="h-5 w-5 rounded border-border accent-primary"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/5">
            <div>
              <p className="font-medium text-foreground">Atualização automática</p>
              <p className="text-sm text-muted-foreground">
                Atualizar servidores de jogos automaticamente quando disponível
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoUpdate}
              onChange={(e) =>
                setSettings({ ...settings, autoUpdate: e.target.checked })
              }
              className="h-5 w-5 rounded border-border accent-primary"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
