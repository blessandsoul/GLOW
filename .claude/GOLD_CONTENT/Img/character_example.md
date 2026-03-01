# Character Reference — Gold Content Example for /img

## How to Use This File

This is the GOLD STANDARD for character.md output from /img agent in CHARACTER MODE.
Read this file BEFORE generating any character.md. Match the structure, depth, and level of detail exactly.

---

## Example: Sofia (European Model for Product Photography)

Copy the JSON below, paste into Grok Imagine, generate the reference photo, save as consistency anchor for all scenes.

```json
{
  "character": {
    "name": "Sofia",
    "age": "Late twenties, approximately 27-29",
    "gender": "Female",
    "ethnicity": "European / French-Nordic blend",
    "skin_tone": "Fair with warm golden undertones, natural sun-kissed glow on shoulders and forearms, radiant youthful complexion",
    "body": {
      "build": "Lean and toned, defined collarbones and shoulders, athletic-feminine balance, long limbs",
      "height": "Tall, approximately 175cm",
      "posture": "Relaxed and self-aware, one leg often crossed over the other, leans back in chairs with casual confidence, shoulders open and settled"
    },
    "face": {
      "shape": "Oval with defined cheekbones and a refined jawline, balanced proportions",
      "eyes": {
        "color": "Bright green-hazel with golden flecks, lively and direct",
        "shape": "Wide-set, slightly almond, naturally defined with long lashes",
        "brows": "Full and naturally arched, sandy blonde, slightly darker than hair"
      },
      "nose": "Straight with a soft defined bridge, proportionate and refined",
      "lips": "Medium fullness, natural rose-pink tone, easy subtle smile that feels alive and present",
      "skin_texture": "Smooth and glowing with natural warmth, light freckles across the bridge of the nose and upper cheeks visible in close-up, youthful radiant complexion"
    },
    "hair": {
      "style": "Shoulder-length to just past shoulders, voluminous natural curls and waves, loosely tousled, no product-stiff structure, parted slightly off-center, falls freely around face and shoulders",
      "color": "Warm golden blonde with natural honey and caramel dimension, sun-lightened highlights at the crown and face-framing pieces, darker golden tones underneath",
      "texture": "Thick, naturally curly-wavy with defined ringlets, healthy bounce and movement, the kind that shifts with every head turn"
    },
    "hands": {
      "shape": "Long elegant fingers with naturally slim proportions, defined knuckles, graceful but not fragile",
      "nails": "Short to medium length, natural shape, clean nude-pink manicure with subtle sheen, well-maintained but not overdone",
      "skin_detail": "Smooth and even-toned matching face warmth, slight vein definition on dorsal surface, warm golden undertone consistent across all skin"
    },
    "clothing": {
      "default": {
        "torso": "Simple fitted black tank top or sleeveless top, scoop neckline showing collarbones and shoulders, clean and minimal",
        "legs": "Dark charcoal-black high-waisted straight-leg jeans or slim trousers, cropped at the ankle",
        "feet": "Teal-blue strappy heeled sandals with thin ankle strap, 8cm heel, adding a single color accent against the all-dark outfit",
        "materials": ["Cotton jersey", "Stretch denim or cotton twill", "Leather straps"]
      }
    },
    "accessories": [],
    "distinguishing_features": [
      "Golden curly-wavy hair with natural volume is the signature look",
      "Black minimal outfit keeps all attention on the subject and skin warmth",
      "Teal-blue heeled sandals are the single color pop in the wardrobe",
      "Casual-confident posture — never stiff, never posed, always natural",
      "Light freckles on nose bridge visible in close-ups for photorealistic authenticity"
    ]
  },

  "reference_generation_prompt": "A full body fashion portrait of a stylish young blonde woman in her late twenties with voluminous curly golden hair sitting sideways on a wooden bentwood cafe chair on a cozy outdoor Parisian terrace, wearing a black sleeveless top, dark wide-leg trousers cropped at ankle, and elegant teal-blue high-heeled strappy sandals, holding a cup of coffee with a subtle playful half-smile, bright lively eyes looking into the distance, relaxed yet confident posture with one leg crossed over the other, warm Mediterranean ambiance with wooden flooring and soft background blur of other guests, shallow depth of field creating creamy bokeh, during a warm late afternoon with soft golden natural light gently illuminating her glowing skin and highlighting her curly hair texture, light freckles across nose bridge, bright green-hazel eyes, fair radiant skin with warm golden undertones, no jewelry on hands or fingers, shot with a Canon EOS R5, 85mm f/1.8 lens, warm cinematic color grading with natural skin tones and subtle sun-kissed highlights. 9:16 vertical."
}
```

---

## CHARACTER.MD STRUCTURE RULES

Every character.md from /img MUST follow this exact JSON structure:

### Required Top-Level Fields:
1. **character** (object) — the character definition
2. **reference_generation_prompt** (string) — one copy-paste-ready prompt that generates the character photo

### Required Character Fields:
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Character name |
| `age` | string | Approximate age range with specific years |
| `gender` | string | Gender |
| `ethnicity` | string | Ethnic background with blend descriptors |
| `skin_tone` | string | Exact tone with undertones and quality |
| `body` | object | build, height, posture — each a descriptive string |
| `face` | object | shape, eyes (color/shape/brows), nose, lips, skin_texture |
| `hair` | object | style, color, texture — each highly specific |
| `hands` | object | shape, nails, skin_detail — critical for product shots |
| `clothing` | object | per-scene or default outfit with materials array |
| `accessories` | array | any accessories (can be empty) |
| `distinguishing_features` | array | 4-7 signature visual markers |

### Required reference_generation_prompt Rules:
- ONE continuous paragraph, copy-paste ready for Grok Imagine
- MUST include: full body description, clothing head to toe, environment, lighting, camera lens, aspect ratio
- MUST include: `IMPERFECT REAL SKIN` details (pores, texture, minor imperfections) for photorealism
- MUST include: specific camera (Canon EOS R5 or similar) + lens (85mm f/1.8 or 100mm f/2.8)
- MUST end with aspect ratio (usually 9:16 vertical)
- Safety line NOT needed in reference_generation_prompt (clothing already fully specified)

### Optional Fields (use when relevant):
| Field | When to Add |
|-------|-------------|
| `mood_per_scene` | When character will appear in multiple scenes |
| `ring_note` / `product_note` | When product is added separately in post-production |
| `accessories` with descriptions | When specific props are part of the look |
| Scene-specific clothing variants | When outfit changes across scenes |

---

## QUALITY CHECKLIST FOR CHARACTER.MD

Before delivering character.md, verify:

- [ ] Every skin description includes undertones (warm golden, cool pink, olive, etc.)
- [ ] Hair texture described with movement language (shifts, bounces, falls, swings)
- [ ] Hands described in detail (shape, nails, skin — critical for product shots)
- [ ] Clothing fully specified head to toe with material types
- [ ] Distinguishing features list has 4-7 items
- [ ] reference_generation_prompt is one continuous paragraph
- [ ] reference_generation_prompt includes camera + lens + aperture
- [ ] reference_generation_prompt includes aspect ratio
- [ ] No generator-specific syntax in the prompt
- [ ] JSON is valid and parseable
