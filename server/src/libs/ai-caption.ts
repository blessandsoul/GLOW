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

  const prompt = `შენ ხარ სილამაზის ინდუსტრიის სოციალური მედიის ექსპერტი. გაანალიზე ეს ფოტო (რომელიც არის პროფესიულად დამუშავებული ბიუთი-პროცედურის შედეგი — მაგ. წამწამების დაგრძელება, მანიკური, წარბების კორექცია, მაკიაჟი) და დაწერე Instagram-ის პოსტი ქართულ ენაზე.

პასუხი უნდა იყოს JSON ფორმატში:
{
  "text": "პოსტის ტექსტი ქართულად (2-4 აბზაცი, ემოჯი გამოიყენე, ჩაწერის მოწოდება, ფასი/ხანგრძლივობა)",
  "hashtags": "#ჰეშთეგები #გამოყოფილი #სფეისით"
}

მოთხოვნები:
- მხოლოდ ქართულ ენაზე
- ტონი: მეგობრული, პროფესიონალური
- დაამატე CTA (ჩაწერა Direct-ში)
- 7-10 რელევანტური ქართული ჰეშთეგი
- არ გამოიყენო ხელოვნური ფრაზები
- პასუხი მხოლოდ JSON, სხვა არაფერი`;

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

    const parsed = JSON.parse(jsonStr) as { text?: string; hashtags?: string };
    if (!parsed.text || !parsed.hashtags) {
      logger.warn({ rawResponse: textPart.text }, 'Gemini returned invalid caption JSON');
      throw new InternalError('Caption generation returned invalid format');
    }

    logger.info({ textLength: parsed.text.length, hashtagsLength: parsed.hashtags.length }, 'Caption generated successfully');
    return { text: parsed.text, hashtags: parsed.hashtags };
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
