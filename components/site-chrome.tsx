/* oxlint-disable nextjs/no-img-element -- Local artwork is explicitly sized and served directly by Vite. */
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ContactTrigger } from './contact-dialog';

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
        <nav aria-label="Main navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#experiments">Experiments</Link>
          <ContactTrigger className="cta">
            Let’s talk <ArrowUpRight size={15} />
          </ContactTrigger>
        </nav>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer wrap">
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
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/cookies">Cookie policy</Link>
        </nav>
      </div>
    </footer>
  );
}
