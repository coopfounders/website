# Publishing an insight

Insights is intentionally empty until the Coop team adds its own writing.
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

Without a cover, previews use a text-only editorial layout. The article stays
focused on the writing. Reading time is calculated
automatically; dates are formatted consistently in UTC.

Set `published: true` when the article is ready. Published entries appear in
`/insights`, with the three most recent on the homepage, and each gets its
own `/insights/your-article-title` page. Posts sort by date, newest first.
The flag controls visibility, not the date: future dates do not schedule a post.
Entries with `published: false` do not appear anywhere, including direct URLs.

Run `npm run dev` to review locally, then `npm run lint` and `npm run build`
before deploying through the existing workflow. Changes to these files
require a deployment to appear on the live website.
