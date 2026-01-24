"use client";

import { useState } from "react";
import { fixTerrariaImage } from "@/actions/fix-terraria";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function FixTerrariaPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleFix = async () => {
        setLoading(true);
        const res = await fixTerrariaImage();
        setResult(res);
        setLoading(false);

        if (res.success) {
            setTimeout(() => {
                router.push('/games');
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="glass rounded-xl p-8 max-w-md w-full space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Fix Terraria Image</h1>
                <p className="text-muted-foreground">
                    This will update the Terraria docker image from <code className="text-primary">ryanspice/terraria</code> to <code className="text-primary">ryshe/terraria</code>
                </p>

                <Button
                    onClick={handleFix}
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? "Fixing..." : "Fix Terraria Image"}
                </Button>

                {result && (
                    <div className={`p-4 rounded-lg ${result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                        <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                            {result.success ? '✅ ' + result.message : '❌ ' + result.error}
                        </p>
                        {result.success && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Redirecting to /games...
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
