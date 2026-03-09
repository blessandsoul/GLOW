-- AlterTable: make jobId optional, add userId and updatedAt
ALTER TABLE `reviews` MODIFY `jobId` VARCHAR(191) NULL;

ALTER TABLE `reviews` ADD COLUMN `userId` VARCHAR(191) NULL;
ALTER TABLE `reviews` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `reviews_userId_idx` ON `reviews`(`userId`);

-- CreateUniqueIndex: one review per user per master
CREATE UNIQUE INDEX `reviews_userId_masterId_key` ON `reviews`(`userId`, `masterId`);

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
