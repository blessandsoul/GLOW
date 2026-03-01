# Video 2: "Ногти есть — показать нельзя"

Озвучка: `script.md` -> ElevenLabs
Музыка: `audio.md` -> Eden
Персонаж: `character.md` -> сгенерируй референс фото

## Как генерировать каждый кадр

Каждый кадр делается в **2 шага**:

1. **Шаг 1 — Фото**: Загрузи референс персонажа + скопируй **Фото-промпт** (JSON) -> Grok Imagine -> получаешь идеальную картинку
2. **Шаг 2 — Видео**: Загрузи полученное фото + скопируй **Анимация-промпт** -> Grok Imagine (Animate photo) -> получаешь видеоклип
3. Добавь текст поверх в монтаже

**ВАЖНО**: Каждый промпт — ОДНА сцена, ОДИН фокус, ОДНА камера. НЕ описывай много мелких объектов — Grok разобьёт на коллаж. Персонаж ВСЕГДА в кадре.

---

## Кадр 1 — Hook (3 сек)

**Фото-промпт** (загрузи референс персонажа):
```json
{
  "subject": "A young Georgian woman nail artist in a white medical-style top",
  "pose": "Looking down at her smartphone, seen from over-the-shoulder angle",
  "phone_orientation": "Phone screen faces toward her face, back panel of the phone visible from camera angle",
  "phone_screen_content": "Close-up photo of a beautifully manicured hand with intricate nail art design",
  "hands": "Her own perfectly manicured almond nails holding the phone",
  "expression": "Focused, examining the photo on screen",
  "lighting": "Warm soft lighting from a desk lamp",
  "background": "Nail station with gel polish bottles in soft bokeh",
  "camera": "Over-the-shoulder angle, shallow depth of field",
  "style": "Photorealistic, 9:16 vertical"
}
```

**Анимация-промпт** (загрузи полученное фото):
```
Subtle motion only: gentle breathing and slight natural movement. Slow micro-drift camera, stable framing. Soft warm desk lamp light casting a glow on her face. Preserve identity and details, no face morphing, no warped hands, no unnatural warping. Smooth fluid motion, consistent lighting throughout, avoid motion artifacts. Duration 3 seconds.
```

**Текст на экране**: Знакомо? / ნაცნობია?

---

## Кадр 2 — Боль: фото с плохой кожей рук (4 сек)

**Фото-промпт** (загрузи референс персонажа):
```json
{
  "subject": "A young Georgian woman nail artist in a white medical-style top",
  "pose": "Holding her smartphone close to her face at reading distance",
  "phone_orientation": "Phone screen faces toward her face, back panel visible from camera angle",
  "phone_screen_content": "Photo of a client's hand with beautiful elaborate nail art, but skin around nails has dry cuticles, visible hangnails, redness around nail beds",
  "hands": "Her own perfectly manicured almond nails holding the phone",
  "expression": "Dropping with disappointment as she looks at the screen, face visible behind the phone",
  "lighting": "Warm ambient light",
  "background": "Soft blurred nail station",
  "camera": "Medium shot, phone between her face and camera",
  "style": "Photorealistic, 9:16 vertical"
}
```

**Анимация-промпт** (загрузи полученное фото):
```
Subtle motion only: her expression shifts slowly from pride to disappointment. Slow micro-drift camera pushing in gently on her face and the phone screen. Subtle finger movement as if about to tap delete. Warm ambient lighting, stable framing. Preserve identity and details, no face morphing, no warped hands, no unnatural warping. Smooth fluid motion, consistent lighting throughout, avoid motion artifacts. Duration 3 seconds.
```

**Текст на экране**: Ногти — идеальные. Кожа рук — нет. / ფრჩხილები — იდეალური. ხელების კანი — არა.

---

## Кадр 3 — Боль: удаление фото (3 сек)

**Фото-промпт** (загрузи референс персонажа):
```json
{
  "subject": "A single young Georgian woman in a white top, alone at her nail station late in the evening",
  "pose": "Holding her phone in both hands, scrolling through gallery",
  "phone_orientation": "Phone screen faces toward her face, back of the phone visible from camera angle",
  "phone_screen_content": "Gallery of nail photos, cold blue glow from screen illuminating her face",
  "hands": "Both hands holding the phone, thumbs on screen edges",
  "expression": "Tired and disappointed — lips pressed together, slight frown",
  "lighting": "Cold blue phone glow in a dark room, no other light sources",
  "background": "LED nail lamp turned off, dark nail station, only one person in scene",
  "camera": "Over-the-shoulder composition showing her face and the back of the phone",
  "style": "Photorealistic, 9:16 vertical"
}
```

**Анимация-промпт** (загрузи полученное фото):
```
Subtle motion only: gentle tired breathing, thumb slowly swiping through gallery of nail photos on the phone. Cold blue phone glow on her face, stable framing, slow micro-drift camera. Preserve identity and details, no face morphing, no warped hands, no unnatural warping. Smooth fluid motion, consistent lighting throughout, avoid motion artifacts. Duration 3 seconds.
```

**Текст на экране**: 10-дან 8 фото — удалены. / 10-დან 8 ფოტო — წაშლილი.

---

## Кадр 4 — Переход: загрузка в Glow (3 сек)

