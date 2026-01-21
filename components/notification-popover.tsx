"use client";

import { useEffect, useState } from "react";
import { Bell, Info, AlertTriangle, XCircle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notification-actions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationPopover() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = async () => {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
        // Periodically refresh notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "INFO": return <Info className="h-4 w-4 text-blue-500" />;
            case "WARNING": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case "ERROR": return <XCircle className="h-4 w-4 text-red-500" />;
            case "SUCCESS": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default: return <Info className="h-4 w-4 text-primary" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="glass-hover relative h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 border-white/5 bg-background/80 p-0 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/5 p-4">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-primary hover:underline"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "flex gap-3 p-4 transition-colors hover:bg-white/5",
                                        !n.read && "bg-primary/5"
                                    )}
                                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                                >
                                    <div className="mt-1 shrink-0">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                            {n.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="border-t border-white/5 p-2 text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" disabled>
                        View all history
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
