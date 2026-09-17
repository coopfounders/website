/* oxlint-disable nextjs/no-img-element -- Editorial images carry explicit dimensions. */
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  formatInsightDate,
  insightReadingTime,
  type InsightPost,
} from '@/lib/insights';

export function InsightCard({
  post,
  featured = false,
  headingLevel = 2,
}: {
  post: InsightPost;
  featured?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <article
      className={`insight-card${featured ? ' insight-card-featured' : ''}`}
      data-has-cover={Boolean(post.cover)}
    >
      <Link href={`/insights/${post.slug}`} className="insight-card-link">
        {post.cover && (
          <div className="insight-cover">
            <img
              src={post.cover.src}
              alt={post.cover.alt}
              width={post.cover.width}
              height={post.cover.height}
              loading="lazy"
            />
          </div>
        )}
        <div className="insight-card-copy">
          <div className="insight-meta mono">
            <span>{post.category}</span>
            <time dateTime={post.date}>{formatInsightDate(post.date)}</time>
            <span className="insight-reading-time">
              {insightReadingTime(post)} min read
            </span>
          </div>
          <Heading>{post.title}</Heading>
          <p>{post.description}</p>
          <span className="text-link">
            Read article <ArrowUpRight size={17} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
