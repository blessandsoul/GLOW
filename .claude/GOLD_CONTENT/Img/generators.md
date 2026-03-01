# GENERATOR GUIDE — What Works Where

> Read this BEFORE writing any prompt. Each generator has different strengths, ideal lengths, and quirks.
> The /img agent must adapt prompt style to the target generator while keeping universal format (no platform-specific syntax).

---

## QUICK COMPARISON

| Generator | Type | Ideal Length | Sweet Spot | Negative Prompts | Text in Images |
|-----------|------|-------------|------------|-----------------|----------------|
| Grok | Photo/Video | 50-150 words (600-700 chars) | Cinematic scenes, photorealistic faces, speed | Ignored (use positive framing) | Weak (simple words only) |
| Midjourney | Photo | 20-60 words | Artistic beauty, mood, atmosphere, lighting | Use --no param only | Weak (gibberish) |
| DALL-E 3 | Photo | 50-100 words (400-800 chars) | Complex scenes, natural language, landscapes | Ignored (positive framing) | Decent (1-3 short words) |
| Flux | Photo | 30-80 words | Photorealism, text rendering, prompt accuracy | Not supported | Excellent |
| Stable Diffusion SDXL | Photo | 40-75 words | Stylized art, LoRA ecosystem, fine control | Critical (use them) | Poor |
| SD3/3.5 | Photo | 40-100 words | Complex scenes, text rendering | Keep minimal | Good |
| Kling | Video | 40-50 words | Motion physics, multi-shot, 15 sec | Supported (dedicated field) | N/A |
| Runway | Video | 15-40 words | Physical accuracy, prompt adherence, 10 sec | Not supported | N/A |
| Pika | Video | 15-25 words | Simplicity, chained sequences, 12 sec | Supported (inline) | N/A |
| Minimax/Hailuo | Video | 25-60 words | Director camera control, expressions, 6-10 sec | No dedicated field | N/A |

---

## IMAGE GENERATORS

### GROK (xAI Aurora)

**Structure:** Natural language sentences. First 20-30 words get the most weight. Front-load your subject.

**What works:**
- Conversational scene descriptions ("show me a..." style works well)
- Camera lens references (35mm, 50mm, 85mm) — high impact
- Specific mood/atmosphere words (nostalgic, melancholic, electric, tense)
- Strong action verbs (surges, unfurls, shatters, erupts)
- Limit environment to 2-3 elements for coherence

**What fails:**
- Keyword tag lists — write sentences instead
- Negations ("no blur") — Grok ignores them. Say "sharp focus" instead
- Tight close-ups on hands — known weakness
- Complex text rendering — keep to simple short words
- Overloaded/busy scenes with 4+ elements
- Repeating the same descriptor twice — locks detail too strongly
- Generic mood words (happy, cool, nice, beautiful) — be specific

**Quirks:**
- No negative prompt field. Use positive framing only
- Supports 14+ aspect ratios
- Sometimes claims it cannot generate images — retry
- Poreless smooth skin default — add "realistic skin texture, visible pores"
- For image-to-video: do NOT describe what is already in the image

**Prompt template:**
```
[Subject + action in first sentence], [style/medium], [environment with 2-3 elements],
[lighting + mood], [camera/lens], [quality + aspect ratio].
```

---

### MIDJOURNEY (v6/v6.1)

**Structure:** Natural language (v6 shifted from keywords). First 5 words carry the most weight.

**What works:**
- One quality descriptor is enough — "professional photography" beats "stunning beautiful 8K masterpiece"
- Lighting is the single highest-impact modifier
- Specifying medium/style declaration changes everything ("oil painting" vs "photograph")
- Camera/lens references (85mm, shot on ARRI Alexa)
- Micro-texture details (worn leather, weathered skin, rain droplets on glass)
- Context anchors: "Posted to Instagram, 2024" triggers authentic photography aesthetics

**What fails:**
- Quality keyword spam (4K, 8K, award-winning, best quality) — junk in v6
- Negative language in prompt text — writes "blur" and model thinks about blur
- Prompt bloat — be specific on 2-3 things, leave rest to MJ's interpretation
- Old v5 keyword lists — sentences beat tag clouds
- "trending on artstation" / "unreal engine" — diminished effect in v6
- Famous person names — override all other style directions

**Quirks:**
- MJ auto-beautifies by default — use --style raw for photorealism
- Stylize parameter (--s) controls creative freedom vs literal accuracy
- 20-60 words sweet spot — beyond 60, earlier elements start dropping
- MJ will "upgrade" your concept artistically — trades accuracy for beauty
- First 5 words = disproportionate weight

