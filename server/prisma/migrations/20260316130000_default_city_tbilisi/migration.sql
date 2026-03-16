-- AlterTable: set default city to 'tbilisi'
ALTER TABLE `master_profiles` ALTER COLUMN `city` SET DEFAULT 'tbilisi';

-- Update existing rows with NULL city
UPDATE `master_profiles` SET `city` = 'tbilisi' WHERE `city` IS NULL;
