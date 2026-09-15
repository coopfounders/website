/* oxlint-disable nextjs/no-img-element -- Sized, local brand artwork. */
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ContactTrigger } from './contact-dialog';
import { SiteNavigation } from './site-navigation';

export function BrandLogo() {
  return (
    <Link className="wordmark brand-wordmark" href="/" aria-label="Coop home">
      <img src="/images/coop-logo.png" alt="Coop" width="960" height="293" />
    </Link>
  );
}

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header wrap">
        <BrandLogo />
        <SiteNavigation />
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer wrap" id="contact">
      <div className="footer-main">
        <BrandLogo />
        <ContactTrigger className="footer-contact">
          Start a conversation <ArrowUpRight size={15} />
        </ContactTrigger>
        <a className="back-top mono" href="#top">
          Back to top <ArrowRight size={14} />
        </a>
      </div>
      <div className="footer-legal">
        <span>© {new Date().getFullYear()} Coop</span>
        <nav aria-label="Footer resources">
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/cookies">Cookie policy</Link>
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Open the static text file with native browser navigation. */}
          <a href="/llms.txt">llms.txt</a>
        </nav>
      </div>
    </footer>
  );
}
