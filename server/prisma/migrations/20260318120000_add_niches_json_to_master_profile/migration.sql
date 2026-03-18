-- AlterTable
ALTER TABLE `master_profiles` ADD COLUMN `niches` JSON NULL;

-- Backfill: copy existing niche values into niches array
UPDATE `master_profiles` SET `niches` = JSON_ARRAY(`niche`) WHERE `niche` IS NOT NULL AND `niches` IS NULL;
