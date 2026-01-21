"use client";

import {
  Home,
  Heart,
  LayoutGrid,
  Plus,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLayout } from "./layout-context";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Heart, label: "Favorites", href: "/favorites" },
  { icon: Server, label: "My Servers", href: "/servers" },
  { icon: LayoutGrid, label: "Categories", href: "/categories" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function StoreSidebar() {
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useLayout();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "glass-strong fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 shrink-0">
              <Image src="/gamehub.png" alt="GameServerHub Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight leading-none">
              <span className="text-white">GAMESERVER</span>
              <span className="text-[#7c3aed]">HUB</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto relative h-8 w-8 shrink-0">
            <Image src="/gamehub.png" alt="GameHub Logo" fill className="object-contain" />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "glass-hover flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
              isActive(item.href)
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border/50 p-3">
        {bottomItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "glass-hover flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
              isActive(item.href)
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <Link href="/games" className="mt-2 flex w-full items-center gap-3 rounded-lg bg-primary/20 px-3 py-2.5 text-sm text-primary transition-all hover:bg-primary/30">
          <Plus className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Create Server</span>}
        </Link>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="glass absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
