"use client";

import {
  User,
  Mail,
  Shield,
  Key,
  Server,
  Clock,
  Activity,
  Camera,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
// import { StoreSidebar } from "@/components/store-sidebar";
// import { StoreHeader } from "@/components/store-header";
import { LayoutProvider, useLayout } from "@/components/layout-context";

const userStats = {
  totalServers: 4,
  onlineServers: 2,
  totalUptime: "156h",
  lastLogin: "Agora",
};

function ProfileContent() {
  // const { sidebarCollapsed } = useLayout();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "Admin",
    email: "admin@meusite.com.br",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Gerencie suas informações pessoais e segurança
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass rounded-xl p-6">
            <div className="flex flex-col items-center">
              <div className="group relative mb-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-foreground">{formData.name}</h2>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">
                <Shield className="h-3 w-3" />
                Administrador
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="glass rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                  <Server className="h-4 w-4 text-primary" />
                  {userStats.totalServers}
                </div>
                <p className="text-xs text-muted-foreground">Servidores</p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-semibold text-green-400">
                  <Activity className="h-4 w-4" />
                  {userStats.onlineServers}
                </div>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {userStats.totalUptime}
                </div>
                <p className="text-xs text-muted-foreground">Uptime Total</p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-foreground">{userStats.lastLogin}</div>
                <p className="text-xs text-muted-foreground">Último Login</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="glass rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <User className="h-5 w-5 text-primary" />
              Informações Pessoais
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="border-white/5 bg-white/[0.02] text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:bg-white/[0.04]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="border-white/5 bg-white/[0.02] text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>

          {/* Security */}
          <div className="glass rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Key className="h-5 w-5 text-primary" />
              Segurança
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-foreground">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="border-white/5 bg-white/[0.02] pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:bg-white/[0.04]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    placeholder="Digite a nova senha"
                    className="border-white/5 bg-white/[0.02] text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:bg-white/[0.04]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="border-white/5 bg-white/[0.02] text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:bg-white/[0.04]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Key className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass rounded-xl border border-red-500/20 p-6">
            <h3 className="mb-4 text-lg font-semibold text-red-400">Zona de Perigo</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Ações irreversíveis. Tenha cuidado ao executar essas operações.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-400 bg-transparent">
                Exportar Dados
              </Button>
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-400 bg-transparent">
                Excluir Conta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function PerfilPage() {
  return (
    <LayoutProvider>
      <ProfileContent />
    </LayoutProvider>
  );
}
