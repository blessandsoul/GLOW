-- AlterTable
ALTER TABLE `users` ADD COLUMN `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `users` ADD COLUMN `metadata` JSON NULL;
