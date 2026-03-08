-- CreateTable
CREATE TABLE `variable_suggestions` (
    `id` VARCHAR(191) NOT NULL,
    `variable_id` VARCHAR(50) NOT NULL,
    `label_en` VARCHAR(80) NOT NULL,
    `label_ru` VARCHAR(80) NOT NULL,
    `label_ka` VARCHAR(80) NOT NULL,
    `prompt_value` VARCHAR(250) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `variable_suggestions_variable_id_idx`(`variable_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
