-- CreateTable
CREATE TABLE `waitlist_entries` (
    `id` VARCHAR(191) NOT NULL,
    `masterProfileId` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(100) NOT NULL,
    `clientPhone` VARCHAR(20) NOT NULL,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `requestedDate` DATE NOT NULL,
    `serviceName` VARCHAR(100) NULL,
    `preferredTime` VARCHAR(5) NULL,
    `note` VARCHAR(300) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'WAITING',
    `otpRequestId` VARCHAR(255) NULL,
    `notifiedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `waitlist_entries_masterProfileId_requestedDate_idx`(`masterProfileId`, `requestedDate`),
    INDEX `waitlist_entries_masterProfileId_status_idx`(`masterProfileId`, `status`),
    INDEX `waitlist_entries_status_expiresAt_idx`(`status`, `expiresAt`),
    UNIQUE INDEX `waitlist_entries_masterProfileId_clientPhone_requestedDate_key`(`masterProfileId`, `clientPhone`, `requestedDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `city` VARCHAR(191) NULL DEFAULT 'tbilisi',
    `districtId` VARCHAR(191) NULL,
    `heightCm` INTEGER NULL,
    `measurements` VARCHAR(60) NULL,
    `hairColor` VARCHAR(40) NULL,
    `eyeColor` VARCHAR(40) NULL,
    `bio` TEXT NULL,
    `niches` JSON NULL,
    `phone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `telegram` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `consentVersion` VARCHAR(191) NULL,
    `consentAt` DATETIME(3) NULL,
    `aiTrainingOptOut` BOOLEAN NOT NULL DEFAULT true,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE',
    `rejectionReason` VARCHAR(500) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `blurredAt` DATETIME(3) NULL,
    `withdrawnAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `model_profiles_userId_key`(`userId`),
    INDEX `model_profiles_verificationStatus_idx`(`verificationStatus`),
    INDEX `model_profiles_city_idx`(`city`),
    INDEX `model_profiles_districtId_idx`(`districtId`),
    INDEX `model_profiles_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_photos` (
    `id` VARCHAR(191) NOT NULL,
    `modelProfileId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(1000) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `model_photos_modelProfileId_moderationStatus_idx`(`modelProfileId`, `moderationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorite_models` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `modelProfileId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorite_models_userId_idx`(`userId`),
    INDEX `favorite_models_modelProfileId_idx`(`modelProfileId`),
    UNIQUE INDEX `favorite_models_userId_modelProfileId_key`(`userId`, `modelProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `master_profiles` ADD COLUMN `sellerApplicationReason` VARCHAR(500) NULL;

-- AddForeignKey
ALTER TABLE `waitlist_entries` ADD CONSTRAINT `waitlist_entries_masterProfileId_fkey` FOREIGN KEY (`masterProfileId`) REFERENCES `master_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_profiles` ADD CONSTRAINT `model_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_profiles` ADD CONSTRAINT `model_profiles_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_photos` ADD CONSTRAINT `model_photos_modelProfileId_fkey` FOREIGN KEY (`modelProfileId`) REFERENCES `model_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite_models` ADD CONSTRAINT `favorite_models_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite_models` ADD CONSTRAINT `favorite_models_modelProfileId_fkey` FOREIGN KEY (`modelProfileId`) REFERENCES `model_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
