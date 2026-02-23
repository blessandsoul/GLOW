/*
  Warnings:

  - Added the required column `language` to the `captions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `captions` ADD COLUMN `language` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(1000) NULL;
