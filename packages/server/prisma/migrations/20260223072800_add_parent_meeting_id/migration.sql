-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "parentMeetingId" TEXT;

-- CreateIndex
CREATE INDEX "Meeting_parentMeetingId_idx" ON "Meeting"("parentMeetingId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_parentMeetingId_fkey" FOREIGN KEY ("parentMeetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
