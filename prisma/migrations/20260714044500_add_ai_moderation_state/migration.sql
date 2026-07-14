CREATE TYPE "AIInsightModerationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'FLAGGED', 'HIDDEN');

ALTER TABLE "AIInsight"
ADD COLUMN "moderationStatus" "AIInsightModerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "moderationNote" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "moderatedById" TEXT,
ADD COLUMN "hiddenAt" TIMESTAMP(3);
