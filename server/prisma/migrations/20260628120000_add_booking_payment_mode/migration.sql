-- AlterTable
ALTER TABLE `master_profiles`
    DROP COLUMN `bookingPrepaymentEnabled`,
    ADD COLUMN `bookingPaymentMode` VARCHAR(191) NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE `bookings`
    ADD COLUMN `paymentMode` VARCHAR(191) NOT NULL DEFAULT 'NONE';
