/* oxlint-disable nextjs/no-img-element -- Editorial images carry explicit dimensions. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  formatInsightDate,
  getInsight,
  getPublishedInsights,
  insightReadingTime,
} from '@/lib/insights';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublishedInsights().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getInsight((await params).slug);
  if (!post) notFound();
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: `${post.date}T00:00:00Z`,
      authors: [post.author],
    },
  };
}

export default async function InsightPage({ params }: Props) {
  const post = getInsight((await params).slug);
  if (!post) notFound();
  const related = getPublishedInsights().find(
    (entry) => entry.slug !== post.slug,
  );
  return (
    <main id="main-content" className="article-page wrap">
      <Link className="text-link article-back" href="/insights">
        <ArrowLeft size={16} aria-hidden="true" /> All insights
      </Link>
      <article>
        <header className="article-header">
          <p className="eyebrow">{post.category}</p>
          <h1>{post.title}</h1>
          <p className="article-description">{post.description}</p>
          <div className="article-byline">
            <span>{post.author}</span>
            <time dateTime={post.date}>{formatInsightDate(post.date)}</time>
            <span>{insightReadingTime(post)} min read</span>
          </div>
        </header>
        {post.cover && (
          <figure className="article-cover">
            <img
              src={post.cover.src}
              alt={post.cover.alt}
              width={post.cover.width}
              height={post.cover.height}
            />
          </figure>
        )}
        <div className="article-layout">
          <aside className="article-sidebar">
            {post.sections.length > 1 && (
              <nav aria-label="In this article">
                <p className="eyebrow">In this article</p>
                {post.sections.map((section) => (
                  <a href={`#${section.id}`} key={section.id}>
                    {section.heading}
                  </a>
                ))}
              </nav>
            )}
          </aside>
          <div className="article-body">
            {post.sections.map((section) => (
              <section id={section.id} key={section.id}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <div className="article-end">
              <span>Coop</span>
              <p>Robotics benchmarking & evaluations</p>
            </div>
          </div>
        </div>
      </article>
      <div className="article-next">
        {related ? (
          <>
            <p className="eyebrow">Keep exploring</p>
            <Link href={`/insights/${related.slug}`}>
              {related.title}
              <ArrowRight size={22} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <Link className="text-link" href="/insights">
            Back to insights <ArrowRight size={17} aria-hidden="true" />
          </Link>
        )}
      </div>
    </main>
  );
}
