"use client";

import { StoreSidebar } from "@/components/store-sidebar";
import { StoreHeader } from "@/components/store-header";
import { useLayout } from "@/components/layout-context";
import { cn } from "@/lib/utils";
import { ServerMonitor } from "./server-monitor";

interface AppLayoutProps {
    children: React.ReactNode;
    className?: string; // Allow passing custom classes to main
}

export function AppLayout({ children, className }: AppLayoutProps) {
    const { sidebarCollapsed } = useLayout();

    return (
        <div className="min-h-screen bg-background">
            <StoreSidebar />
            <ServerMonitor />
            <div
                className={cn(
                    "flex min-h-screen flex-col transition-all duration-300",
                    sidebarCollapsed ? "ml-16" : "ml-72"
                )}
            >
                <StoreHeader />
                <main className={cn("flex-1 p-6", className)}>
                    {children}
                </main>
            </div>
        </div>
    );
}
