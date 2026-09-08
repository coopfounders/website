'use client';

import { useEffect } from 'react';

/** Native scrolling; all content stays visible without JavaScript. */
export function ScrollEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hero = document.querySelector<HTMLElement>('.hero');
    const intro = document.querySelector<HTMLElement>('.intro');
    const contact = document.querySelector<HTMLElement>('.contact-section');
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.section-label, .intro h2, .intro-description, .experiment-walkthrough, .experiment-heading h2, .experiment-heading > p, .use-case, .contact-kicker, .contact-inner h2, .contact-bottom'));
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const update = () => {
      frame = 0;
      if (preference.matches) return;
      const height = window.innerHeight;
      const scrollRange = root.scrollHeight - height;
      root.style.setProperty('--page-progress', String(scrollRange > 0 ? clamp(window.scrollY / scrollRange) : 0));
      if (hero) {
        const box = hero.getBoundingClientRect();
        const progress = clamp(-box.top / box.height);
        hero.style.setProperty('--hero-drift', `${progress * (window.innerWidth < 600 ? 22 : 75)}px`);
        hero.style.setProperty('--title-drift', `${progress * (window.innerWidth < 600 ? 8 : 35)}px`);
      }
      if (intro) intro.style.setProperty('--ink-progress', `${clamp((height * .85 - intro.getBoundingClientRect().top) / (height * .55)) * 100}%`);
      if (contact) {
        const progress = clamp((height - contact.getBoundingClientRect().top) / (height * .7));
        contact.style.setProperty('--panel-inset', `${(1 - progress) * 4}%`);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const configure = () => {
      observer?.disconnect();
      root.classList.remove('scroll-motion');
      targets.forEach(el => el.classList.remove('scroll-reveal', 'is-visible'));
      if (preference.matches) return;
      // Elements already on screen never flash or disappear on hydration.
      targets.forEach(el => {
        if (el.getBoundingClientRect().top >= window.innerHeight * .96) el.classList.add('scroll-reveal');
      });
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer?.unobserve(entry.target);
        }
      }), { threshold: 0, rootMargin: '0px 0px -6% 0px' });
      targets.forEach(el => observer?.observe(el));
      root.classList.add('scroll-motion');
      schedule();
    };
    configure();
    preference.addEventListener('change', configure);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      preference.removeEventListener('change', configure);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.classList.remove('scroll-motion');
      targets.forEach(el => el.classList.remove('scroll-reveal', 'is-visible'));
    };
  }, []);
  return <div className="scroll-progress" aria-hidden="true"/>;
}
