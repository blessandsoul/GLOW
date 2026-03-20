-- AlterTable
ALTER TABLE `master_profiles` ADD COLUMN `masterTier` VARCHAR(191) NOT NULL DEFAULT 'JUNIOR';
ALTER TABLE `master_profiles` ADD COLUMN `tierSortOrder` INTEGER NOT NULL DEFAULT 3;

-- CreateIndex
CREATE INDEX `master_profiles_tierSortOrder_idx` ON `master_profiles`(`tierSortOrder`);
