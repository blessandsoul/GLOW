interface DecorationEntry {
  id: string;
  promptValue: string;
}

interface PlacementEntry {
  id: string;
  promptValue: string;
}

export const DECORATION_OPTIONS: DecorationEntry[] = [
  { id: 'white-roses', promptValue: 'white roses' },
  { id: 'baby-breath', promptValue: "baby's breath flowers (gypsophila)" },
  { id: 'gold-leaves', promptValue: 'gold leaf accents' },
  { id: 'cherry-blossoms', promptValue: 'cherry blossom petals' },
  { id: 'hair-ribbons', promptValue: 'silk ribbons' },
  { id: 'lavender', promptValue: 'lavender sprigs' },
  { id: 'tiny-daisies', promptValue: 'tiny daisies' },
  { id: 'rhinestones', promptValue: 'tiny rhinestones' },
  { id: 'star-sparkles', promptValue: 'star-shaped sparkles' },
  { id: 'micro-pearls', promptValue: 'micro pearl accents' },
  { id: 'crystal-tears', promptValue: 'crystal tear drops' },
  { id: 'glitter-dust', promptValue: 'fine glitter dust' },
  { id: 'sugar-crystals', promptValue: 'sugar crystals on lip surface' },
  { id: 'cherry-drip', promptValue: 'cherry gloss drip effect' },
  { id: 'rose-petals', promptValue: 'rose petals' },
  { id: 'honey-drip', promptValue: 'honey drip effect' },
  { id: 'water-droplets', promptValue: 'water droplets' },
  { id: 'dried-flowers', promptValue: 'tiny dried flowers' },
  { id: 'foil-flakes', promptValue: 'metallic foil flakes' },
  { id: 'gemstones', promptValue: 'tiny gemstone accents' },
  { id: 'butterflies', promptValue: 'delicate butterflies' },
  { id: 'pearls', promptValue: 'pearl accents' },
  { id: 'golden-dust', promptValue: 'golden dust particles' },
  { id: 'bokeh-lights', promptValue: 'soft bokeh light orbs' },
  { id: 'snowflakes', promptValue: 'delicate snowflakes' },
  { id: 'confetti', promptValue: 'colorful confetti' },
  { id: 'cute-bears', promptValue: 'cute tiny teddy bears' },
  { id: 'hearts', promptValue: 'small hearts' },
  { id: 'feathers', promptValue: 'soft feathers' },
];

export const PLACEMENT_OPTIONS: PlacementEntry[] = [
  { id: 'woven-into-hair', promptValue: 'woven into the hair, intertwined with strands' },
  { id: 'around-eyes', promptValue: 'arranged delicately around the eyes' },
  { id: 'on-eyelids', promptValue: 'placed on the eyelids' },
  { id: 'around-lips', promptValue: 'scattered around the lips' },
  { id: 'on-lips', promptValue: 'placed on the lip surface' },
  { id: 'on-nails', promptValue: 'placed on the nails' },
  { id: 'around-hands', promptValue: 'arranged around the hands' },
  { id: 'around-face', promptValue: 'arranged around the face, framing it naturally' },
  { id: 'in-background', promptValue: 'floating in the background behind the subject' },
  { id: 'scattered-around', promptValue: 'scattered naturally around the scene' },
];

// Build lookup maps for fast retrieval
const decorationMap = new Map<string, string>();
for (const d of DECORATION_OPTIONS) {
  decorationMap.set(d.id, d.promptValue);
}

const placementMap = new Map<string, string>();
for (const p of PLACEMENT_OPTIONS) {
  placementMap.set(p.id, p.promptValue);
}

export function getDecorationPromptValue(id: string): string | undefined {
  return decorationMap.get(id);
}

export function getPlacementPromptValue(id: string): string | undefined {
  return placementMap.get(id);
}
