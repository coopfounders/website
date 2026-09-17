import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LandscapeLines } from '@/components/landscape-lines';
import { InsightCard } from '@/components/insight-card';
import { getPublishedInsights } from '@/lib/insights';
import { ScrollEffects } from '@/app/scroll-effects';

export const metadata: Metadata = {
  title: 'Research & Insights',
  description:
    'Notes from Coop on robot learning, benchmark design, and what physical evaluations reveal about progress in robotics.',
};

export default function InsightsPage() {
  const posts = getPublishedInsights();
  return (
    <main id="main-content" className="insights-page">
      <ScrollEffects />
      <header className="journal-masthead wrap">
        <p className="overline">The Coop journal</p>
        <h1>Research & Insights</h1>
        <p>
          Notes on building, testing, and learning
          <br />
          from robots in the physical world.
        </p>
      </header>
      <div className="wrap">
        {posts.length > 0 ? (
          <section
            className="insights-archive"
            aria-label="Published insights"
            data-reveal="rise"
          >
            <div className="insights-grid">
              {posts.map((post) => (
                <InsightCard key={post.slug} post={post} />
              ))}
            </div>
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
                On measuring progress in robotics
              </h2>
              <p>
                We’ll share our thinking on benchmark design, policy evaluation,
                and learning from physical failures. Our first articles are on
                the way.
              </p>
              <Link href="/#how-it-works" className="editorial-link">
                Explore our approach <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
