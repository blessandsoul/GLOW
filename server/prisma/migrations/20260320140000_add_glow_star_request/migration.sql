-- AlterTable
ALTER TABLE `master_profiles` ADD COLUMN `glowStarStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE';
ALTER TABLE `master_profiles` ADD COLUMN `glowStarRequestedAt` DATETIME(3) NULL;
ALTER TABLE `master_profiles` ADD COLUMN `glowStarReviewedAt` DATETIME(3) NULL;
