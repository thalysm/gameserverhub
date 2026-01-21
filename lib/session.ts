import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createSession(userId: string) {
    (await cookies()).set("user_id", userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });
}

export async function verifySession() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    return userId;
}

export async function deleteSession() {
    (await cookies()).delete("user_id");
}
