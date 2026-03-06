-- CreateTable
CREATE TABLE `decoration_suggestions` (
    `id` VARCHAR(191) NOT NULL,
    `niche` VARCHAR(20) NOT NULL,
    `label_en` VARCHAR(80) NOT NULL,
    `label_ru` VARCHAR(80) NOT NULL,
    `label_ka` VARCHAR(80) NOT NULL,
    `prompt_value` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `decoration_suggestions_niche_idx`(`niche`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
