import { AppLayout } from "@/components/app-layout";
import { LayoutProvider } from "@/components/layout-context";
import { ProfileClient } from "./profile-client";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const userId = await verifySession();

  if (!userId) {
    redirect("/"); // Or login if we had one
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <LayoutProvider>
      <AppLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações e preferências.</p>
        </div>
        <ProfileClient user={user} />
      </AppLayout>
    </LayoutProvider>
  );
}
