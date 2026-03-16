-- AlterTable
ALTER TABLE `master_profiles` ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE',
    ADD COLUMN `idDocumentUrl` VARCHAR(1000) NULL,
    ADD COLUMN `rejectionReason` VARCHAR(500) NULL,
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    ADD COLUMN `verifiedBy` VARCHAR(191) NULL,
    ADD COLUMN `certificateUrl` VARCHAR(1000) NULL,
    ADD COLUMN `hygienePicsUrl` JSON NULL,
    ADD COLUMN `qualityProductsUrl` JSON NULL,
    ADD COLUMN `experienceYears` INTEGER NULL,
    ADD COLUMN `isCertified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isHygieneVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isQualityProducts` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isTopRated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `workAddress` VARCHAR(500) NULL;

-- CreateIndex
CREATE INDEX `master_profiles_verificationStatus_idx` ON `master_profiles`(`verificationStatus`);
