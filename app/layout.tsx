import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { LegacyCookieCleanup } from '@/components/legacy-cookie-cleanup';
import { ContactDialog } from '@/components/contact-dialog';
import './globals.css';
import './contact-dialog.css';
export const metadata: Metadata = {
  title: {
    default: 'Coop | Real-world robotics experiments',
    template: '%s | Coop',
  },
  description:
    'You build the intelligence. We run the experiments. A managed robotics lab for physical setup, policy testing, resets, and reporting.',
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
    <html lang="en">
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
