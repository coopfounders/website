import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function InsightNotFound() {
  return (
    <main id="main-content" className="not-found-page wrap">
      <p className="eyebrow">404</p>
      <h1>Insight not found</h1>
      <p>It may have moved, or it hasn’t been published yet.</p>
      <Link href="/insights" className="text-link">
        <ArrowLeft size={17} aria-hidden="true" /> Back to insights
      </Link>
    </main>
  );
}
