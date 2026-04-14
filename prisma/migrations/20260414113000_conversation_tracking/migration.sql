-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "opportunityId" TEXT,
    "conversationDate" TIMESTAMP(3) NOT NULL,
    "conversationType" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'External',
    "counterpartyName" TEXT NOT NULL DEFAULT '',
    "counterpartyRole" TEXT NOT NULL DEFAULT '',
    "counterpartyEmail" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT '',
    "nextStep" TEXT NOT NULL DEFAULT '',
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "isExternal" BOOLEAN NOT NULL DEFAULT true,
    "isNewLead" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "weeklyTarget" INTEGER NOT NULL,
    "quarterlyTarget" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyQuota_userId_key" ON "WeeklyQuota"("userId");
CREATE INDEX "Conversation_userId_conversationDate_idx" ON "Conversation"("userId", "conversationDate");
CREATE INDEX "Conversation_conversationDate_idx" ON "Conversation"("conversationDate");
CREATE INDEX "Conversation_organizationId_idx" ON "Conversation"("organizationId");
CREATE INDEX "Conversation_opportunityId_idx" ON "Conversation"("opportunityId");
CREATE INDEX "Conversation_deletedAt_idx" ON "Conversation"("deletedAt");
CREATE INDEX "WeeklyQuota_tier_idx" ON "WeeklyQuota"("tier");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyQuota" ADD CONSTRAINT "WeeklyQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateView
CREATE OR REPLACE VIEW "weekly_conversation_stats" AS
SELECT
  u.id AS user_id,
  u.name AS user_name,
  u.tier AS tier,
  date_trunc('week', c."conversationDate")::date AS week_start,
  COUNT(c.id)::int AS conversations_count,
  SUM(CASE WHEN c."isNewLead" THEN 1 ELSE 0 END)::int AS new_leads_count,
  COALESCE(wq."weeklyTarget", 0)::int AS weekly_target,
  COALESCE(wq."quarterlyTarget", 0)::int AS quarterly_target,
  CASE
    WHEN COALESCE(wq."weeklyTarget", 0) = 0 THEN 0
    ELSE ROUND((COUNT(c.id)::numeric * 100.0) / wq."weeklyTarget", 2)
  END AS progress_pct
FROM "User" u
LEFT JOIN "Conversation" c ON c."userId" = u.id AND c."deletedAt" IS NULL
LEFT JOIN "WeeklyQuota" wq ON wq."userId" = u.id
GROUP BY u.id, u.name, u.tier, wq."weeklyTarget", wq."quarterlyTarget", date_trunc('week', c."conversationDate");
