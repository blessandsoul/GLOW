ALTER TABLE `payments`
    ADD COLUMN `activeRefundId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `payments_activeRefundId_key`
    ON `payments`(`activeRefundId`);
