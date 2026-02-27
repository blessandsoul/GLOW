# OBSIDIAN — Pack Metadata

```json
{
  "pack": "OBSIDIAN",
  "series": "Gemstone Prompt Packs",
  "version": "1.0",
  "date": "2026-02-25",
  "generator": "Universal (image-to-image)",
  "format": "Upload bare face photo (A) + paste prompt → AI generates makeup result (B)",
  "aspect_ratio": "4:5 vertical",
  "total_looks": 9,

  "structure_per_look": {
    "A.jpeg": "Reference photo — bare face, no makeup (INPUT)",
    "B.png": "Result photo — makeup applied (OUTPUT example)",
    "prompt.md": "Transformation prompt to paste into AI generator"
  },

  "looks": [
    {
      "id": "01",
      "folder": "01_bold_red_lip",
      "name": "Bold Red Lip",
      "vibe": "Classic, confident, timeless, Modern Old Hollywood",
      "key_makeup": "Saturated true-red satin lip, thin upper liner, soft matte base",
      "status": "active"
    },
    {
      "id": "02",
      "folder": "02_clean_girl",
      "name": "Clean Girl",
      "vibe": "Dewy, minimal, effortless, skin-from-within",
      "key_makeup": "Dewy luminous skin, cream blush, tinted balm lip, feathered brows",
      "status": "active"
    },
    {
      "id": "03",
      "folder": "03_coquette",
      "name": "Coquette",
      "vibe": "Dainty, balletcore, pink, delicately feminine",
      "key_makeup": "Baby pink blush across nose, ballet-pink lip tint, pink shimmer inner corners",
      "status": "active"
    },
    {
      "id": "04",
      "folder": "04_douyin",
      "name": "Douyin",
      "vibe": "Youthful, bitten peach, K-beauty, glass skin",
      "key_makeup": "Peachy-pink center flush, aegyo-sal shimmer, gradient coral lip, glass skin",
      "status": "active"
    },
    {
      "id": "05",
      "folder": "05_glitter",
      "name": "Glitter",
      "vibe": "Editorial, luxurious, stage-ready glam, Chappell Roan energy",
      "key_makeup": "Champagne-bronze smoky base, fine glitter on lids, rhinestone accents, dramatic lashes",
      "status": "active"
    },
    {
      "id": "06",
      "folder": "06_golden_hour_glow",
      "name": "Golden Hour Glow",
      "vibe": "Sun-drenched, warm bronze, luminous golden radiance",
      "key_makeup": "Peachy-gold tones, bronze shimmer cheekbones, honey glossy lip, golden highlight",
      "status": "active"
    },
    {
      "id": "07",
      "folder": "07_old_money",
      "name": "Old Money",
      "vibe": "Muted, refined, quietly expensive, effortless",
      "key_makeup": "Soft taupe shadow, nude-rose matte lip, invisible contour, no shimmer",
      "status": "active"
    },
    {
      "id": "08",
      "folder": "08_rose_petal",
      "name": "Rose Petal",
      "vibe": "Romantic, garden-soft, pink-flushed, dewy",
      "key_makeup": "Rose-pink blush across cheeks+nose, rose lip stain, pink shimmer lids",
      "status": "active"
    },
    {
      "id": "09",
      "folder": "09_sun",
      "name": "Sun",
      "vibe": "Coral-flushed, sun-kissed, real sunburn warmth",
      "key_makeup": "Heavy coral-peach sunburn blush, scattered freckles, dewy oily skin, no other makeup",
      "status": "active"
    }
  ],

  "files": {
    "cover.md": "Pack cover image prompt (matte black book, silver foil OBSIDIAN title)",
    "cover_reference.png": "Generated cover image reference",
    "pack.md": "This file — metadata and structure",
    "XX_look/prompt.md": "Individual transformation prompt per look",
    "XX_look/A.jpeg": "Input reference photo (bare face)",
    "XX_look/B.png": "Output example (makeup applied)"
  },

  "source_reference": "C:\\Users\\User\\Desktop\\GLOW\\PROMPTS"
}
```
