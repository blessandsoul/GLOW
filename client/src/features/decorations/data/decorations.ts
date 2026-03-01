export type DecorationNiche = 'hair' | 'eyes' | 'lips' | 'nails' | 'skin' | 'general';

export interface DecorationOption {
  id: string;
  label_en: string;
  label_ru: string;
  label_ka: string;
  promptValue: string;
  niches: DecorationNiche[];
}

export interface PlacementOption {
  id: string;
  label_en: string;
  label_ru: string;
  label_ka: string;
  promptValue: string;
  niches: DecorationNiche[];
}

export const DECORATION_OPTIONS: DecorationOption[] = [
  // Hair
  { id: 'white-roses', niches: ['hair', 'general'], promptValue: 'white roses', label_en: 'White Roses', label_ru: 'Белые розы', label_ka: 'თეთრი ვარდები' },
  { id: 'baby-breath', niches: ['hair', 'general'], promptValue: "baby's breath flowers (gypsophila)", label_en: "Baby's Breath", label_ru: 'Гипсофила', label_ka: 'გიფსოფილა' },
  { id: 'gold-leaves', niches: ['hair', 'general'], promptValue: 'gold leaf accents', label_en: 'Gold Leaves', label_ru: 'Золотые листья', label_ka: 'ოქროს ფოთლები' },
  { id: 'cherry-blossoms', niches: ['hair', 'general'], promptValue: 'cherry blossom petals', label_en: 'Cherry Blossoms', label_ru: 'Сакура', label_ka: 'ალუბლის ყვავილები' },
  { id: 'hair-ribbons', niches: ['hair'], promptValue: 'silk ribbons', label_en: 'Silk Ribbons', label_ru: 'Шёлковые ленты', label_ka: 'აბრეშუმის ლენტები' },
  { id: 'lavender', niches: ['hair', 'general'], promptValue: 'lavender sprigs', label_en: 'Lavender', label_ru: 'Лаванда', label_ka: 'ლავანდა' },
  { id: 'tiny-daisies', niches: ['hair', 'general'], promptValue: 'tiny daisies', label_en: 'Daisies', label_ru: 'Ромашки', label_ka: 'გვირილები' },

  // Eyes
  { id: 'rhinestones', niches: ['eyes', 'lips', 'nails'], promptValue: 'tiny rhinestones', label_en: 'Rhinestones', label_ru: 'Стразы', label_ka: 'სტრაზები' },
  { id: 'star-sparkles', niches: ['eyes', 'general'], promptValue: 'star-shaped sparkles', label_en: 'Star Sparkles', label_ru: 'Звёздочки', label_ka: 'ვარსკვლავები' },
  { id: 'micro-pearls', niches: ['eyes', 'nails'], promptValue: 'micro pearl accents', label_en: 'Micro Pearls', label_ru: 'Микро-жемчуг', label_ka: 'მიკრო მარგალიტი' },
  { id: 'crystal-tears', niches: ['eyes'], promptValue: 'crystal tear drops', label_en: 'Crystal Tears', label_ru: 'Хрустальные слёзы', label_ka: 'ბროლის ცრემლები' },
  { id: 'glitter-dust', niches: ['eyes', 'lips', 'nails', 'general'], promptValue: 'fine glitter dust', label_en: 'Glitter Dust', label_ru: 'Блёстки', label_ka: 'ბრჭყვიალება' },

  // Lips
  { id: 'sugar-crystals', niches: ['lips'], promptValue: 'sugar crystals on lip surface', label_en: 'Sugar Crystals', label_ru: 'Сахарные кристаллы', label_ka: 'შაქრის კრისტალები' },
  { id: 'cherry-drip', niches: ['lips'], promptValue: 'cherry gloss drip effect', label_en: 'Cherry Drip', label_ru: 'Вишнёвый глянец', label_ka: 'ალუბლის ბზინვარება' },
  { id: 'rose-petals', niches: ['lips', 'nails', 'hair', 'general'], promptValue: 'rose petals', label_en: 'Rose Petals', label_ru: 'Лепестки роз', label_ka: 'ვარდის ფურცლები' },
  { id: 'honey-drip', niches: ['lips'], promptValue: 'honey drip effect', label_en: 'Honey Drip', label_ru: 'Медовый эффект', label_ka: 'თაფლის ეფექტი' },

  // Nails
  { id: 'water-droplets', niches: ['nails', 'skin'], promptValue: 'water droplets', label_en: 'Water Droplets', label_ru: 'Капли воды', label_ka: 'წყლის წვეთები' },
  { id: 'dried-flowers', niches: ['nails', 'general'], promptValue: 'tiny dried flowers', label_en: 'Dried Flowers', label_ru: 'Сухоцветы', label_ka: 'გამხმარი ყვავილები' },
  { id: 'foil-flakes', niches: ['nails'], promptValue: 'metallic foil flakes', label_en: 'Foil Flakes', label_ru: 'Фольга', label_ka: 'ფოლგა' },
  { id: 'gemstones', niches: ['nails', 'eyes'], promptValue: 'tiny gemstone accents', label_en: 'Gemstones', label_ru: 'Камни', label_ka: 'ძვირფასი ქვები' },

  // Universal
  { id: 'butterflies', niches: ['hair', 'eyes', 'general'], promptValue: 'delicate butterflies', label_en: 'Butterflies', label_ru: 'Бабочки', label_ka: 'პეპლები' },
  { id: 'pearls', niches: ['hair', 'eyes', 'nails', 'general'], promptValue: 'pearl accents', label_en: 'Pearls', label_ru: 'Жемчуг', label_ka: 'მარგალიტი' },
  { id: 'golden-dust', niches: ['hair', 'eyes', 'lips', 'nails', 'skin', 'general'], promptValue: 'golden dust particles', label_en: 'Golden Dust', label_ru: 'Золотая пыль', label_ka: 'ოქროს მტვერი' },
  { id: 'bokeh-lights', niches: ['hair', 'eyes', 'lips', 'nails', 'skin', 'general'], promptValue: 'soft bokeh light orbs', label_en: 'Bokeh Lights', label_ru: 'Боке огни', label_ka: 'ბოკეს ნათება' },
  { id: 'snowflakes', niches: ['hair', 'eyes', 'general'], promptValue: 'delicate snowflakes', label_en: 'Snowflakes', label_ru: 'Снежинки', label_ka: 'ფიფქები' },
  { id: 'confetti', niches: ['general'], promptValue: 'colorful confetti', label_en: 'Confetti', label_ru: 'Конфетти', label_ka: 'კონფეტი' },
  { id: 'cute-bears', niches: ['general', 'nails'], promptValue: 'cute tiny teddy bears', label_en: 'Teddy Bears', label_ru: 'Мишки', label_ka: 'დათვები' },
  { id: 'hearts', niches: ['general', 'nails', 'lips'], promptValue: 'small hearts', label_en: 'Hearts', label_ru: 'Сердечки', label_ka: 'გულები' },
  { id: 'feathers', niches: ['hair', 'eyes', 'general'], promptValue: 'soft feathers', label_en: 'Feathers', label_ru: 'Перья', label_ka: 'ბუმბულები' },
];

