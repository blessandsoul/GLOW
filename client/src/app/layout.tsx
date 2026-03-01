import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono, Noto_Sans_Georgian, Playfair_Display } from 'next/font/google';
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
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display-playfair',
});

export const metadata: Metadata = {
  title: {
    default: 'Glow.GE',
    template: '%s | Glow.GE',
  },
  description: 'Glow.GE — AI-powered platform for beauty professionals. Lashes, hair, nails, makeup and more.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Glow.GE',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#B490F5',
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
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansGeorgian.variable} ${playfairDisplay.variable} font-sans antialiased text-foreground bg-zinc-50 dark:bg-zinc-950 selection:bg-primary/20 min-h-dvh relative`}
      >
        <Providers>
          {children}
          <ChatAssistant />
          <LanguageDetector />
          <RegisterPWA />
        </Providers>
        {process.env.NODE_ENV === 'development' && <Agentation />}
        {/* TOP.GE ASYNC COUNTER CODE */}
        <footer className="border-t border-border/50 bg-background py-4">
          <div className="container mx-auto flex items-center justify-center px-4">
            <div id="top-ge-counter-container" data-site-id="118567"></div>
          </div>
        </footer>
        <Script async src="//counter.top.ge/counter.js" strategy="afterInteractive" />
        {/* / END OF TOP.GE COUNTER CODE */}
      </body>
    </html>
  );
}
