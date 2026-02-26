-- AlterTable
ALTER TABLE `users` MODIFY `credits` INTEGER NOT NULL DEFAULT 5;

-- Update existing users who still have the old default of 3
UPDATE `users` SET `credits` = 5 WHERE `credits` = 3;