**Prompt template:**
```
[Subject in first 5 words], [style/medium], [setting/environment],
[composition/camera], [lighting], [texture details].
```

---

### DALL-E 3 (OpenAI)

**Structure:** Layered natural language. Subject + Action + Environment + Style + Lighting + Camera.

**What works:**
- Direct declarative language — "A lone figure stands on a cliff" not "The image should show..."
- "photo style" for photography (NOT "photorealistic" which triggers painting styles)
- Camera equipment references ("shot on a full-frame DSLR", "shot on Hasselblad")
- 5-7 key descriptors per prompt — fewer = vague, more = competing
- Repetition trick: "very very very detailed" increases emphasis
- Complex scene composition — understands object relationships well

**What fails:**
- "Photorealistic" / "realistic" — paradoxically triggers painting styles
- Negative words (no/not/without) — ignored or does opposite
- Complex typography — keep text to 1-3 SHORT words in ALL CAPS with quotes
- Spatial directions ("to the left of", "behind") — unreliable
- ChatGPT rewrites your prompt — add "Do not change any prompts, use as it is"
- LLM-style language ("Please create an image of...")

**Quirks:**
- ALWAYS rewrites prompt through GPT-4 before generating — cannot disable
- Auto-injects demographic diversity if you say generic "a person"
- Aspect ratio influences composition: wide = cinematic, vertical = phone/portrait
- "vivid" mode = dramatic/artistic, "natural" mode = subdued/realistic
- Sometimes adds random text/watermarks — "For unlettered viewers only" suppresses this
- Being deprecated May 2026, replaced by gpt-image-1

**Prompt template:**
```
A [descriptor] [subject] [doing action], in a [environment] where [specific details].
[Style declaration]. [Lighting conditions], [mood]. [Camera/composition]. Photo style.
```

---

### FLUX (Black Forest Labs)

**Structure:** Natural language sentences — uses Mistral LLM as text encoder, understands grammar.

**What works:**
- Grammatically correct sentences outperform keyword lists
- Camera/lens specifications (85mm, f/1.4) — interpreted accurately
- Descriptive atmosphere and lighting — always specify
- Text rendering — use quotation marks around desired text, specify placement and typography
- Subject + Action + Style + Context as foundation

**What fails:**
- Quality tag spam (8k, ultra HD, masterpiece, best quality) — USELESS, wastes tokens
- Keyword stuffing — confuses natural language processing
- Prompt weights (++, :1.5) — NOT SUPPORTED in FLUX.dev/schnell
- "White background" — causes blurry undefined images
- Neglecting spatial relationships and lighting

**Quirks:**
- No negative prompts at all — positive framing only. Ask "what would I see instead?"
- Word order matters — front-load important elements
- Quality tags waste 66% of prompt tokens on meaningless filler
- Lower guidance scale than SD (3.0-3.8 optimal)
- Best photorealistic output of any open model (faces, hands, fine details)

**Prompt template:**
```
[Subject with details], [pose/action], [style declaration], [lighting],
[camera specs + lens], [composition], [color palette/mood].
```

---

### STABLE DIFFUSION (SDXL / SD3.5)

**SDXL Structure:** Hybrid — sentences + keywords both work. Descriptive sentences work better than pure tags.

**SD3.5 Structure:** Full natural language sentences — three text encoders including T5-XXL.

**What works (SDXL):**
- Quality boosters ACTUALLY WORK here (masterpiece, best quality, highly detailed, 8k)
- Prompt weights with parentheses (keyword:1.3) — supported up to ~1.4
- Artist style references (in the style of Greg Rutkowski) — work well
- Negative prompts — critical for quality control
- SDXL refiner model for polishing fine details

**What works (SD3.5):**
- Full natural language sentences — describe scene conversationally
- Text rendering — use "double quotes" around text, keep short
- Spatial reasoning — understands relative positioning

**What fails:**
- Old SD 1.5 tag-style prompts — worse on SDXL/SD3
- Prompt weights on SD3.5 — NOT SUPPORTED (ignored)
- Artist references on SD3.5 — unreliable
- Too-long negative prompts on SD3.5 — minimal is better
- High CFG on SD3 — use low CFG (3.5-4.5)

**SDXL prompt template:**
```
[Subject description], [artistic style], [lighting], [mood],
masterpiece, best quality, highly detailed, [camera/composition].
Negative: bad quality, blurry, watermark, deformed, extra limbs, poorly drawn
```

**SD3.5 prompt template:**
```
[Full scene description in natural sentences]. [Style declaration].
[Lighting and atmosphere]. "TEXT HERE" [if needed]. [Technical quality].
```

---

## VIDEO GENERATORS

### KLING (v3.0)

**Structure:** Scene > Subject > Action > Camera > Style. Ground in environment FIRST.

