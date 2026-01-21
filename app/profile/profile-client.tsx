"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfileImage, changePassword, logout } from "@/actions/auth-actions";
import { toast } from "sonner";
import {
    Camera,
    Save,
    User,
    Mail,
    Shield,
    Key,
    Server,
    Clock,
    LogOut,
    Trash2
} from "lucide-react";

interface ProfileClientProps {
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
        role: string;
        createdAt: Date;
    };
}

export function ProfileClient({ user }: ProfileClientProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", e.target.files[0]);

        try {
            const result = await updateProfileImage(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile picture updated!");
            }
        } catch {
            toast.error("Error uploading image");
        } finally {
            setIsUploading(false);
        }
    }

    async function handlePasswordChange(formData: FormData) {
        setIsChangingPassword(true);
        try {
            const result = await changePassword(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success(result?.success || "Password changed!");
                (document.getElementById("passwordForm") as HTMLFormElement).reset();
            }
        } catch {
            toast.error("Error changing password");
        } finally {
            setIsChangingPassword(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl glass-strong border border-white/10 p-8">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <Shield className="h-32 w-32 text-primary/10 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="group relative">
                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary to-purple-600 opacity-75 blur transition duration-500 group-hover:opacity-100" />
                        <Avatar className="h-32 w-32 border-4 border-background relative">
                            <AvatarImage src={user.image || ""} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-secondary">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Label
                            htmlFor="image-upload"
                            className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:rotate-12"
                        >
                            {isUploading ? <span className="loading loading-spinner text-xs">...</span> : <Camera className="h-5 w-5" />}
                        </Label>
                        <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                        />
                    </div>

                    <div className="text-center md:text-left space-y-2 flex-1">
                        <h1 className="text-3xl font-bold tracking-tight text-white">{user.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full text-sm">
                                <Mail className="h-4 w-4" /> {user.email}
                            </span>
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full text-sm">
                                <Shield className="h-4 w-4 text-primary" /> {user.role}
                            </span>
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full text-sm">
                                <Clock className="h-4 w-4" /> Member since {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="destructive" className="glass-hover" onClick={async () => await logout()}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Info */}
                <Card className="glass border-primary/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Your account data</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 border border-white/5">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{user.name}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 border border-white/5">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{user.email}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>User ID</Label>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 border border-white/5 font-mono text-xs">
                                <Key className="h-3 w-3 text-muted-foreground" />
                                <span className="opacity-70">{user.id}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="glass border-primary/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Key className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Security</CardTitle>
                                <CardDescription>Change access password</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form id="passwordForm" action={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <PasswordInput id="currentPassword" name="currentPassword" required className="bg-secondary/50 border-white/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <PasswordInput id="newPassword" name="newPassword" required className="bg-secondary/50 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm</Label>
                                    <PasswordInput id="confirmPassword" name="confirmPassword" required className="bg-secondary/50 border-white/10" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20" disabled={isChangingPassword}>
                                <Save className="mr-2 h-4 w-4" />
                                {isChangingPassword ? "Changing..." : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Danger Zone */}
            <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-400" />
                        <CardTitle className="text-red-400">Danger Zone</CardTitle>
                    </div>
                    <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">This will permanently delete your account and all associated data.</p>
                        </div>
                        <Button variant="destructive" disabled title="Feature disabled for Main Admin">Delete Account</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
