-- Normalize city values: convert Georgian/Russian names to lowercase Latin slugs
UPDATE `master_profiles` SET `city` = 'tbilisi' WHERE `city` IN ('თბილისი', 'Тбилиси', 'Tbilisi', 'TBILISI');
UPDATE `master_profiles` SET `city` = 'batumi' WHERE `city` IN ('ბათუმი', 'Батуми', 'Batumi', 'BATUMI');
UPDATE `master_profiles` SET `city` = 'kutaisi' WHERE `city` IN ('ქუთაისი', 'Кутаиси', 'Kutaisi');
UPDATE `master_profiles` SET `city` = 'rustavi' WHERE `city` IN ('რუსთავი', 'Рустави', 'Rustavi');
UPDATE `master_profiles` SET `city` = 'zugdidi' WHERE `city` IN ('ზუგდიდი', 'Зугдиди', 'Zugdidi');
UPDATE `master_profiles` SET `city` = 'gori' WHERE `city` IN ('გორი', 'Гори', 'Gori');
UPDATE `master_profiles` SET `city` = 'poti' WHERE `city` IN ('ფოთი', 'Поти', 'Poti');
UPDATE `master_profiles` SET `city` = 'telavi' WHERE `city` IN ('თელავი', 'Телави', 'Telavi');
UPDATE `master_profiles` SET `city` = 'kobuleti' WHERE `city` IN ('ქობულეთი', 'Кобулети', 'Kobuleti');
UPDATE `master_profiles` SET `city` = 'senaki' WHERE `city` IN ('სენაკი', 'Сენаки', 'Senaki');
UPDATE `master_profiles` SET `city` = 'samtredia' WHERE `city` IN ('სამტრედია', 'Самтредиа', 'Samtredia');
UPDATE `master_profiles` SET `city` = 'marneuli' WHERE `city` IN ('მარნეული', 'Марнеული', 'Marneuli');
UPDATE `master_profiles` SET `city` = 'akhaltsikhe' WHERE `city` IN ('ახალციხე', 'Ахалцихе', 'Akhaltsikhe');
UPDATE `master_profiles` SET `city` = 'ozurgeti' WHERE `city` IN ('ოზურგეთი', 'Озургети', 'Ozurgeti');
UPDATE `master_profiles` SET `city` = 'mtskheta' WHERE `city` IN ('მცხეთა', 'Мцхета', 'Mtskheta');
UPDATE `master_profiles` SET `city` = 'borjomi' WHERE `city` IN ('ბორჯომი', 'Боржоми', 'Borjomi');
UPDATE `master_profiles` SET `city` = 'sighnaghi' WHERE `city` IN ('სიღნაღი', 'Сигнахи', 'Sighnaghi');

-- Any remaining NULL → tbilisi
UPDATE `master_profiles` SET `city` = 'tbilisi' WHERE `city` IS NULL;
