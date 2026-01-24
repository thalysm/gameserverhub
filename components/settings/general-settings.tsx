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
          General Settings
        </h2>

        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Instance Name
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Name displayed on dashboard and notifications
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
              Data Directory
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Where server files will be stored
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
              Backup Directory
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Where automatic backups will be saved
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
              Max Servers
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Limit of servers that can run simultaneously
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
          Automation
        </h2>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/5">
            <div>
              <p className="font-medium text-foreground">Auto-start servers</p>
              <p className="text-sm text-muted-foreground">
                Automatically start marked servers on system boot
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
              <p className="font-medium text-foreground">Auto Update</p>
              <p className="text-sm text-muted-foreground">
                Automatically update game servers when available
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
          Save Settings
        </Button>
      </div>
    </div>
  );
}
