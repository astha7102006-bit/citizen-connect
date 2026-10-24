-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'OFFICIAL', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'ACTION_TAKEN', 'RESOLVED', 'CLOSED', 'APPEALED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('COMPLAINT_SUBMITTED', 'ACKNOWLEDGEMENT_RECORDED', 'CITIZEN_EVIDENCE_ADDED', 'OFFICIAL_RESPONSE_RECEIVED', 'INVESTIGATION_STARTED', 'INVESTIGATION_PROGRESS_UPDATED', 'ADDITIONAL_INFO_REQUESTED', 'CITIZEN_INFO_PROVIDED', 'DEPARTMENT_TRANSFER_REQUESTED', 'DEPARTMENT_TRANSFER_COMPLETED', 'DEADLINE_APPROACHING', 'DEADLINE_MISSED', 'COMPLAINT_ESCALATED', 'REVIEWER_FINDING_RECORDED', 'COMPLAINT_CLOSED', 'APPEAL_SUBMITTED', 'COMPLAINT_REOPENED', 'CORRECTION_RECORDED');

-- CreateEnum
CREATE TYPE "EvidenceVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED_DUPLICATE');

-- CreateEnum
CREATE TYPE "OfficialResponseType" AS ENUM ('INTERIM', 'FINAL_REDRESSAL', 'CLARIFICATION', 'TRANSFER_JUSTIFICATION');

-- CreateEnum
CREATE TYPE "OfficialResponseStatus" AS ENUM ('DRAFT', 'REVIEW_PENDING', 'APPROVED', 'PUBLISHED', 'CONTESTED');

-- CreateEnum
CREATE TYPE "EscalationTriggerType" AS ENUM ('AUTOMATIC_SLA_LAPSE', 'CITIZEN_APPEAL', 'MANUAL_REVIEW_ESCALATION');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'SUPERSEDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "officeLocation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "slaDaysLevel1" INTEGER NOT NULL DEFAULT 7,
    "slaDaysLevel2" INTEGER NOT NULL DEFAULT 15,
    "slaDaysLevel3" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "stage" INTEGER NOT NULL DEFAULT 1,
    "stageName" TEXT NOT NULL DEFAULT 'Level 1: Grievance Officer Assigned',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isRestrictedFromPublic" BOOLEAN NOT NULL DEFAULT false,
    "restrictionReason" TEXT,
    "restrictedAt" TIMESTAMP(3),
    "citizenId" TEXT,
    "departmentId" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slaDaysRemaining" INTEGER DEFAULT 7,
    "targetCompletionDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_events" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "eventId" TEXT,
    "complaintId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "previousStatus" "ComplaintStatus",
    "newStatus" "ComplaintStatus",
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "responsibleDepartment" TEXT,
    "title" TEXT,
    "details" TEXT NOT NULL,
    "reason" TEXT,
    "previousHash" TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    "hash" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "uploaderId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256Fingerprint" TEXT NOT NULL,
    "verificationStatus" "EvidenceVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "isRedacted" BOOLEAN NOT NULL DEFAULT false,
    "redactedStorageKey" TEXT,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_responses" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorDesignation" TEXT,
    "responseText" TEXT NOT NULL,
    "responseType" "OfficialResponseType" NOT NULL DEFAULT 'INTERIM',
    "status" "OfficialResponseStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isApprovedByReviewer" BOOLEAN NOT NULL DEFAULT true,
    "hearingDate" TIMESTAMP(3),
    "contestedReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "escalationLevel" INTEGER NOT NULL,
    "fromLevel" INTEGER NOT NULL DEFAULT 1,
    "toLevel" INTEGER NOT NULL DEFAULT 2,
    "reason" TEXT NOT NULL,
    "triggerType" "EscalationTriggerType" NOT NULL DEFAULT 'AUTOMATIC_SLA_LAPSE',
    "triggerTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineTimestamp" TIMESTAMP(3),
    "status" "EscalationStatus" NOT NULL DEFAULT 'ACTIVE',
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_isActive_idx" ON "departments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_referenceNumber_key" ON "complaints"("referenceNumber");

-- CreateIndex
CREATE INDEX "complaints_referenceNumber_idx" ON "complaints"("referenceNumber");

-- CreateIndex
CREATE INDEX "complaints_departmentId_idx" ON "complaints"("departmentId");

-- CreateIndex
CREATE INDEX "complaints_citizenId_idx" ON "complaints"("citizenId");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaints_stage_idx" ON "complaints"("stage");

-- CreateIndex
CREATE INDEX "complaints_filedAt_idx" ON "complaints"("filedAt");

-- CreateIndex
CREATE INDEX "complaint_events_complaintId_idx" ON "complaint_events"("complaintId");

-- CreateIndex
CREATE INDEX "complaint_events_eventType_idx" ON "complaint_events"("eventType");

-- CreateIndex
CREATE INDEX "complaint_events_timestamp_idx" ON "complaint_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_events_complaintId_sequence_key" ON "complaint_events"("complaintId", "sequence");

-- CreateIndex
CREATE INDEX "evidence_complaintId_idx" ON "evidence"("complaintId");

-- CreateIndex
CREATE INDEX "evidence_sha256Fingerprint_idx" ON "evidence"("sha256Fingerprint");

-- CreateIndex
CREATE INDEX "evidence_verificationStatus_idx" ON "evidence"("verificationStatus");

-- CreateIndex
CREATE INDEX "official_responses_complaintId_idx" ON "official_responses"("complaintId");

-- CreateIndex
CREATE INDEX "official_responses_authorId_idx" ON "official_responses"("authorId");

-- CreateIndex
CREATE INDEX "official_responses_responseType_idx" ON "official_responses"("responseType");

-- CreateIndex
CREATE INDEX "official_responses_status_idx" ON "official_responses"("status");

-- CreateIndex
CREATE INDEX "escalations_complaintId_idx" ON "escalations"("complaintId");

-- CreateIndex
CREATE INDEX "escalations_escalationLevel_idx" ON "escalations"("escalationLevel");

-- CreateIndex
CREATE INDEX "escalations_status_idx" ON "escalations"("status");

-- CreateIndex
CREATE INDEX "escalations_triggerTimestamp_idx" ON "escalations"("triggerTimestamp");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_events" ADD CONSTRAINT "complaint_events_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_events" ADD CONSTRAINT "complaint_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_responses" ADD CONSTRAINT "official_responses_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_responses" ADD CONSTRAINT "official_responses_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
