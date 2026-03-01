import { getDecorationPromptValue, getPlacementPromptValue } from './decoration-data.js';

interface DecorationSettings {
  selectedObjects: string[];
  customText: string;
  placement: string;
}

export function buildDecorationPrompt(decorations: DecorationSettings): string | null {
  const objectPrompts: string[] = [];

  // Resolve selected object IDs to prompt values
  for (const objId of decorations.selectedObjects) {
    const value = getDecorationPromptValue(objId);
    if (value) objectPrompts.push(value);
  }

  // Add sanitized custom text
  if (decorations.customText) {
    const sanitized = decorations.customText.trim().slice(0, 200).replace(/[\n\r]/g, ' ');
    if (sanitized.length > 0) {
      objectPrompts.push(sanitized);
    }
  }

  if (objectPrompts.length === 0) return null;

  const parts: string[] = [];
  parts.push(`ADD DECORATIVE ELEMENTS: ${objectPrompts.join(', ')}.`);

  // Add placement instruction
  if (decorations.placement) {
    const placementValue = getPlacementPromptValue(decorations.placement);
    if (placementValue) {
      parts.push(`Placement: ${placementValue}.`);
    }
  }

  parts.push(
    'Make them look photorealistic, naturally integrated, with proper lighting and shadows matching the photo.' +
    ' Decorative elements must NOT obscure or modify the subject\'s face or the master\'s work.',
  );

  return parts.join(' ');
}
