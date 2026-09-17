# Publishing an insight

The first published post is “Why we’re building Coop,” adapted from the
team’s `Structure_Setup.pdf`. Article content lives in `lib/insights.ts`.
There is no CMS, newsletter service, or external content dependency.

Add an object to the `insights` array in `lib/insights.ts` using this structure:

```ts
{
  slug: 'your-article-title',
  title: 'Your article title',
  description: 'A short introduction for the archive and search results.',
  category: 'Field notes',
  author: 'Coop team',
  date: '2026-09-14', // Replace with your publication date (YYYY-MM-DD).
  published: false,
  sections: [
    {
      id: 'the-question',
      heading: 'The question',
      paragraphs: ['Your opening paragraph.', 'Your next paragraph.'],
    },
    {
      id: 'what-we-learned',
      heading: 'What we learned',
      paragraphs: ['Your explanation.'],
      bullets: ['An optional takeaway.', 'Another takeaway.'],
    },
    {
      id: 'the-evidence',
      heading: 'The evidence',
      paragraphs: ['What the evaluation returns:'],
      orderedList: ['Recordings.', 'Logs.', 'Failure analysis.'],
    },
  ],
}
```

Use unique, lowercase, hyphenated slugs and section IDs. Body text is plain
text; HTML is escaped. Categories are freeform (for example, `Field notes`,
`Perspectives`, or `Experiment design`).

An optional cover can point to an image you add to `public/images/insights/`:

```ts
cover: {
  src: '/images/insights/your-image.jpg',
  alt: 'A useful description of the image.',
  width: 1600,
  height: 1000,
},
```

Add `caption` to the cover when a short image credit or explanation is useful.
Without a cover, previews use a text-only editorial layout.

Optional `introduction: string[]` and `pullQuote: string` fields appear before
the first section. A `contact: { text: string; email: string }` field adds a
closing paragraph with an email link. Keep the article body as plain text;
the template handles the blockquote, lists, and links accessibly.

Reading time includes the introduction, quote, sections, lists, and closing
paragraph. Dates are formatted consistently in UTC.

Set `published: true` when the article is ready. Published entries appear in
the three-column `/insights` archive (two columns on tablet, one on mobile),
with the newest presented as a full-width feature on the homepage
and up to two more stories beneath it. Each gets its own
`/insights/your-article-title` page. Posts sort by date, newest first.
The flag controls visibility, not the date: future dates do not schedule a post.
Entries with `published: false` do not appear anywhere, including direct URLs.

Run `npm run dev` to review locally, then `npm run lint` and `npm run build`
before deploying through the existing workflow. Changes to these files
require a deployment to appear on the live website.
