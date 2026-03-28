-- Migration: merge lashes + brows → lashes-brows
-- Idempotent: INSERT IGNORE prevents duplicate key errors on re-run.

-- ============================================================
-- 1. SPECIALITIES TABLE
-- ============================================================

-- 1a. Insert merged speciality (sortOrder 0 = first)
INSERT IGNORE INTO `specialities` (`id`, `slug`, `label`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (UUID(), 'lashes-brows', 'წამწამები & წარბები', 0, true, NOW(), NOW());

-- 1b. Update master_profiles.niches JSON:
--     Replace "lashes" and "brows" entries with "lashes-brows".
--     We replace the old slugs inside the JSON array string directly.
--     Step 1: replace "lashes" → "lashes-brows" (where not already "lashes-brows")
UPDATE `master_profiles`
SET `niches` = REPLACE(CAST(`niches` AS CHAR), '"lashes"', '"lashes-brows"')
WHERE `niches` IS NOT NULL
  AND JSON_CONTAINS(`niches`, '"lashes"');

UPDATE `master_profiles`
SET `niches` = REPLACE(CAST(`niches` AS CHAR), '"brows"', '"lashes-brows"')
WHERE `niches` IS NOT NULL
  AND JSON_CONTAINS(`niches`, '"brows"');

-- 1c. Deduplicate: if a niches array now contains "lashes-brows" twice,
--     collapse to a single occurrence. We handle this via a helper approach:
--     select distinct values back into JSON. MySQL doesn't have a native
--     JSON_ARRAY_DISTINCT, so we use a scalar REPLACE to remove the duplicate.
UPDATE `master_profiles`
SET `niches` = REPLACE(CAST(`niches` AS CHAR), '"lashes-brows","lashes-brows"', '"lashes-brows"')
WHERE `niches` IS NOT NULL
  AND CAST(`niches` AS CHAR) LIKE '%"lashes-brows","lashes-brows"%';

-- Also handle space variant
UPDATE `master_profiles`
SET `niches` = REPLACE(CAST(`niches` AS CHAR), '"lashes-brows", "lashes-brows"', '"lashes-brows"')
WHERE `niches` IS NOT NULL
  AND CAST(`niches` AS CHAR) LIKE '%"lashes-brows", "lashes-brows"%';

-- 1d. Delete old speciality rows
DELETE FROM `specialities` WHERE `slug` IN ('lashes', 'brows');

-- 1e. Shift sortOrder down by 1 for rows after position 0
--     (we removed 2 rows and added 1, net -1 starting from sortOrder >= 2)
UPDATE `specialities`
SET `sortOrder` = `sortOrder` - 1
WHERE `sortOrder` >= 2;

-- ============================================================
-- 2. SERVICE_CATEGORIES TABLE
-- ============================================================

-- 2a. Insert merged service category
INSERT IGNORE INTO `service_categories` (`id`, `slug`, `label`, `icon`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (UUID(), 'lashes-brows', 'წამწამები & წარბები', '✦', 0, true, NOW(), NOW());

-- 2b. Re-point service_suggestions from lashes/brows → lashes-brows
--     categoryId is a FK so we need the new row's id.
UPDATE `service_suggestions`
SET `categoryId` = (SELECT `id` FROM `service_categories` WHERE `slug` = 'lashes-brows')
WHERE `categoryId` IN (
    SELECT `id` FROM (
        SELECT `id` FROM `service_categories` WHERE `slug` IN ('lashes', 'brows')
    ) AS _old
);

-- 2c. Delete old service category rows
--     (service_suggestions were already re-pointed, so no FK violation)
DELETE FROM `service_categories` WHERE `slug` IN ('lashes', 'brows');

-- 2d. Shift sortOrder for service_categories
UPDATE `service_categories`
SET `sortOrder` = `sortOrder` - 1
WHERE `sortOrder` >= 2;
