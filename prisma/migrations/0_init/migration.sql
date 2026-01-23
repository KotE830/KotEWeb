-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TrackSource" AS ENUM ('youtube', 'soundcloud', 'spotify', 'other');

-- CreateTable
CREATE TABLE "players" (
    "guildId" TEXT NOT NULL,
    "currentTrack" JSONB,
    "queue" JSONB NOT NULL,
    "isRepeating" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "uri" TEXT NOT NULL,
    "source" "TrackSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TagToTrack" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TagToTrack_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_guildId_key" ON "players"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_uri_key" ON "tracks"("uri");

-- CreateIndex
CREATE INDEX "tracks_title_artist_idx" ON "tracks"("title", "artist");

-- CreateIndex
CREATE INDEX "tracks_userId_idx" ON "tracks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_source_sourceId_key" ON "tracks"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "_TagToTrack_B_index" ON "_TagToTrack"("B");

-- AddForeignKey
ALTER TABLE "_TagToTrack" ADD CONSTRAINT "_TagToTrack_A_fkey" FOREIGN KEY ("A") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTrack" ADD CONSTRAINT "_TagToTrack_B_fkey" FOREIGN KEY ("B") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

