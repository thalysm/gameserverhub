import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
    const hasUser = await db.user.findFirst();

    if (hasUser) {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <SetupForm />
        </div>
    );
}
