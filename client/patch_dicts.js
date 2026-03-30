const fs = require('fs');
const path = require('path');

const ruPath = path.resolve(__dirname, 'src/i18n/dictionaries/ru.json');
const enPath = path.resolve(__dirname, 'src/i18n/dictionaries/en.json');

const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const translationsRU = {
  "profile_title": "Профиль",
  "profile_desc": "Управляйте своей личной информацией",
  "profile_portfolio_cta": "Создать портфолио",
  "profile_portfolio_cta_desc": "Добавьте услуги, фото и поделитесь своей профессиональной страницей с клиентами",
  "profile_account": "Аккаунт",
  "profile_email": "Эл. почта",
  "profile_phone": "Телефон",
  "profile_member_since": "Зарегистрирован",
  "profile_role_user": "Пользователь",
  "profile_role_master": "Мастер",
  "profile_role_admin": "Админ",
  "profile_role_salon": "Салон",
  "profile_personal_info": "Личная информация",
  "profile_first_name": "Имя",
  "profile_last_name": "Фамилия",
  "profile_save_name": "Сохранить",
  "profile_name_updated": "Имя обновлено"
};

const translationsEN = {
  "profile_title": "Profile",
  "profile_desc": "Manage your personal information",
  "profile_portfolio_cta": "Create Portfolio",
  "profile_portfolio_cta_desc": "Add services, photos and share your professional page with clients",
  "profile_account": "Account",
  "profile_email": "Email",
  "profile_phone": "Phone",
  "profile_member_since": "Member since",
  "profile_role_user": "User",
  "profile_role_master": "Master",
  "profile_role_admin": "Admin",
  "profile_role_salon": "Salon",
  "profile_personal_info": "Personal Info",
  "profile_first_name": "First Name",
  "profile_last_name": "Last Name",
  "profile_save_name": "Save",
  "profile_name_updated": "Name updated"
};

Object.keys(translationsRU).forEach(k => {
    ru.ui[k] = translationsRU[k];
    en.ui[k] = translationsEN[k];
});

fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

console.log("Translations added to ru.json and en.json");
