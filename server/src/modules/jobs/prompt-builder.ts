/**
 * Builds an AI prompt from PhotoSettings fields when no filter is selected.
 */
export function buildPromptFromSettings(settings: Record<string, unknown>): string {
  const parts: string[] = [
    'Edit this photo and enhance its quality to professional studio grade.',
    'Preserve all facial features exactly as in the original.',
    'Do not alter the face, eyes, eyebrows, or eyelashes.',
  ];

  const niche = settings.niche as string | undefined;
  if (niche === 'lashes') parts.push('Focus on showcasing eyelash extensions. Keep lashes sharp and detailed.');
  if (niche === 'nails') parts.push('Focus on showcasing nail art. Keep nails sharp and detailed.');
  if (niche === 'brows') parts.push('Focus on showcasing eyebrow work. Keep brows sharp and detailed.');
  if (niche === 'makeup') parts.push('Focus on showcasing makeup artistry.');

  const style = settings.style as string | undefined;
  if (style === 'glamour') parts.push('Apply a glamorous, polished look with soft highlights.');
  if (style === 'dramatic') parts.push('Apply dramatic, high-contrast editorial lighting.');
  if (style === 'minimal') parts.push('Keep the look clean and minimal with natural tones.');

  const bg = settings.background as string | undefined;
  if (bg === 'white') parts.push('Set background to clean white.');
  if (bg === 'neutral') parts.push('Set background to neutral, soft tones.');
  if (bg === 'studio') parts.push('Set background to professional studio.');
  if (bg === 'bokeh') parts.push('Add soft bokeh background blur.');

  const lighting = settings.lighting as string | undefined;
  if (lighting === 'bright') parts.push('Use bright, even studio lighting.');
  if (lighting === 'dark') parts.push('Use dramatic, moody lighting.');

  const sharpness = settings.sharpness as string | undefined;
  if (sharpness === 'hdr') parts.push('Apply HDR effect for enhanced detail and dynamic range.');
  if (sharpness === 'soft') parts.push('Apply a soft, dreamy focus effect.');

  parts.push('Achieve 8K photo quality. Ultra-sharp, high-detail output.');

  return parts.join('\n');
}

const DEFAULT_PROMPT =
  'Enhance this photo quality to professional studio quality. Preserve all facial features exactly. Improve lighting, skin texture, and overall sharpness. Do not alter the face or expression. Achieve 8K quality.';

export { DEFAULT_PROMPT };
