export type InsightSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type InsightPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  /** Publication date in YYYY-MM-DD format. */
  date: string;
  published: boolean;
  cover?: { src: string; alt: string; width: number; height: number };
  sections: InsightSection[];
};

// Add your team's writing here. Drafts stay out of pages and direct article URLs.
// See INSIGHTS.md for the publishing workflow and a copyable post structure.
const insights: InsightPost[] = [];

export function getPublishedInsights(): InsightPost[] {
  return insights
    .filter((post) => post.published)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getInsight(slug: string): InsightPost | undefined {
  return getPublishedInsights().find((post) => post.slug === slug);
}

export function formatInsightDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function insightReadingTime(post: InsightPost): number {
  const text = [
    post.description,
    ...post.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets ?? []),
    ]),
  ].join(' ');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));
}
