import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)

    const title = searchParams.get('title')?.slice(0, 100) || 'Glow.GE Blog'
    const date = searchParams.get('date') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []

    // Load Noto Sans Georgian font from Google Fonts
    const fontUrl =
      'https://fonts.gstatic.com/s/notosansgeorgian/v44/PlIaFke5O6RzLfvNNVSitxkr76PRHBC4Ytyq-Gof7PUs4S7zWn-8YDB09HFNdpvnzVj-f5WK0OQV.ttf'

    let fontData: ArrayBuffer | undefined
    try {
      const fontRes = await fetch(fontUrl)
      fontData = await fontRes.arrayBuffer()
    } catch {
      // Font fetch failed — proceed without Georgian font
    }

    const options: ConstructorParameters<typeof ImageResponse>[1] = {
      width: 1200,
      height: 630,
    }

    if (fontData) {
      options.fonts = [
        {
          name: 'Noto Sans Georgian',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ]
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'linear-gradient(to bottom right, #1a1a1a, #0a0a0a)',
            padding: '80px',
            fontFamily: fontData
              ? '"Noto Sans Georgian", sans-serif'
              : 'sans-serif',
          }}
        >
          {/* Background blobs */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(180,144,245,0.25) 0%, rgba(0,0,0,0) 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-10%',
              left: '-10%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(200,120,180,0.2) 0%, rgba(0,0,0,0) 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #B490F5, #E89AC0)',
                borderRadius: '10px',
              }}
            />
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              Glow.GE
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15,
              maxWidth: '90%',
            }}
          >
            {title}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '30px',
            }}
          >
            <div style={{ fontSize: 24, color: '#888' }}>{date}</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {tags.map((tag, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 20,
                    color: '#ccc',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '8px 20px',
                    borderRadius: '100px',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      options,
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return new Response(`Failed to generate image: ${message}`, { status: 500 })
  }
}
