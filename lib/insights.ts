export type InsightSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  orderedList?: string[];
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
  cover?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  };
  introduction?: string[];
  pullQuote?: string;
  contact?: { text: string; email: string };
  sections: InsightSection[];
};

// Add your team's writing here. Drafts stay out of pages and direct article URLs.
// See INSIGHTS.md for the publishing workflow and a copyable post structure.
const insights: InsightPost[] = [
  {
    slug: 'why-were-building-coop',
    title: 'Why we’re building Coop',
    description:
      'A successful demo is a starting point. We’re building the physical infrastructure to find out what works, how reliably, and under which conditions.',
    category: 'Company',
    author: 'Coop team',
    date: '2026-09-16',
    published: true,
    cover: {
      src: '/images/insights/why-were-building-coop.webp',
      alt: 'A humanoid robot evaluating a small object-placement task, with an overhead camera, matching reset trays, and a monitor recording the trial',
      width: 1536,
      height: 1024,
      caption: 'Concept illustration of a physical evaluation workcell.',
    },
    introduction: [
      'Imagine a team has just finished training a new robot policy, or assembled a dataset they believe will make an existing policy better at picking up a pair of Apple AirPods. They have training results and model versions that look reasonable at first glance. What they don’t have is an answer to the fundamental question on which the promise of robotics ultimately rests:',
    ],
    pullQuote:
      'Does this work on a real robot, doing a real task, more than once?',
    sections: [
      {
        id: 'the-problem',
        heading: 'The problem',
        paragraphs: [
          'Training a policy or curating a dataset is, at this point, a reasonably well-understood process. Turning that work into physical evidence is not.',
          'A team that wants an answer to that question needs a robot suited to the task, paired correctly with the model. Camera placement, sensor configurations, control frequencies, and action spaces all have to match what the policy expects. Mismatches and inconsistencies in this protocol produce results that look like model failures but are actually integration failures.',
          'Once the hardware is up and running, someone has to calibrate the workspace continuously and precisely enough that a trial run today means the same thing as a trial run next week. Then the trials have to happen, enough times to say something statistically meaningful. Seems easy enough, right?',
          'Well, as Mike Tyson put it, “Everybody has a plan until they get punched in the mouth.”',
          'In the lab, that might mean an object getting knocked over or a gripper slipping halfway through a task. Someone has to reset the scene the same way, over and over, and log every human intervention so a helping human hand isn’t counted as a robot success.',
          'A single successful demonstration answers essentially nothing on its own. It doesn’t say whether the policy succeeds 95% of the time or 5% of the time. It doesn’t say whether that same success holds up under different flooring, colors, lighting, or cooling. Reproducibility and generalization are the exact questions that robot evaluation currently struggles with.',
          'If you speak to an expert in the field, they will tell you that none of this is a novel observation. And that’s because it isn’t. Frontier labs already handle it well, and several have built infrastructure specifically to make evaluation more standardized and comparable across testing environments.',
          'At Coop, our focus is on making that infrastructure accessible. Operating it is a substantial and ongoing burden, and lots of teams developing models or datasets:',
        ],
        bullets: [
          'Don’t have it.',
          'Don’t have enough of it.',
          'Would rather not run it themselves for every comparison they want to make.',
        ],
      },
      {
        id: 'what-were-building',
        heading: 'What we’re building',
        paragraphs: [
          'Our starting point is simple. A team brings us a model or a dataset. We configure the lab around the evaluation.',
          'If a policy brought to us needs a specific arm, a specific gripper, a particular camera rig, or a humanoid robot, that’s what goes in the lab. We are not asking teams to bend their models to fit whatever we have on our floor. We would rather bend the floor.',
          'Before anything runs, there’s tons of unglamorous work to do. Lucky for the teams working with us, that’s the kind that happens to be our favorite part. We confirm the model’s inputs and outputs, agree on the task, the conditions, and what actually counts as success. Then we run it enough times that the result carries substance.',
          'What comes back to you is the entire receipt:',
        ],
        orderedList: [
          'The recording.',
          'The logs.',
          'A breakdown of what failed, and how.',
          'Every time a human had to step in.',
          'The conditions the result holds under.',
        ],
      },
      {
        id: 'what-comes-next',
        heading: 'What comes next',
        paragraphs: [
          'Future posts here will cover our methods in more detail. They will include notes from setting up and calibrating the lab, specific experiments and what we learn from them, including the ones that don’t go as planned, and eventually more formal research reports and papers.',
        ],
      },
    ],
    contact: {
      text: 'If you’re working on a robot model or dataset and have a physical evaluation question you haven’t been able to answer, we would love to hear about it.',
      email: 'founders@cooplabs.com',
    },
  },
];

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
    ...(post.introduction ?? []),
    post.pullQuote ?? '',
    post.contact?.text ?? '',
    ...post.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets ?? []),
      ...(section.orderedList ?? []),
    ]),
  ].join(' ');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));
}
