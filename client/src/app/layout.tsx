import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_Georgian, Playfair_Display } from 'next/font/google';
import { Agentation } from 'agentation';
import { Providers } from './providers';
import { LanguageDetector } from '@/features/i18n/components/LanguageDetector';
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansGeorgian.variable} ${playfairDisplay.variable} font-sans antialiased text-foreground bg-zinc-50 dark:bg-zinc-950 selection:bg-primary/20 min-h-dvh relative`}
      >
        <Providers>
          {children}
          <LanguageDetector />
        </Providers>
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  );
}
