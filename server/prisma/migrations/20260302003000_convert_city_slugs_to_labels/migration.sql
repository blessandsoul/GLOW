-- Convert city slugs to Georgian display labels (city is now a free-text input)
UPDATE `master_profiles` SET `city` = 'თბილისი' WHERE `city` = 'tbilisi';
UPDATE `master_profiles` SET `city` = 'ბათუმი' WHERE `city` = 'batumi';
UPDATE `master_profiles` SET `city` = 'ქუთაისი' WHERE `city` = 'kutaisi';
UPDATE `master_profiles` SET `city` = 'რუსთავი' WHERE `city` = 'rustavi';
UPDATE `master_profiles` SET `city` = 'მოსკოვი' WHERE `city` = 'moscow';
UPDATE `master_profiles` SET `city` = 'სანქტ-პეტერბურგი' WHERE `city` = 'saint_petersburg';
UPDATE `master_profiles` SET `city` = 'კიევი' WHERE `city` = 'kyiv';
UPDATE `master_profiles` SET `city` = 'მინსკი' WHERE `city` = 'minsk';