**What works:**
- Emphasis markers: ++critical element++ for weight
- Precise verbs with motion endpoints — where motion starts AND ends
- Micro-motions: breathing, blinking, fabric sway, dust drift
- Single main action per generation
- Camera movements: dolly zoom, truck, low-angle tracking, FPV, orbit
- 40-50 words max, 2-4 main ideas

**What fails:**
- More than 4-5 distinct elements — causes generation failure
- Open-ended motion without endpoint — causes 99% progress hang
- Missing camera direction — produces static lifeless shot
- Conflicting styles ("golden hour" + "studio lighting")
- Multi-step action sequences — keep linear

**Quirks:**
- Negative prompts supported in dedicated field (type elements to avoid)
- Motion Brush for region-specific movement control
- Multi-shot: up to 6 different shots per generation
- 15-second max duration
- Lens terms (24mm, anamorphic) are stylistic cues, not optical parameters

**Prompt template:**
```
[Scene/environment with lighting]. ++[Subject with key details]++ [does specific action
with clear endpoint]. [Camera movement]. [Style/mood], [quality].
```

---

### RUNWAY (Gen-4 / Gen-4.5)

**Structure:** Camera-first. [Camera movement]: [Scene]. [Subject]. [Action]. [Style].

**What works:**
- Camera movement stated FIRST in the prompt
- Precise active verbs: sprints, glides, dodges, leans
- One primary movement per sentence
- Environmental interactions: dust clouds, rippling water, hair blowing
- Genre-specific language: action=fast tracking, drama=slow tilts, horror=handheld jitter

**What fails:**
- Overloading with multiple actions in one sentence
- Vague motion words ("quickly", "in an artistic way")
- Negative phrasing — "camera does not move" does NOT work
- Multiple scene changes in 5-10 second clip
- Style conflicts ("smooth animation" + "handheld realism")

**Quirks:**
- No negative prompt field — frame everything positively
- 2-10 second variable duration (Gen-4.5)
- Camera Motion Slider for intensity control
- Gen-4.5 understands physical weight, momentum, force
- For image-to-video: ONLY describe motion, not what is in the image

**Prompt template:**
```
[Camera movement]: [Scene establishing]. [Subject description]. [Single clear action
with environmental interaction]. [Style keywords], [lighting/mood].
```

---

### PIKA (v2.2)

**Structure:** Simple formula. Subject + Action + Setting + Camera + Style.

**What works:**
- One subject doing one thing — simple and focused
- Active verbs with specific motion
- Chained prompts for multi-scene: "scene A > scene B > scene C"
- Even static scenes need micro-motion: rustling leaves, flickering neon
- Negative prompts inline: "no text, no distortion"

**What fails:**
- Vague prompts ("make something cool") — garbage output
- Overcrowded scenes with 5+ elements
- Contradictions ("a peaceful war zone")
- Camera zoom commands — often produce pan instead (unreliable)
- Missing constraints — Pika adds random text/people without explicit "no text, no extra people"

**Quirks:**
- Interprets prompts VERY literally — what you describe is what you get
- Scene Ingredients UI for structured element input
- Up to 12 seconds duration
- Camera commands unreliable — may need multiple regenerations
- Aspect ratio: use -ar parameter

**Prompt template:**
```
A [subject] [doing action] in [place], [camera movement], [style],
[aspect ratio]. No text, no distortion.
```

---

### MINIMAX / HAILUO (v2.3)

**Structure:** Camera FIRST. [Camera Command] + Subject + Action + Scene + Style.

**What works:**
- Director Mode bracket syntax: [Push in], [Truck left], [Pan right], etc.
- Specific action language with environmental interactions
- Character emotions and micro-expressions — Hailuo excels here
- Present-tense verbs describing action
- Max 3 camera commands per generation

**What fails:**
- More than 2-3 camera instructions — degrades quality
- Generic descriptions ("a man walking") — bland results
- Complex camera choreography in one generation
- Character appearance inconsistency — use anchor features (distinctive clothing)
- Overly long conflicting instructions

**Quirks:**
- Director Mode: [Camera Command]prompt text (no space after bracket)
- Director Mode = text-to-video ONLY, 16:9 fixed, 5 seconds
- Multiple commands in one bracket = simultaneous: [Pan left,Pedestal up]
- 1080p capped at 6 seconds, 768p up to 10 seconds
- Subject model (S2V-01) for character consistency across clips
- Hailuo 2.3 supports anime, illustration, ink-wash styles

**Prompt template:**
```
[Camera command] [Subject with distinctive features] [does specific action with emotion].
[Scene with atmosphere]. [Lighting], [style], [mood].
```
