import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from './logger.js';

// ── Types ──

export interface BrandingData {
  displayName: string;
  instagramHandle: string;
  logoUrl: string | null;
  primaryColor: string;
  watermarkStyle: string;
  watermarkOpacity: number;
}

// ── Original Glow.GE watermark (for FREE/guest users) ──

export async function applyWatermark(imageBuffer: Buffer, text = 'Glow.GE'): Promise<Buffer> {
  const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40">
    <text x="5" y="30" font-size="18" font-family="Arial, sans-serif"
          fill="white" opacity="0.75" font-weight="bold">${escapeXml(text)}</text>
  </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svgText), gravity: 'southeast' }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

// ── Custom branding watermark ──

export async function applyBranding(
  imageBuffer: Buffer,
  branding: BrandingData,
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;

  const name = escapeXml(branding.displayName);
  const handle = escapeXml(branding.instagramHandle);
  const color = branding.primaryColor;
  const opacity = branding.watermarkOpacity;
  const slug = handle.replace('@', '');

  const layers: sharp.OverlayOptions[] = [];

  // Build SVG overlay based on watermark style
  const svgOverlay = buildStyleSvg(branding.watermarkStyle, w, h, name, handle, slug, color, opacity);
  layers.push({ input: Buffer.from(svgOverlay), top: 0, left: 0 });

  // Composite logo if available
  const logoBuffer = await loadLogo(branding.logoUrl);
  if (logoBuffer) {
    const logoPos = getLogoPosition(branding.watermarkStyle, w, h);
    const resized = await sharp(logoBuffer)
      .resize(logoPos.size, logoPos.size, { fit: 'cover' })
      .composite([{
        input: Buffer.from(circleMask(logoPos.size)),
        blend: 'dest-in',
      }])
      .png()
      .toBuffer();

    layers.push({
      input: resized,
      top: logoPos.top,
      left: logoPos.left,
    });
  }

  return sharp(imageBuffer)
    .composite(layers)
    .jpeg({ quality: 90 })
    .toBuffer();
}

// ── SVG builders per style ──

function buildStyleSvg(
  style: string,
  w: number,
  h: number,
  name: string,
  handle: string,
  slug: string,
  color: string,
  opacity: number,
): string {
  const op = opacity.toFixed(2);

  switch (style) {
    case 'MINIMAL':
      return buildMinimalSvg(w, h, name, slug, color, op);
    case 'FRAMED':
      return buildFramedSvg(w, h, name, slug, color, op);
    case 'STORIES_TEMPLATE':
      return buildStoriesSvg(w, h, name, handle, color, op);
    case 'DIAGONAL':
      return buildDiagonalSvg(w, h, name, handle, color, op);
    case 'BADGE':
      return buildBadgeSvg(w, h, name, slug, color, op);
    case 'SPLIT':
      return buildSplitSvg(w, h, name, handle, slug, color, op);
    default:
      return buildMinimalSvg(w, h, name, slug, color, op);
  }
}

function buildMinimalSvg(w: number, h: number, name: string, slug: string, color: string, op: string): string {
  const fontSize = Math.round(w * 0.035);
  const smallFont = Math.round(fontSize * 0.7);
  const pad = Math.round(w * 0.03);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g opacity="${op}">
      <text x="${w - pad}" y="${h - pad - smallFont - 4}" font-size="${fontSize}" font-family="Arial, sans-serif"
            fill="${color}" font-weight="600" text-anchor="end"
            filter="url(#shadow)">${name}</text>
      <text x="${w - pad}" y="${h - pad}" font-size="${smallFont}" font-family="Arial, sans-serif"
            fill="${color}" font-style="italic" text-anchor="end"
            filter="url(#shadow)">Glow.GE/${slug}</text>
      ${dropShadowFilter()}
    </g>
  </svg>`;
}

function buildFramedSvg(w: number, h: number, name: string, slug: string, color: string, op: string): string {
  const border = Math.round(w * 0.012);
  const margin = Math.round(w * 0.025);
  const barH = Math.round(h * 0.07);
  const fontSize = Math.round(w * 0.032);
  const smallFont = Math.round(fontSize * 0.7);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g opacity="${op}">
      <rect x="${margin}" y="${margin}" width="${w - margin * 2}" height="${h - margin * 2}"
            rx="12" ry="12" fill="none" stroke="${color}" stroke-width="${border}" />
      <rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="${color}" />
      <text x="${w / 2}" y="${h - barH / 2 - smallFont * 0.3}" font-size="${fontSize}" font-family="Arial, sans-serif"
            fill="white" font-weight="600" text-anchor="middle" dominant-baseline="middle">${name}</text>
      <text x="${w / 2}" y="${h - barH / 2 + fontSize * 0.6}" font-size="${smallFont}" font-family="Arial, sans-serif"
            fill="white" fill-opacity="0.75" font-style="italic" text-anchor="middle" dominant-baseline="middle">Glow.GE/${slug}</text>
    </g>
  </svg>`;
}

