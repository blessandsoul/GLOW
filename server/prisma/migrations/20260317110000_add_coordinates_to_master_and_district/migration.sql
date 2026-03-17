-- AlterTable
ALTER TABLE `master_profiles` ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `isManualLocation` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `districts` ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL;

-- CreateIndex
CREATE INDEX `master_profiles_latitude_longitude_idx` ON `master_profiles`(`latitude`, `longitude`);
