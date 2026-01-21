"use client";

import { useState } from "react";
import { Search, Bell, Heart, Settings, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLayout } from "./layout-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { NotificationPopover } from "./notification-popover";

export function StoreHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const { sidebarCollapsed } = useLayout();

  return (
    <header
      className={cn(
        "glass-strong sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/50 px-6 transition-all duration-300"
      )}
    >
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-white/5 bg-white/[0.02] pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:bg-white/[0.04] focus:outline-none transition-all"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="glass-hover h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/favorites">
            <Heart className="h-5 w-5" />
          </Link>
        </Button>
        <NotificationPopover />

        <Button
          variant="ghost"
          size="icon"
          className="glass-hover h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="glass-hover ml-2 flex h-10 items-center gap-2 rounded-lg px-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border-white/5 bg-background/80 backdrop-blur-xl"
          >
            <DropdownMenuItem className="text-foreground focus:bg-white/10" asChild>
              <Link href="/profile">My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground focus:bg-white/10" asChild>
              <Link href="/servers">My Servers</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground focus:bg-white/10" asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              className="text-destructive focus:bg-white/10 cursor-pointer"
              onClick={async () => {
                const { logout } = await import("@/actions/auth-actions");
                await logout();
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
