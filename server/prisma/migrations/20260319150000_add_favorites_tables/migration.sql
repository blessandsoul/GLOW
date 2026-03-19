-- CreateTable
CREATE TABLE `favorite_masters` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `masterProfileId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorite_masters_userId_idx`(`userId`),
    INDEX `favorite_masters_masterProfileId_idx`(`masterProfileId`),
    UNIQUE INDEX `favorite_masters_userId_masterProfileId_key`(`userId`, `masterProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorite_portfolio_items` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `portfolioItemId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorite_portfolio_items_userId_idx`(`userId`),
    INDEX `favorite_portfolio_items_portfolioItemId_idx`(`portfolioItemId`),
    UNIQUE INDEX `favorite_portfolio_items_userId_portfolioItemId_key`(`userId`, `portfolioItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `favorite_masters` ADD CONSTRAINT `favorite_masters_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite_masters` ADD CONSTRAINT `favorite_masters_masterProfileId_fkey` FOREIGN KEY (`masterProfileId`) REFERENCES `master_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite_portfolio_items` ADD CONSTRAINT `favorite_portfolio_items_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite_portfolio_items` ADD CONSTRAINT `favorite_portfolio_items_portfolioItemId_fkey` FOREIGN KEY (`portfolioItemId`) REFERENCES `portfolio_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
