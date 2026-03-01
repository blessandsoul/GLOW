# ANTI-PATTERNS — What NOT to Write in Prompts

> Common mistakes that produce bad results across all generators. Read BEFORE writing any prompt.

---

## 1. Universal Anti-Patterns (All Generators)

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| Negative language ("no blur", "without people") | Most generators ignore negations or do the opposite | Describe what you WANT: "sharp focus", "empty street" |
| Quality keyword spam ("8K stunning beautiful masterpiece") | Wastes tokens, does nothing on Grok/Flux/MJ v6 | One quality descriptor: "photorealistic quality" or "professional photography" |
| Vague adjectives ("cool", "nice", "beautiful", "amazing") | Generator has nothing concrete to render | Specific visual details: "warm amber lighting", "weathered oak texture" |
| Overloaded scenes (5+ distinct elements) | Coherence breaks down, elements merge or disappear | 2-3 environmental elements max per prompt |
| Keyword tag lists ("knight, castle, epic, 8K, detailed") | Modern generators prefer natural language | Write sentences: "A knight stands before a castle at dawn" |
| Contradictory styles ("peaceful war zone", "golden hour + studio lighting") | Generator cannot reconcile opposites | Commit to ONE clear mood and lighting |
| LLM-style phrasing ("Please create an image of...") | Wastes tokens on non-visual instructions | Direct visual language: "A weathered fisherman on a dock at dawn" |
| Passive descriptions ("standing", "sitting") | Produces static, lifeless results | Active verbs: "leaning against the railing", "mid-stride through the rain" |
| Repeating the same word multiple times | Locks that detail too strongly, distorts output | Mention each descriptor once |
| "trending on artstation" / "unreal engine" | Power words in old models, diminished in v6/Flux | Describe the actual style you want |

---

## 2. Human Figure Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| "muscular" without clothing spec | Generates near-naked bodies | Always specify full clothing: "muscular build in a fitted black suit" |
| "beautiful woman" / "handsome man" | Generic Instagram/stock photo face | Describe specific features: skin tone, age, expression, distinctive marks |
| No clothing description | AI tends to underdress figures | Specify complete outfit from top to bottom |
| Tight close-up on hands | Known weakness across all generators | Use medium shots, add "natural proportions, realistic hand anatomy" |
| No skin texture mentioned | Poreless plastic doll skin | Add "realistic skin texture, visible pores, minor imperfections" |
| Generic "a person" | DALL-E auto-injects random demographics | Be specific about character details yourself |
| Complex multi-person interaction | Faces merge, limbs tangle | Max 2 people interacting, or use medium/wide shots |

---

## 3. Product Photography Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| Background competing with product | Product gets lost in busy environment | "clean dark background", product should be largest and sharpest element |
| No surface material specified | Generic floating product on white | Specify surface: "resting on dark marble", "on folded black velvet" |
| No reflection/shadow behavior | Flat unrealistic look | "casting soft shadow to the right", "subtle reflection on polished surface" |
| "white background" on Flux | Causes blurry undefined images | "clean neutral grey gradient background" or "pure white seamless backdrop" |
| No material texture for the product | Glossy plastic default | Specify: "brushed steel finish", "matte ceramic with slight imperfections" |

---

## 4. Video Prompt Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| No camera movement specified | Static lifeless shot | Always include camera: "slow dolly forward", "tracking shot from the side" |
| Multi-step action sequence | Generator cannot process chains | One main action per clip: "lifts the cup and drinks" not "lifts, drinks, puts down, stands up" |
| Open-ended motion (no endpoint) | Kling: 99% progress hang. Others: drift | Specify where motion ends: "walks to the edge of the pier and stops" |
| Re-describing image in image-to-video | Confuses generator, contradicts source | ONLY describe motion and changes: "camera slowly orbits, hair moves in wind" |
| Describing elements not in source image | Generator confused when img2vid input contradicts prompt | Only describe what happens TO elements already visible |
| "slow motion" + "time-lapse" together | Contradictory motion speeds | Choose one speed/style per clip |
| No micro-motions | Stiff, artificial-looking result | Add: breathing, blinking, fabric sway, dust, hair movement |

---

## 5. Text Rendering Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| Long sentences in images | All generators struggle with 4+ words | Max 1-3 SHORT words |
| Lowercase text request | Harder to render accurately | Use ALL CAPS in your prompt: "sign reading 'OPEN'" |
| Text not on flat surface | Wraps, distorts, becomes illegible | Place text on flat surfaces: signs, walls, screens, covers |
| Complex typography layout | Generators cannot control font, kerning, size | Generate image without text, add text in post-production |
| Expecting text from Midjourney | MJ produces gibberish text almost always | Use DALL-E, Flux, or SD3.5 for text. Or add in post. |

---

## 6. Generator-Specific Traps

### Grok Traps
- Saying "I want" or "create" — just describe the scene directly
- Multiple actions in one prompt ("sip, drop, react") — pick one moment
- Mentioning a keyword twice — reinforces disproportionately

### Midjourney Traps
- Using famous person names — overrides all other style instructions
- High stylize (--s 800+) with photorealism goal — fights against you
- Expecting pixel-perfect accuracy — MJ trades accuracy for beauty

### DALL-E 3 Traps
- "Photorealistic" — paradoxically triggers painting styles. Use "photo style"
- "Moon" in prompts — adds unwanted planets. Use "Pearl" shape instead
- "Alien" — triggers grey alien stereotype. Use "creature from unknown species"
- Backlight requests — get too bright. Describe darkness multiple times to counter

### Flux Traps
- Copying SDXL prompting patterns — quality tags waste tokens
- "White background" — causes blurry images. Use "neutral grey" or specific background
- Prompt weights syntax (++, :1.5) — not supported, causes errors

### Kling Video Traps
- Innocent words triggering content filter — rephrase if stuck
- More than 4-5 elements — causes generation failure
- Technical lens terms — treated as stylistic cues, not actual optics

### Pika Video Traps
- Camera zoom commands — often produce pan instead (unreliable)
- No constraints specified — Pika adds random text/people
- Expecting creative interpretation — Pika is extremely literal
