'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { ContactTrigger } from './contact-dialog';

const links = [
  { href: '/#experiments', label: 'Benchmarks' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/insights', label: 'Insights' },
];

export function SiteNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !navigation.current?.contains(event.target)
      )
        setOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [open]);

  return (
    <div
      className="header-navigation"
      ref={navigation}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        className="menu-toggle"
        ref={menuButton}
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <X size={21} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Menu size={21} strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>
      <nav
        id="site-navigation"
        className="main-navigation"
        aria-label="Main navigation"
        data-open={open}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={
              link.href === '/insights' && pathname.startsWith('/insights')
                ? 'page'
                : undefined
            }
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <ContactTrigger className="header-contact">
        Let’s talk{' '}
        <ArrowUpRight size={17} strokeWidth={1.5} aria-hidden="true" />
      </ContactTrigger>
    </div>
  );
}
