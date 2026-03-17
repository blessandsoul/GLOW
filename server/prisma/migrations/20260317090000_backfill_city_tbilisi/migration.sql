-- Backfill: set city='tbilisi' for all existing master profiles where city is NULL
UPDATE `master_profiles` SET `city` = 'tbilisi' WHERE `city` IS NULL;
