import sharp from 'sharp';

export async function applyWatermark(imageBuffer: Buffer, text = 'Glow.GE'): Promise<Buffer> {
  const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40">
    <text x="5" y="30" font-size="18" font-family="Arial, sans-serif"
          fill="white" opacity="0.75" font-weight="bold">${text}</text>
  </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svgText), gravity: 'southeast' }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
