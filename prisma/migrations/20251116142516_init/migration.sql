-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "staffMessageId" TEXT,
    "hostId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "worldName" TEXT NOT NULL,
    "worldLink" TEXT,
    "tag" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instanceType" TEXT NOT NULL,
    "vrchatProfile" TEXT,
    "instanceLink" TEXT,
    "maxParticipants" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recruiting',
    "staffId" TEXT,
    "staffName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "participants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invitationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "participants_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_threadId_key" ON "invitations"("threadId");

-- CreateIndex
CREATE INDEX "idx_invitation_list" ON "invitations"("status", "tag", "startTime");

-- CreateIndex
CREATE INDEX "idx_invitation_host" ON "invitations"("hostId", "startTime");

-- CreateIndex
CREATE INDEX "idx_invitation_auto_close" ON "invitations"("status", "endTime");

-- CreateIndex
CREATE INDEX "idx_invitation_recent" ON "invitations"("startTime");

-- CreateIndex
CREATE INDEX "idx_participant_user_history" ON "participants"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_participant_invitation_status" ON "participants"("invitationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "participants_invitationId_userId_key" ON "participants"("invitationId", "userId");

-- CreateIndex
CREATE INDEX "idx_ticket_open" ON "tickets"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_ticket_user_history" ON "tickets"("userId", "createdAt");