function buildStoriesSvg(w: number, h: number, name: string, handle: string, color: string, op: string): string {
  const barH = Math.round(h * 0.06);
  const fontSize = Math.round(w * 0.03);
  const smallFont = Math.round(fontSize * 0.8);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g opacity="${op}">
      <rect x="0" y="0" width="${w}" height="${barH}" fill="${color}" fill-opacity="0.9" />
      <text x="${w / 2 - 10}" y="${barH / 2}" font-size="${fontSize}" font-family="Arial, sans-serif"
            fill="white" font-weight="600" text-anchor="end" dominant-baseline="middle">${name}</text>
      <text x="${w / 2}" y="${barH / 2}" font-size="${smallFont * 0.5}" font-family="Arial, sans-serif"
            fill="white" fill-opacity="0.6" text-anchor="middle" dominant-baseline="middle">&middot;</text>
      <text x="${w / 2 + 10}" y="${barH / 2}" font-size="${smallFont}" font-family="Arial, sans-serif"
            fill="white" fill-opacity="0.85" font-style="italic" text-anchor="start" dominant-baseline="middle">${handle}</text>
    </g>
  </svg>`;
}

function buildDiagonalSvg(w: number, h: number, name: string, handle: string, color: string, op: string): string {
  const fontSize = Math.round(w * 0.06);
  const smallFont = Math.round(fontSize * 0.6);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g opacity="${op}">
      <g transform="translate(${w / 2}, ${h / 2}) rotate(-30)">
        <text x="0" y="-${fontSize * 0.4}" font-size="${fontSize}" font-family="Arial, sans-serif"
              fill="${color}" fill-opacity="0.55" font-weight="700" text-anchor="middle"
              letter-spacing="0.2em" text-transform="uppercase"
              filter="url(#shadow)">${name}</text>
        <text x="0" y="${fontSize * 0.8}" font-size="${smallFont}" font-family="Arial, sans-serif"
              fill="${color}" fill-opacity="0.45" font-style="italic" text-anchor="middle">${handle}</text>
      </g>
      ${dropShadowFilter()}
    </g>
  </svg>`;
}