export const PLACEMENT_OPTIONS: PlacementOption[] = [
  // Hair-specific
  { id: 'woven-into-hair', niches: ['hair'], promptValue: 'woven into the hair, intertwined with strands', label_en: 'Woven into hair', label_ru: 'Вплетено в волосы', label_ka: 'თმაში გახლართული' },

  // Eyes-specific
  { id: 'around-eyes', niches: ['eyes'], promptValue: 'arranged delicately around the eyes', label_en: 'Around the eyes', label_ru: 'Вокруг глаз', label_ka: 'თვალების ირგვლივ' },
  { id: 'on-eyelids', niches: ['eyes'], promptValue: 'placed on the eyelids', label_en: 'On the eyelids', label_ru: 'На веках', label_ka: 'ქუთუთოებზე' },

  // Lips-specific
  { id: 'around-lips', niches: ['lips'], promptValue: 'scattered around the lips', label_en: 'Around the lips', label_ru: 'Вокруг губ', label_ka: 'ტუჩების ირგვლივ' },
  { id: 'on-lips', niches: ['lips'], promptValue: 'placed on the lip surface', label_en: 'On the lips', label_ru: 'На губах', label_ka: 'ტუჩებზე' },

  // Nails-specific
  { id: 'on-nails', niches: ['nails'], promptValue: 'placed on the nails', label_en: 'On the nails', label_ru: 'На ногтях', label_ka: 'ფრჩხილებზე' },
  { id: 'around-hands', niches: ['nails'], promptValue: 'arranged around the hands', label_en: 'Around the hands', label_ru: 'Вокруг рук', label_ka: 'ხელების ირგვლივ' },

  // Universal
  { id: 'around-face', niches: ['hair', 'eyes', 'lips', 'skin', 'general'], promptValue: 'arranged around the face, framing it naturally', label_en: 'Around the face', label_ru: 'Вокруг лица', label_ka: 'სახის ირგვლივ' },
  { id: 'in-background', niches: ['hair', 'eyes', 'lips', 'nails', 'skin', 'general'], promptValue: 'floating in the background behind the subject', label_en: 'In the background', label_ru: 'На фоне', label_ka: 'ფონზე' },
  { id: 'scattered-around', niches: ['hair', 'eyes', 'lips', 'nails', 'skin', 'general'], promptValue: 'scattered naturally around the scene', label_en: 'Scattered around', label_ru: 'Рассыпано вокруг', label_ka: 'მიმოფანტული' },
];

export function getNicheFromMasterPrompt(masterPromptId: string | undefined): DecorationNiche {
  if (!masterPromptId) return 'general';
  if (masterPromptId.includes('hair')) return 'hair';
  if (masterPromptId.includes('eyes')) return 'eyes';
  if (masterPromptId.includes('lips')) return 'lips';
  if (masterPromptId.includes('nails')) return 'nails';
  if (masterPromptId.includes('skin')) return 'skin';
  return 'general';
}

export function getDecorationsForNiche(niche: DecorationNiche): DecorationOption[] {
  return DECORATION_OPTIONS.filter(d => d.niches.includes(niche));
}

export function getPlacementsForNiche(niche: DecorationNiche): PlacementOption[] {
  return PLACEMENT_OPTIONS.filter(p => p.niches.includes(niche));
}
