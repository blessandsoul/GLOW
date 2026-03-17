-- Backfill: normalize all city values to lowercase
UPDATE `master_profiles` SET `city` = LOWER(`city`) WHERE `city` IS NOT NULL AND `city` != LOWER(`city`);

-- Backfill: set city='tbilisi' for any remaining NULL values
UPDATE `master_profiles` SET `city` = 'tbilisi' WHERE `city` IS NULL;
