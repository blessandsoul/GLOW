-- AlterTable
ALTER TABLE `credit_packages` ADD COLUMN `description` VARCHAR(191) NULL,
    MODIFY `currency` VARCHAR(191) NOT NULL DEFAULT 'GEL';
