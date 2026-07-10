ALTER TABLE `master_ledger_entries`
    ADD COLUMN `createdByUserId` VARCHAR(191) NULL;

CREATE INDEX `master_ledger_entries_createdByUserId_idx`
    ON `master_ledger_entries`(`createdByUserId`);
