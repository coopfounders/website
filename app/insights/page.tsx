import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LandscapeLines } from '@/components/landscape-lines';
import { InsightCard } from '@/components/insight-card';
import { getPublishedInsights } from '@/lib/insights';
import { ScrollEffects } from '@/app/scroll-effects';

export const metadata: Metadata = {
  title: 'Research & insights',
  description:
    'Perspectives from Coop on robotics, experimental practice, and the work of building a physical lab.',
};

export default function InsightsPage() {
  const [featured, ...posts] = getPublishedInsights();
  return (
    <main id="main-content" className="insights-page">
      <ScrollEffects />
      <header className="journal-masthead wrap">
        <p className="overline">The Coop journal</p>
        <h1>Research & insights</h1>
        <p>
          Ideas, observations, and work in progress
          <br />
          from the physical side of AI.
        </p>
      </header>
      <div className="wrap">
        {featured ? (
          <section
            className="insights-archive"
            aria-label="Published insights"
            data-reveal="rise"
          >
            <InsightCard post={featured} featured />
            {posts.length > 0 && (
              <div className="insights-grid">
                {posts.map((post) => (
                  <InsightCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section
            className="journal-awaiting"
            aria-labelledby="journal-awaiting-title"
            data-reveal="journal"
          >
            <LandscapeLines />
            <div>
              <span className="publication-label">Coming soon</span>
              <h2 id="journal-awaiting-title">
                Notes from a lab in the making
              </h2>
              <p>
                We’ll share our thinking on robotics and running better
                experiments here. Our first articles are on the way.
              </p>
              <Link href="/#how-it-works" className="editorial-link">
                Explore what we’re building{' '}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
