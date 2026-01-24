import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { LayoutProvider } from "@/components/layout-context";
import { AppLayout } from "@/components/app-layout";
import { getGameCover } from "@/lib/games-data";
import { MinecraftServerForm } from "@/components/minecraft-server-form";
import { CS2ServerForm } from "@/components/cs2-server-form";
import { TerrariaServerForm } from "@/components/terraria-server-form";
import { HytaleServerForm } from "@/components/hytale-server-form";
import { getGameBySlug } from "@/lib/games-data";

function CreateServerContent({ slug, game }: { slug: string, game: any }) {
  // const game = getGameBySlug(slug); // Removed static fetch

  if (!game) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">
              Game not found
            </h1>
            <Button asChild>
              <Link href="/games">View all games</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-10 w-10 shrink-0"
        >
          <Link href="/games">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl">
            <Image
              src={game.image || getGameCover(game.slug)}
              alt={game.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Create Server - {game.name}
            </h1>
            <p className="text-muted-foreground">
              Configure your dedicated server
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {slug === "minecraft" && <MinecraftServerForm />}
          {slug === "cs2" && <CS2ServerForm />}
          {slug === "terraria" && <TerrariaServerForm />}
          {slug === "hytale" && <HytaleServerForm />}
          {slug !== "minecraft" && slug !== "cs2" && slug !== "terraria" && slug !== "hytale" && (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-muted-foreground">
                Server creation for {game.name} is coming soon!
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          <div className="glass sticky top-24 rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              About {game.name}
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Create and manage your own {game.name} server with full control
                over settings and configurations.
              </p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-primary">
                  💡 Your server will be created as a Docker container and can
                  be managed through this dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

import { db } from "@/lib/db";

async function getGameData(slug: string) {
  const game = await db.game.findFirst({
    where: { slug }
  });
  return game;
}

export default async function CreateServerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameData(slug);

  return (
    <LayoutProvider>
      <CreateServerContent game={game} slug={slug} />
    </LayoutProvider>
  );
}
