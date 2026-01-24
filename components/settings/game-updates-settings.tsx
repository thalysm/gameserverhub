"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSystemSettings, saveSystemSettings, updateGameCovers } from "@/actions/system-actions";
import { toast } from "sonner";
import { Loader2, Save, Download, Gamepad2 } from "lucide-react";

export function GameUpdatesSettings() {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getSystemSettings();
            setClientId(settings["TWITCH_CLIENT_ID"] || "");
            setClientSecret(settings["TWITCH_CLIENT_SECRET"] || "");
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await saveSystemSettings({
                "TWITCH_CLIENT_ID": clientId,
                "TWITCH_CLIENT_SECRET": clientSecret
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Settings saved successfully");
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCovers = async () => {
        if (!clientId || !clientSecret) {
            toast.error("Please save your Client ID and Secret first.");
            return;
        }

        setUpdating(true);
        toast.loading("Updating game covers from IGDB...", { id: "update-covers" });

        try {
            const result = await updateGameCovers();

            if (result.error) {
                toast.error(result.error, { id: "update-covers" });
            } else {
                toast.success(`Updated ${result.updatedCount} game covers!`, { id: "update-covers" });
            }
        } catch (error) {
            toast.error("Failed to update covers", { id: "update-covers" });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6 border border-white/5">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Gamepad2 className="h-5 w-5 text-primary" />
                            Game Metadata
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Configure Twitch/IGDB API access to automatically fetch game covers and metadata.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 max-w-xl">
                    <div className="space-y-2">
                        <Label htmlFor="client-id">Twitch Client ID</Label>
                        <Input
                            id="client-id"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="Enter your Twitch Client ID"
                            className="bg-black/20 border-white/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="client-secret">Twitch Client Secret</Label>
                        <Input
                            id="client-secret"
                            type="password"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            placeholder="Enter your Twitch Client Secret"
                            className="bg-black/20 border-white/10"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Credentials
                        </Button>

                        <Button
                            onClick={handleUpdateCovers}
                            disabled={updating || !clientId || !clientSecret}
                            variant="outline"
                            className="border-white/10 hover:bg-white/5"
                        >
                            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Update Game Covers
                        </Button>
                    </div>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                    <h4 className="font-semibold text-blue-400 mb-2">How to get keys?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Go to the <a href="https://dev.twitch.tv/console" target="_blank" rel="noreferrer" className="text-primary hover:underline">Twitch Developer Console</a>.</li>
                        <li>Register a new application.</li>
                        <li>Copy the <strong>Client ID</strong> and generate a <strong>Client Secret</strong>.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
