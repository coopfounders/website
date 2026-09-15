'use client';

import { useEffect } from 'react';

/** Native scrolling with quiet artwork motion and one-time section entrances. */
export function ScrollEffects() {
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main || !('IntersectionObserver' in window)) return;

    const targets = Array.from(
      main.querySelectorAll<HTMLElement>('[data-reveal]'),
    );
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hero = main.querySelector<HTMLElement>('.frontier-hero');
    const revealed = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;
    let heroInView = false;
    let frame = 0;

    function updateHero() {
      frame = 0;
      if (!hero || preference.matches) return;
      const bounds = hero.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -bounds.top / bounds.height));
      const distance = window.innerWidth <= 800 ? 10 : 24;
      hero.style.setProperty(
        '--hero-drift',
        `${(progress * distance).toFixed(2)}px`,
      );
    }

    function scheduleHero() {
      if (!heroInView || frame || preference.matches) return;
      frame = requestAnimationFrame(updateHero);
    }

    function reveal(target: HTMLElement, instantly = false) {
      target.dataset.motion = instantly ? 'instant' : 'visible';
      revealed.add(target);
      observer?.unobserve(target);
    }

    function configure() {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      frame = 0;
      heroInView = false;
      hero?.style.removeProperty('--hero-drift');
      window.removeEventListener('scroll', scheduleHero);
      window.removeEventListener('resize', scheduleHero);
      targets.forEach((target) => delete target.dataset.motion);
      if (preference.matches) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target === hero) {
              heroInView = entry.isIntersecting;
              scheduleHero();
              return;
            }
            if (entry.isIntersecting) reveal(entry.target as HTMLElement);
          });
        },
        { rootMargin: '0px 0px -32px 0px', threshold: 0 },
      );

      targets.forEach((target) => {
        // Never hide content already visible on load or when returning to a page.
        if (
          revealed.has(target) ||
          target.getBoundingClientRect().top < window.innerHeight
        ) {
          revealed.add(target);
          return;
        }
        target.dataset.motion = 'pending';
        observer?.observe(target);
      });

      if (hero) {
        observer.observe(hero);
        window.addEventListener('scroll', scheduleHero, { passive: true });
        window.addEventListener('resize', scheduleHero);
      }
    }

    function revealFocused(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>('[data-reveal]');
      if (target?.dataset.motion === 'pending') reveal(target, true);
    }

    configure();
    preference.addEventListener('change', configure);
    main.addEventListener('focusin', revealFocused);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      hero?.style.removeProperty('--hero-drift');
      window.removeEventListener('scroll', scheduleHero);
      window.removeEventListener('resize', scheduleHero);
      preference.removeEventListener('change', configure);
      main.removeEventListener('focusin', revealFocused);
      targets.forEach((target) => delete target.dataset.motion);
    };
  }, []);

  return null;
}
