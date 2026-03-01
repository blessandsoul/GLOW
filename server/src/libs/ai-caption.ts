import { env } from '@/config/env.js';
import { logger } from './logger.js';
import { InternalError, BadRequestError } from '@/shared/errors/errors.js';

export interface CaptionResult {
  text: string;
  hashtags: string;
}

export async function generateCaptionFromImage(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg',
): Promise<CaptionResult> {
  const { getGeminiClient } = await import('./gemini.js');
  const gemini = getGeminiClient();

  const base64Image = imageBuffer.toString('base64');

  const prompt = `დაწერე მოკლე Instagram caption ქართულად ამ ბიუთი-ფოტოსთვის.

ეტალონი (სტილი, სიგრძე და ფორმატი):
"შეყვარებული ვარ პროფესიონალური რეტუშის გამოყენებაზე 🥰❤️\\n\\nმომწონს ესთეტიური ფოტოები , ნამუშევარი იდენტური და ვიზუალი ორიგინალური 🥰❤️\\n\\nშეგახსენებთ რომ მარტისთვის სამზადისი დაწყებულია 😍🥰"

წესები:
- 2-3 მოკლე წინადადება, პირველი პირი (მე-ფორმა)
- ყოველი წინადადება ცალკე ხაზზე — გამოყავი \\n\\n (ცარიელი ხაზი)
- 2-3 ემოჯი, ბუნებრივად წინადადების ბოლოს
- ტონი: ცოცხალი, გულწრფელი, არა რეკლამური
- არ ახსნა პროცედურა, არ ჩამოთვალო ფასი/ხანგრძლივობა
- არ დაწერო "ჩაეწერეთ Direct-ში" ან CTA
- hashtags: 4-6 ქართული ჰეშთეგი, სფეისით გამოყოფილი

JSON პასუხი, სხვა არაფერი:
{"text": "პირველი წინადადება 🥰\\n\\nმეორე წინადადება ❤️\\n\\nმესამე წინადადება 😍", "hashtags": "#ჰეშთეგი1 #ჰეშთეგი2 #ჰეშთეგი3"}`;

  try {
    logger.info('Starting Gemini caption generation');

    const response = await gemini.models.generateContent({
      model: env.GEMINI_TEXT_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['Text'],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new InternalError('Gemini returned no candidates for caption');
    }

    const textPart = candidates[0].content?.parts?.find((p: { text?: string }) => p.text);
    if (!textPart?.text) {
      throw new InternalError('Gemini returned no text for caption');
    }

    // Parse JSON from response (strip markdown code fence if present)
    let jsonStr = textPart.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    logger.info({ rawJson: jsonStr }, 'Gemini raw caption response');

    const parsed = JSON.parse(jsonStr) as { text?: string; hashtags?: string };
    if (!parsed.text) {
      logger.warn({ rawResponse: textPart.text }, 'Gemini returned invalid caption JSON');
      throw new InternalError('Caption generation returned invalid format');
    }

    // Extract hashtags from text if Gemini put them there instead of separate field
    let captionText = parsed.text;
    let hashtags = parsed.hashtags ?? '';

    if (!hashtags) {
      const hashtagMatch = captionText.match(/((?:#\S+\s*){2,})$/);
      if (hashtagMatch) {
        hashtags = hashtagMatch[1].trim();
        captionText = captionText.slice(0, hashtagMatch.index).trim();
      }
    }

    // Always include #GLOW.GE
    const BRAND_TAG = '#GLOW.GE';
    if (!hashtags.includes(BRAND_TAG)) {
      hashtags = hashtags ? `${hashtags} ${BRAND_TAG}` : BRAND_TAG;
    }

    logger.info({ textLength: captionText.length, hashtags }, 'Caption generated successfully');
    return { text: captionText, hashtags };
  } catch (err: unknown) {
    if (err instanceof InternalError || err instanceof BadRequestError) throw err;

    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
      throw new BadRequestError('Image was rejected by content safety policy', 'CONTENT_POLICY_VIOLATION');
    }
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      logger.warn({ err }, 'Gemini rate limit hit during caption generation');
      throw new InternalError('Caption generation temporarily unavailable. Please try again shortly.');
    }

    logger.error({ err }, 'Gemini caption generation error');
    throw new InternalError('Caption generation failed');
  }
}
