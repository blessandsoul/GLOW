-- AlterTable
ALTER TABLE `users` ADD COLUMN `referralBonus` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `referrals` ADD COLUMN `referredPhone` VARCHAR(20) NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `referrals_referredPhone_idx` ON `referrals`(`referredPhone`);
