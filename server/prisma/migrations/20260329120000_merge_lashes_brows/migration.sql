-- Migration: merge lashes + brows → lashes-brows
-- Idempotent: all statements are guarded against re-runs.

START TRANSACTION;

-- ============================================================
-- 1. SPECIALITIES TABLE
-- ============================================================

-- 1a. Insert merged speciality only if it doesn't already exist
INSERT INTO `specialities` (`id`, `slug`, `label`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'lashes-brows', 'წამწამები & წარბები', 0, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `specialities` WHERE `slug` = 'lashes-brows');

-- 1b. Update master_profiles.niches JSON:
--     Replace "lashes" and "brows" entries with "lashes-brows", deduplicate, preserve others.
--     Uses JSON_TABLE for a single idempotent pass that handles non-adjacent duplicates.
UPDATE `master_profiles`
SET `niches` = (
  SELECT JSON_ARRAYAGG(val)
  FROM (
    SELECT DISTINCT
      CASE WHEN jt.val IN ('lashes', 'brows') THEN 'lashes-brows' ELSE jt.val END AS val
    FROM JSON_TABLE(`niches`, '$[*]' COLUMNS (val VARCHAR(100) PATH '$')) AS jt
  ) AS deduped
),
`updatedAt` = NOW()
WHERE `niches` IS NOT NULL
  AND (JSON_CONTAINS(`niches`, '"lashes"') OR JSON_CONTAINS(`niches`, '"brows"'));

-- 1c. Shift sortOrder down by 1 for rows after position 0
--     Guarded: only runs if the old rows still exist (i.e. first run), preventing
--     repeated execution from corrupting the order.
UPDATE `specialities`
SET `sortOrder` = `sortOrder` - 1
WHERE `sortOrder` >= 2
  AND (SELECT COUNT(*) FROM (SELECT `slug` FROM `specialities` WHERE `slug` IN ('lashes', 'brows')) AS _chk) > 0;

-- 1d. Delete old speciality rows
DELETE FROM `specialities` WHERE `slug` IN ('lashes', 'brows');

-- ============================================================
-- 2. SERVICE_CATEGORIES TABLE
-- ============================================================

-- 2a. Insert merged service category only if it doesn't already exist
INSERT INTO `service_categories` (`id`, `slug`, `label`, `icon`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
SELECT UUID(), 'lashes-brows', 'წამწამები & წარბები', '✦', 0, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `service_categories` WHERE `slug` = 'lashes-brows');

-- 2b. Re-point service_suggestions from lashes/brows → lashes-brows
UPDATE `service_suggestions`
SET `categoryId` = (SELECT `id` FROM `service_categories` WHERE `slug` = 'lashes-brows')
WHERE `categoryId` IN (
    SELECT `id` FROM (
        SELECT `id` FROM `service_categories` WHERE `slug` IN ('lashes', 'brows')
    ) AS _old
);

-- 2c. Shift sortOrder for service_categories
--     Guarded: only runs if the old rows still exist (i.e. first run).
UPDATE `service_categories`
SET `sortOrder` = `sortOrder` - 1
WHERE `sortOrder` >= 2
  AND (SELECT COUNT(*) FROM (SELECT `slug` FROM `service_categories` WHERE `slug` IN ('lashes', 'brows')) AS _chk) > 0;

-- 2d. Delete old service category rows
DELETE FROM `service_categories` WHERE `slug` IN ('lashes', 'brows');

COMMIT;
