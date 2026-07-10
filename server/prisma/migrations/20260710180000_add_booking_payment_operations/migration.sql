-- Merchant-verification payment operations: explicit channels, refunds, ledger and payouts.

ALTER TABLE `master_profiles`
    ADD COLUMN `bookingPaymentChannel` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `isReviewProfile` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `bookings`
    ADD COLUMN `paymentChannel` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `prepaymentAmountMinor` INTEGER NULL,
    ADD COLUMN `cancellationFeeAmountMinor` INTEGER NULL,
    ADD COLUMN `manageTokenHash` VARCHAR(64) NULL,
    ADD COLUMN `manageTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `cancelledBy` VARCHAR(20) NULL,
    ADD COLUMN `cancellationReason` VARCHAR(500) NULL,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `earningEligibleAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `bookings_manageTokenHash_key` ON `bookings`(`manageTokenHash`);

ALTER TABLE `payments`
    ADD COLUMN `amountMinor` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `refundedAmountMinor` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `reconciliationRequired` BOOLEAN NOT NULL DEFAULT false;

UPDATE `payments`
SET `amountMinor` = `amount` * 100,
    `paidAt` = CASE WHEN `status` = 'PAID' THEN `updatedAt` ELSE NULL END,
    `reconciliationRequired` = CASE WHEN `status` = 'PAID' THEN true ELSE false END;

UPDATE `bookings` b
LEFT JOIN `payments` p ON p.`bookingId` = b.`id`
LEFT JOIN `master_profiles` mp ON mp.`id` = b.`masterProfileId`
SET b.`paymentChannel` = CASE WHEN p.`provider` = 'flitt' THEN 'FLITT' ELSE 'MANUAL' END,
    b.`prepaymentAmountMinor` = CASE WHEN b.`prepaymentAmount` IS NULL THEN NULL ELSE b.`prepaymentAmount` * 100 END,
    b.`cancellationFeeAmountMinor` = CASE
      WHEN b.`prepaymentAmount` IS NULL THEN NULL
      WHEN b.`paymentMode` = 'DEPOSIT' THEN b.`prepaymentAmount` * 100
      ELSE LEAST(b.`prepaymentAmount`, COALESCE(mp.`bookingPrepaymentAmount`, b.`prepaymentAmount`)) * 100
    END;

CREATE TABLE `refunds` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `reverseId` VARCHAR(64) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GEL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'REQUESTED',
    `reason` VARCHAR(500) NOT NULL,
    `actor` VARCHAR(20) NOT NULL,
    `actorUserId` VARCHAR(191) NULL,
    `policyCode` VARCHAR(40) NULL,
    `providerRefundId` VARCHAR(64) NULL,
    `failureCode` VARCHAR(100) NULL,
    `failureMessage` VARCHAR(500) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refunds_reverseId_key`(`reverseId`),
    INDEX `refunds_paymentId_status_idx`(`paymentId`, `status`),
    INDEX `refunds_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `master_ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `masterProfileId` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `paymentId` VARCHAR(191) NULL,
    `sourceKey` VARCHAR(191) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GEL',
    `availableAt` DATETIME(3) NOT NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `master_ledger_entries_sourceKey_key`(`sourceKey`),
    INDEX `master_ledger_entries_masterProfileId_availableAt_idx`(`masterProfileId`, `availableAt`),
    INDEX `master_ledger_entries_paymentId_idx`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payouts` (
    `id` VARCHAR(191) NOT NULL,
    `masterProfileId` VARCHAR(191) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GEL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `transferReference` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payouts_masterProfileId_status_idx`(`masterProfileId`, `status`),
    INDEX `payouts_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payout_items` (
    `id` VARCHAR(191) NOT NULL,
    `payoutId` VARCHAR(191) NOT NULL,
    `ledgerEntryId` VARCHAR(191) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payout_items_ledgerEntryId_key`(`ledgerEntryId`),
    INDEX `payout_items_payoutId_idx`(`payoutId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `refunds` ADD CONSTRAINT `refunds_paymentId_fkey`
    FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `master_ledger_entries` ADD CONSTRAINT `master_ledger_entries_masterProfileId_fkey`
    FOREIGN KEY (`masterProfileId`) REFERENCES `master_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `master_ledger_entries` ADD CONSTRAINT `master_ledger_entries_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `master_ledger_entries` ADD CONSTRAINT `master_ledger_entries_paymentId_fkey`
    FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_masterProfileId_fkey`
    FOREIGN KEY (`masterProfileId`) REFERENCES `master_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payout_items` ADD CONSTRAINT `payout_items_payoutId_fkey`
    FOREIGN KEY (`payoutId`) REFERENCES `payouts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payout_items` ADD CONSTRAINT `payout_items_ledgerEntryId_fkey`
    FOREIGN KEY (`ledgerEntryId`) REFERENCES `master_ledger_entries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
