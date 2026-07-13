-- Add missing marketplace seller-status columns expected by the Prisma schema.
ALTER TABLE `master_profiles`
    ADD COLUMN `sellerStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE',
    ADD COLUMN `sellerRequestedAt` DATETIME(3) NULL,
    ADD COLUMN `sellerApprovedAt` DATETIME(3) NULL,
    ADD COLUMN `sellerApprovedBy` VARCHAR(191) NULL,
    ADD COLUMN `sellerRejectedReason` VARCHAR(500) NULL;
