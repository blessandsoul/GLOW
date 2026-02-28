-- AlterTable: Add phone verification fields to users
-- Step 1: Add columns (phone as nullable first to handle existing rows)
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `otpRequestId` VARCHAR(255) NULL;

-- Step 2: Backfill existing rows with placeholder phones based on their id
UPDATE `users` SET `phone` = CONCAT('+0', SUBSTRING(REPLACE(id, '-', ''), 1, 11)) WHERE `phone` IS NULL;

-- Step 3: Make phone NOT NULL and add unique index
ALTER TABLE `users` MODIFY COLUMN `phone` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_phone_key` ON `users`(`phone`);
