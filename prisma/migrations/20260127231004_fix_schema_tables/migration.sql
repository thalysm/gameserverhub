-- CreateTable
CREATE TABLE "UserDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserDomain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameServer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "customHost" TEXT,
    "domainId" TEXT,
    "subdomain" TEXT,
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
    CONSTRAINT "GameServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameServer_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "UserDomain" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameServer" ("autoRestart", "autoStart", "containerId", "containerName", "cpuCores", "createdAt", "customHost", "gameConfig", "gameId", "id", "name", "port", "ramMb", "status", "updatedAt", "userId") SELECT "autoRestart", "autoStart", "containerId", "containerName", "cpuCores", "createdAt", "customHost", "gameConfig", "gameId", "id", "name", "port", "ramMb", "status", "updatedAt", "userId" FROM "GameServer";
DROP TABLE "GameServer";
ALTER TABLE "new_GameServer" RENAME TO "GameServer";
CREATE UNIQUE INDEX "GameServer_containerName_key" ON "GameServer"("containerName");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "UserDomain_name_key" ON "UserDomain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_gameId_key" ON "Favorite"("userId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
