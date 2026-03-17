-- AlterTable: Add new fields to master_profiles
ALTER TABLE `master_profiles` ADD COLUMN `languages` JSON NULL,
    ADD COLUMN `locationType` VARCHAR(191) NULL,
    ADD COLUMN `districtId` VARCHAR(191) NULL,
    ADD COLUMN `workingHours` JSON NULL;

-- CreateTable: districts
CREATE TABLE `districts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `citySlug` VARCHAR(191) NOT NULL DEFAULT 'tbilisi',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `districts_slug_key`(`slug`),
    INDEX `districts_citySlug_isActive_sortOrder_idx`(`citySlug`, `isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: brands
CREATE TABLE `brands` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(1000) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `brands_slug_key`(`slug`),
    INDEX `brands_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: style_tags
CREATE TABLE `style_tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `niche` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `style_tags_slug_key`(`slug`),
    INDEX `style_tags_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    INDEX `style_tags_niche_idx`(`niche`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: master_brands (junction)
CREATE TABLE `master_brands` (
    `masterProfileId` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `master_brands_brandId_idx`(`brandId`),
    PRIMARY KEY (`masterProfileId`, `brandId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: master_style_tags
CREATE TABLE `master_style_tags` (
    `masterProfileId` VARCHAR(191) NOT NULL,
    `styleTagId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `master_style_tags_styleTagId_idx`(`styleTagId`),
    PRIMARY KEY (`masterProfileId`, `styleTagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `master_profiles_districtId_idx` ON `master_profiles`(`districtId`);
CREATE INDEX `master_profiles_locationType_idx` ON `master_profiles`(`locationType`);

-- AddForeignKey
ALTER TABLE `master_profiles` ADD CONSTRAINT `master_profiles_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `master_brands` ADD CONSTRAINT `master_brands_masterProfileId_fkey` FOREIGN KEY (`masterProfileId`) REFERENCES `master_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `master_brands` ADD CONSTRAINT `master_brands_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `master_style_tags` ADD CONSTRAINT `master_style_tags_masterProfileId_fkey` FOREIGN KEY (`masterProfileId`) REFERENCES `master_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `master_style_tags` ADD CONSTRAINT `master_style_tags_styleTagId_fkey` FOREIGN KEY (`styleTagId`) REFERENCES `style_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