**Фото-промпт** (загрузи референс персонажа):
```json
{
  "subject": "A young Georgian woman nail artist in a white medical-style top",
  "pose": "Sitting at her clean nail station, leaning forward slightly, looking down at phone on desk",
  "phone_orientation": "Phone lying flat on desk, screen facing up toward her as she looks down at it",
  "phone_screen_content": "Glow.GE upload interface with a nail close-up photo and a purple progress bar filling up",
  "hands": "Both hands holding the phone on the desk, her own perfect almond nails visible",
  "expression": "Curious and hopeful",
  "lighting": "Warm desk lamp light",
  "background": "Clean nail station, gel polish bottles and nail file nearby",
  "camera": "Over-the-shoulder angle, shallow depth of field",
  "style": "Photorealistic, 9:16 vertical"
}
```

**Анимация-промпт** (загрузи полученное фото):
```
Subtle motion only: gentle breathing and slight lean forward with anticipation. Her fingers gently holding the phone still, perfect nails catching the light. Warm desk lamp light, stable framing, static locked-off camera. Preserve identity and details, no face morphing, no warped hands, no unnatural warping. Smooth fluid motion, consistent lighting throughout, avoid motion artifacts. Duration 3 seconds.
```

**Текст на экране**: 5 секунд... / 5 წამი...

---

## Кадр 5 — Решение: результат (4 сек)

**Фото-промпт** (загрузи референс персонажа):
```json
{
  "subject": "A young Georgian woman nail artist in a white medical-style top",
  "pose": "Holding her smartphone up proudly with both hands, showing the screen toward camera",
  "phone_orientation": "Phone screen faces the camera, back of the phone faces her",
  "phone_screen_content": "Before-after split comparison — left side: nail art with dry rough skin around nails, right side: same nails with smooth moisturized skin",
  "hands": "Her own perfect almond nails holding the phone on both sides",
  "expression": "Pleasant surprise and excitement — eyes wide, slight open-mouth smile, face visible behind the phone",
  "lighting": "Warm studio lighting",
  "background": "Clean, softly blurred",
  "camera": "Front-facing medium shot, shallow depth of field",
  "style": "Photorealistic, 9:16 vertical"
}
```

**Анимация-промпт** (загрузи полученное фото):
```
Subtle motion only: her eyes widen slightly, a smile spreads across her face. She holds the phone up proudly. Warm studio light catching her expression, stable framing, static locked-off camera. Preserve identity and details, no face morphing, no warped hands, no unnatural warping. Smooth fluid motion, consistent lighting throughout, avoid motion artifacts. Duration 3 seconds.
```

**Текст на экране**: Ногти — те же. Кожа — идеальна. / ფრჩხილები — იგივე. კანი — იდეალური.

---

## Кадр 6 — Результат: публикация (3 сек)

**Фото-промпт** (загрузи референс персонажа):
```json
{
  "subject": "A young Georgian woman nail artist in a soft dusty pink cardigan over a white tee",
  "pose": "Smiling warmly while looking at her phone held in front of her",
  "phone_orientation": "Phone screen faces toward her face, back of the phone visible from camera angle",
  "phone_screen_content": "Instagram post upload screen with a beautiful nail art photo",
  "hands": "Her own perfectly manicured hands holding the phone",
  "expression": "Genuinely happy and relieved, warm smile",
  "lighting": "Warm golden afternoon sunlight from a window, rim light on her hair",
  "background": "Soft warm bokeh, window light",
  "camera": "Medium shot, shallow depth of field",
  "style": "Photorealistic, 9:16 vertical"
}
```

**Анимация-промпт** (загрузи полученное фото):
```
Subtle motion only: gentle natural breathing, a genuine smile on her face. Warm golden sunlight from window, static locked-off camera, stable framing. Preserve identity and details, no face morphing, no warped hands, no unnatural warping. Smooth fluid motion, consistent lighting throughout, avoid motion artifacts. Duration 3 seconds.
```

**Текст на экране**: Выложила. Клиентка репостнула. 3 новые записи. / გამოაქვეყნა. კლიენტმა რეპოსტი გააკეთა. 3 ახალი ჯავშანი.

---

## Кадр 7 — CTA (3 сек)

**Фото-промпт** (загрузи референс персонажа):
```json
{
  "subject": "A young Georgian woman nail artist in a soft dusty pink cardigan",
  "pose": "Standing by a large window, holding phone casually at her side",
  "phone_orientation": "Phone screen faces toward her body, not visible from camera angle",
  "phone_screen_content": "Not visible — phone is at her side",
  "hands": "Her own perfectly manicured almond nails visible on the hand holding the phone",
  "expression": "Confident knowing smile, looking directly at camera",
  "lighting": "Warm golden hour light, soft rim light on her hair and shoulder",
  "background": "Clean minimal background, large window",
  "camera": "Medium shot, shallow depth of field",
  "style": "Photorealistic, 9:16 vertical"
}
```

**Анимация-промпт** (загрузи полученное фото):
```
Subtle motion only: gentle natural breathing, confident smile at the camera. Warm golden light, static locked-off camera, stable framing. Preserve identity and details, no face morphing, no warped hands, no unnatural warping. Smooth fluid motion, consistent lighting throughout, avoid motion artifacts. Duration 3 seconds.
```

**Текст на экране**: Ногти — твоя работа. Кожа — наша. Бесплатно -> glow.ge / ფრჩხილები — შენი ნამუშევარი. კანი — ჩვენი. უფასოდ -> glow.ge
