/* oxlint-disable nextjs/no-img-element -- Editorial images carry explicit dimensions. */
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatInsightDate, type InsightPost } from '@/lib/insights';

export function InsightCard({
  post,
  featured = false,
}: {
  post: InsightPost;
  featured?: boolean;
}) {
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
          </div>
          <h2>{post.title}</h2>
          <p>{post.description}</p>
          <span className="text-link">
            Read insight <ArrowUpRight size={17} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
