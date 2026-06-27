-- AlterTable
ALTER TABLE `master_profiles`
    ADD COLUMN `bookingEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bookingPrepaymentEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bookingPrepaymentAmount` INTEGER NULL DEFAULT 20,
    ADD COLUMN `bookingPaymentInfo` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `masterProfileId` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(100) NOT NULL,
    `clientPhone` VARCHAR(20) NOT NULL,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `serviceName` VARCHAR(100) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(5) NOT NULL,
    `endTime` VARCHAR(5) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `prepaymentRequired` BOOLEAN NOT NULL DEFAULT false,
    `prepaymentAmount` INTEGER NULL,
    `depositStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE',
    `otpRequestId` VARCHAR(255) NULL,
    `note` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookings_masterProfileId_date_idx`(`masterProfileId`, `date`),
    INDEX `bookings_masterProfileId_status_idx`(`masterProfileId`, `status`),
    INDEX `bookings_date_status_idx`(`date`, `status`),
    INDEX `bookings_clientPhone_date_idx`(`clientPhone`, `date`),
    UNIQUE INDEX `bookings_masterProfileId_date_startTime_key`(`masterProfileId`, `date`, `startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_masterProfileId_fkey` FOREIGN KEY (`masterProfileId`) REFERENCES `master_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
