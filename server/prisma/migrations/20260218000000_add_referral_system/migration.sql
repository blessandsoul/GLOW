-- AlterTable
ALTER TABLE `users` ADD COLUMN `referralCode` VARCHAR(191) NULL,
    ADD COLUMN `referredById` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `users_referralCode_key`(`referralCode`);

-- CreateTable
CREATE TABLE `referrals` (
    `id` VARCHAR(191) NOT NULL,
    `referrerId` VARCHAR(191) NOT NULL,
    `referredId` VARCHAR(191) NOT NULL,
    `rewardGiven` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `referrals_referredId_key`(`referredId`),
    INDEX `referrals_referrerId_idx`(`referrerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
