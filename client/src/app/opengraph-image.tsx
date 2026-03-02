import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Glow.GE — Beauty Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OGImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAF8',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient orbs for depth */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(180,144,245,0.12) 0%, rgba(180,144,245,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-80px',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(240,192,96,0.10) 0%, rgba(240,192,96,0) 70%)',
          }}
        />

        {/* Concentric rings (brand symbol) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '160px',
            height: '160px',
            marginBottom: '32px',
          }}
        >
          {/* Outer rings with decreasing opacity */}
          {[80, 72, 64, 56, 48, 40, 32, 24].map((r, i) => (
            <div
              key={r}
              style={{
                position: 'absolute',
                width: `${r * 2}px`,
                height: `${r * 2}px`,
                borderRadius: '50%',
                border: `${1.8 - i * 0.18}px solid rgba(180,144,245,${0.5 - i * 0.055})`,
              }}
            />
          ))}
          {/* Center dot */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#B490F5',
            }}
          />
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0px',
          }}
        >
          <span
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#1C1C1E',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
            }}
          >
            GLOW
          </span>
          <span
            style={{
              fontSize: '34px',
              fontWeight: 700,
              color: '#B490F5',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginLeft: '4px',
              marginBottom: '26px',
              fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
            }}
          >
            .GE
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '22px',
            fontWeight: 400,
            color: '#8E8E93',
            marginTop: '16px',
            letterSpacing: '0.06em',
            fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif',
          }}
        >
          BEAUTY PLATFORM
        </p>

        {/* Subtle bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background:
              'linear-gradient(90deg, #B490F5 0%, #D7A4CC 40%, #F0C060 100%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
