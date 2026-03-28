import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono, Noto_Sans_Georgian, Playfair_Display, Noto_Serif, Noto_Serif_Georgian, Manrope, Inter } from 'next/font/google';
import { Agentation } from 'agentation';
import { Providers } from './providers';
import { RegisterPWA } from '@/components/common/RegisterPWA';
import { LanguageDetector } from '@/features/i18n/components/LanguageDetector';
import { ChatAssistant } from '@/features/chat-assistant';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-noto-georgian',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display-playfair',
});

const notoSerif = Noto_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-noto-serif',
  display: 'swap',
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  subsets: ['georgian'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-georgian',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://glow.ge',
  ),
  title: {
    default: 'Glow.GE',
    template: '%s | Glow.GE',
  },
  description:
    'Glow.GE — the ultimate beauty services aggregator in Georgia. Lashes, nails, brows, makeup, hair, cosmetology and more — all beauty services in one place.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Glow.GE',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Glow.GE',
    title: 'Glow.GE — All Beauty Services in One Place',
    description:
      'Georgia\'s beauty services aggregator — lashes, nails, brows, makeup, hair, cosmetology. Find any beauty service you need.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glow.GE — All Beauty Services in One Place',
    description:
      'Georgia\'s beauty services aggregator — lashes, nails, brows, makeup, hair, cosmetology. Find any beauty service you need.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#680005',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansGeorgian.variable} ${playfairDisplay.variable} ${notoSerif.variable} ${notoSerifGeorgian.variable} ${manrope.variable} ${inter.variable} editorial-theme antialiased text-foreground bg-background selection:bg-primary/20 min-h-dvh relative overflow-x-hidden`}
      >
        <Providers>
          {children}
          <ChatAssistant />
          <LanguageDetector />
          <RegisterPWA />
        </Providers>
        {process.env.NODE_ENV === 'development' && <Agentation />}
        {/* TOP.GE ASYNC COUNTER CODE */}
        <footer className="border-t border-[#e3beba]/30 bg-[#f9f9f9] py-4">
          <div className="container mx-auto flex flex-col items-center gap-3 px-4">
            <nav className="flex items-center gap-2 text-xs tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-inter), sans-serif', color: '#524342' }}>
              <a href="/terms" className="transition-colors hover:text-[#680005]">Terms</a>
              <span style={{ color: '#e3beba' }}>|</span>
              <a href="/privacy" className="transition-colors hover:text-[#680005]">Privacy</a>
              <span style={{ color: '#e3beba' }}>|</span>
              <a href="/refund" className="transition-colors hover:text-[#680005]">Refund</a>
            </nav>
            <div id="top-ge-counter-container" data-site-id="118567"></div>
          </div>
        </footer>
        <Script async src="//counter.top.ge/counter.js" strategy="afterInteractive" />
        {/* / END OF TOP.GE COUNTER CODE */}
      </body>
    </html>
  );
}