function buildBadgeSvg(w: number, h: number, name: string, slug: string, color: string, op: string): string {
  const fontSize = Math.round(w * 0.03);
  const smallFont = Math.round(fontSize * 0.7);
  const padX = Math.round(w * 0.03);
  const padY = Math.round(h * 0.04);
  const pillW = Math.round(w * 0.35);
  const pillH = Math.round(h * 0.045);
  const pillX = padX;
  const pillY = h - padY - pillH;
  const radius = Math.round(pillH / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g opacity="${op}">
      <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}"
            rx="${radius}" ry="${radius}" fill="${color}" fill-opacity="0.87" />
      <text x="${pillX + pillW / 2}" y="${pillY + pillH / 2 - smallFont * 0.25}" font-size="${fontSize}" font-family="Arial, sans-serif"
            fill="white" font-weight="700" text-anchor="middle" dominant-baseline="middle">${name}</text>
      <text x="${pillX + pillW / 2}" y="${pillY + pillH / 2 + fontSize * 0.55}" font-size="${smallFont}" font-family="Arial, sans-serif"
            fill="white" fill-opacity="0.75" font-style="italic" text-anchor="middle" dominant-baseline="middle">Glow.GE/${slug}</text>
    </g>
  </svg>`;
}

function buildSplitSvg(w: number, h: number, name: string, handle: string, slug: string, color: string, op: string): string {
  const stripH = Math.round(h * 0.1);
  const fontSize = Math.round(w * 0.035);
  const smallFont = Math.round(fontSize * 0.65);
  const padX = Math.round(w * 0.04);
  const y = h - stripH;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="splitGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.94" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0.6" />
      </linearGradient>
    </defs>
    <g opacity="${op}">
      <rect x="0" y="${y}" width="${w}" height="${stripH}" fill="url(#splitGrad)" />
      <text x="${padX}" y="${y + stripH / 2 - smallFont * 0.3}" font-size="${fontSize}" font-family="Arial, sans-serif"
            fill="white" font-weight="700" text-anchor="start" dominant-baseline="middle">${name}</text>
      <text x="${padX}" y="${y + stripH / 2 + fontSize * 0.6}" font-size="${smallFont}" font-family="Arial, sans-serif"
            fill="white" fill-opacity="0.7" font-style="italic" text-anchor="start" dominant-baseline="middle">Glow.GE</text>
      <line x1="${w * 0.45}" y1="${y + stripH * 0.25}" x2="${w * 0.45}" y2="${y + stripH * 0.75}"
            stroke="white" stroke-opacity="0.2" stroke-width="1" />
      <text x="${w - padX}" y="${y + stripH / 2}" font-size="${smallFont}" font-family="Arial, sans-serif"
            fill="white" fill-opacity="0.8" font-style="italic" text-anchor="end" dominant-baseline="middle">${handle}</text>
    </g>
  </svg>`;
}

// ── Helpers ──

function dropShadowFilter(): string {
  return `<defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="black" flood-opacity="0.5" />
    </filter>
  </defs>`;
}

function circleMask(size: number): string {
  const r = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${r}" cy="${r}" r="${r}" fill="white" />
  </svg>`;
}

function getLogoPosition(style: string, w: number, h: number): { top: number; left: number; size: number } {
  const logoSize = Math.round(w * 0.06);

  switch (style) {
    case 'MINIMAL':
      return { top: h - Math.round(w * 0.03) - logoSize - Math.round(w * 0.035 * 1.7 + 4), left: w - Math.round(w * 0.03) - logoSize - Math.round(w * 0.2), size: logoSize };
    case 'FRAMED': {
      const barH = Math.round(h * 0.07);
      return { top: h - barH + Math.round((barH - logoSize) / 2), left: Math.round(w / 2) - logoSize - Math.round(w * 0.08), size: logoSize };
    }
    case 'STORIES_TEMPLATE': {
      const barH = Math.round(h * 0.06);
      return { top: Math.round((barH - logoSize) / 2), left: Math.round(w / 2) - logoSize - Math.round(w * 0.12), size: logoSize };
    }
    case 'DIAGONAL':
      return { top: Math.round(h / 2) - logoSize - Math.round(w * 0.04), left: Math.round(w / 2) - Math.round(logoSize / 2), size: logoSize };
    case 'BADGE':
      return { top: h - Math.round(h * 0.04) - Math.round(h * 0.045) + Math.round((Math.round(h * 0.045) - logoSize) / 2), left: Math.round(w * 0.035), size: logoSize };
    case 'SPLIT': {
      const stripH = Math.round(h * 0.1);
      const logoSizeLg = Math.round(w * 0.07);
      return { top: h - stripH + Math.round((stripH - logoSizeLg) / 2), left: Math.round(w * 0.04) - 2, size: logoSizeLg };
    }
    default:
      return { top: h - Math.round(w * 0.03) - logoSize, left: w - Math.round(w * 0.03) - logoSize, size: logoSize };
  }
}

async function loadLogo(logoUrl: string | null): Promise<Buffer | null> {
  if (!logoUrl) return null;

  try {
    if (logoUrl.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), logoUrl);
      return await readFile(filePath);
    }

    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch (err) {
    logger.warn({ err, logoUrl }, 'Failed to load branding logo');
    return null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
