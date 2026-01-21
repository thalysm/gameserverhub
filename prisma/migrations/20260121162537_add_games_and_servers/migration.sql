-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "defaultPort" INTEGER NOT NULL,
    "minRam" INTEGER NOT NULL,
    "recommendedRam" INTEGER NOT NULL,
    "supportsTcp" BOOLEAN NOT NULL DEFAULT false,
    "supportsUdp" BOOLEAN NOT NULL DEFAULT true,
    "dockerImage" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GameServer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "customHost" TEXT,
    "ramMb" INTEGER NOT NULL,
    "cpuCores" INTEGER NOT NULL,
    "containerId" TEXT,
    "containerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "gameConfig" TEXT NOT NULL DEFAULT '{}',
    "autoStart" BOOLEAN NOT NULL DEFAULT true,
    "autoRestart" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameServer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GameServer_containerName_key" ON "GameServer"("containerName");
