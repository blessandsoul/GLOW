-- Add missing Glow Star acceptance timestamp expected by the Prisma schema.
ALTER TABLE `master_profiles`
    ADD COLUMN `glowStarAcceptedAt` DATETIME(3) NULL;
