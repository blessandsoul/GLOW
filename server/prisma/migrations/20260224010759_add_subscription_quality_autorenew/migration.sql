-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `quality` VARCHAR(191) NOT NULL DEFAULT 'mid';

-- CreateIndex
CREATE INDEX `subscriptions_status_currentPeriodEnd_idx` ON `subscriptions`(`status`, `currentPeriodEnd`);
