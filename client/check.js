const fs = require('fs');
const ka = JSON.parse(fs.readFileSync('c:/Users/User/Desktop/GITHUB/lashme/client/src/i18n/dictionaries/ka.json', 'utf8'));
const ru = JSON.parse(fs.readFileSync('c:/Users/User/Desktop/GITHUB/lashme/client/src/i18n/dictionaries/ru.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('c:/Users/User/Desktop/GITHUB/lashme/client/src/i18n/dictionaries/en.json', 'utf8'));

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) return res;
    else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

const kaKeys = getKeys(ka);
const ruKeys = getKeys(ru);
const enKeys = getKeys(en);

console.log(`Key counts: KA: ${kaKeys.length}, RU: ${ruKeys.length}, EN: ${enKeys.length}`);

const missingInRu = kaKeys.filter(k => !ruKeys.includes(k));
console.log(`Missing in RU: ${missingInRu.length}`);
if (missingInRu.length > 0) {
    console.log("Some missing keys in RU:");
    console.log(missingInRu.slice(0, 20));
}

const missingInEn = kaKeys.filter(k => !enKeys.includes(k));
console.log(`Missing in EN: ${missingInEn.length}`);
if (missingInEn.length > 0) {
    console.log("Some missing keys in EN:");
    console.log(missingInEn.slice(0, 20));
}
