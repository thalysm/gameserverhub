"use client";

import { useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAdmin } from "@/actions/auth-actions";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";

export function SetupForm() {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await registerAdmin(formData);
            if (result?.error) {
                toast.error(result.error);
            }
        });
    }

    return (
        <Card className="w-full max-w-md border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-primary">Configuração Inicial</CardTitle>
                <CardDescription>
                    Crie sua conta de administrador para gerenciar o GameServerHub.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" name="name" placeholder="Admin" required className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="admin@exemplo.com" required className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <PasswordInput id="password" name="password" required className="bg-secondary/50" />
                    </div>
                    <Button type="submit" className="w-full font-semibold" disabled={isPending}>
                        {isPending ? "Criando..." : "Criar Conta Admin"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
