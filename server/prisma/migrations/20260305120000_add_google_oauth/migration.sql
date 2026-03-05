-- AlterTable: make password nullable for Google OAuth users
ALTER TABLE `users` MODIFY COLUMN `password` VARCHAR(191) NULL;

-- AlterTable: add googleId for Google OAuth linking
ALTER TABLE `users` ADD COLUMN `googleId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_googleId_key` ON `users`(`googleId`);
