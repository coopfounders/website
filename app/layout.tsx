import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { LegacyCookieCleanup } from '@/components/legacy-cookie-cleanup';
import { ContactDialog } from '@/components/contact-dialog';
import './globals.css';
import './contact-dialog.css';
import './editorial.css';

const newsreader = localFont({
  src: '../public/fonts/newsreader-latin.woff2',
  variable: '--font-newsreader',
  weight: '400 600',
  display: 'swap',
  fallback: ['Georgia'],
});
const manrope = localFont({
  src: '../public/fonts/manrope-latin.woff2',
  variable: '--font-manrope',
  weight: '400 700',
  display: 'swap',
  fallback: ['Arial'],
});
export const metadata: Metadata = {
  title: {
    default: 'Coop | Robotics benchmarking & evaluations',
    template: '%s | Coop',
  },
  description:
    'Coop benchmarks robot policies on real hardware. Compare policies, test robustness, and track regressions with repeatable evaluations and inspectable evidence.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${manrope.variable}`}>
      <body id="top">
        <ContactDialog>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ContactDialog>
        <LegacyCookieCleanup />
      </body>
    </html>
  );
}
