"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, deleteSession, verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

export async function registerAdmin(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Todos os campos são obrigatórios" };
    }

    const existingUser = await db.user.findFirst();

    if (existingUser) {
        return { error: "Já existe um administrador configurado." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    await createSession(user.id);
    redirect("/");
}



export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Preencha todos os campos" };
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return { error: "Credenciais inválidas" };
    }

    await createSession(user.id);
    redirect("/");
}

export async function logout() {
    await deleteSession();
    redirect("/login");
}

export async function updateProfileImage(formData: FormData) {
    const userId = await verifySession();
    if (!userId) return { error: "Não autorizado" };

    const file = formData.get("image") as File;
    if (!file || file.size === 0) {
        return { error: "Nenhuma imagem selecionada" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${userId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), buffer);

        const imagePath = `/uploads/${filename}`;
        await db.user.update({
            where: { id: userId },
            data: { image: imagePath },
        });

        revalidatePath("/perfil");
        return { success: true, imagePath };
    } catch (error) {
        console.error("Erro ao salvar imagem:", error);
        return { error: "Falha ao salvar a imagem" };
    }
}

export async function changePassword(formData: FormData) {
    const userId = await verifySession();
    if (!userId) return { error: "Não autorizado" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "Todos os campos são obrigatórios" };
    }

    if (newPassword !== confirmPassword) {
        return { error: "As novas senhas não coincidem" };
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuário não encontrado" };

    const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordsMatch) {
        return { error: "Senha atual incorreta" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return { success: "Senha alterada com sucesso!" };
}

