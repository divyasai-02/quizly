-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('AI_QUIZ_GENERATED', 'STUDENT_PERFORMANCE_RISK', 'QUIZ_COMPLETED', 'REPORT_GENERATED', 'NEW_QUIZ_ASSIGNED', 'RESULT_AVAILABLE', 'WEAK_TOPIC_PRACTICE_RECOMMENDED', 'BADGE_UNLOCKED', 'LEADERBOARD_RANK_UPDATED', 'ADMIN_AI_GENERATION_CREATED', 'ADMIN_NEW_USER_REGISTERED', 'ADMIN_LOW_CONFIDENCE_AI_GENERATION', 'ADMIN_PLATFORM_ACTIVITY_SUMMARY');

-- AlterTable
ALTER TABLE "PlatformSetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "context" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_role_read_idx" ON "Notification"("userId", "role", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
