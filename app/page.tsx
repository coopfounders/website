/* oxlint-disable nextjs/no-img-element -- Local editorial artwork and brand assets are explicitly sized. */
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { ContactTrigger } from '@/components/contact-dialog';
import { ExperimentStudio } from '@/components/experiment-studio';
import { LandscapeLines } from '@/components/landscape-lines';
import { InsightCard } from '@/components/insight-card';
import { getPublishedInsights } from '@/lib/insights';
import labPanorama from '@/public/images/coop-lab-panorama-v2.webp';
import mobileLab from '@/public/images/coop-lab-mobile.webp';
import { ScrollEffects } from './scroll-effects';

const process = [
  {
    title: 'Define the experiment',
    description:
      'We work with you to choose the task, hardware, conditions, and success criteria. The scope and outputs are agreed before the first trial.',
  },
  {
    title: 'Run the physical work',
    description:
      'Our team handles the setup, execution, and resets. We keep track of the conditions and capture the behavior that matters to your question.',
  },
  {
    title: 'Review and iterate',
    description:
      'Review the recordings, results, and failure cases with your team. Use the evidence to decide what to change and what to test next.',
  },
];

export default function Home() {
  const posts = getPublishedInsights();
  return (
    <main className="frontier-home" id="main-content">
      <ScrollEffects />
      <section className="frontier-hero" aria-labelledby="hero-title">
        <div className="hero-landscape" aria-hidden="true">
          <LandscapeLines />
          <picture className="hero-artwork">
            <source
              media="(max-width: 800px)"
              srcSet={mobileLab.src}
              width={mobileLab.width}
              height={mobileLab.height}
            />
            <img
              src={labPanorama.src}
              alt=""
              width={labPanorama.width}
              height={labPanorama.height}
              fetchPriority="high"
            />
          </picture>
        </div>
        <div className="hero-editorial-copy">
          <h1 id="hero-title">
            Real-world experiments for intelligent machines
          </h1>
          <p className="hero-summary">
            We give robotics teams the lab and operational support to turn
            research questions into physical experiments.
          </p>
          <div className="hero-editorial-actions">
            <ContactTrigger className="editorial-button">
              Work with Coop <ArrowUpRight size={17} aria-hidden="true" />
            </ContactTrigger>
            <a href="#experiments" className="editorial-link">
              Explore the experiments <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="hero-supporters" aria-label="Our supporters">
            <div className="hero-supporter">
              <span>Backed by</span>
              <div className="hero-supporter-logo">
                <img
                  src="/images/a16z-speedrun.png"
                  alt="a16z Speedrun"
                  width="604"
                  height="89"
                />
              </div>
            </div>
            <div className="hero-supporter hero-supporter-nvidia">
              <span>Member of</span>
              <div className="hero-supporter-logo">
                <img
                  src="/images/nvidia-inception-black.png"
                  alt="NVIDIA Inception Program"
                  width="658"
                  height="234"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="research-statement wrap"
        aria-labelledby="research-title"
      >
        <div data-reveal="rise">
          <p className="overline">The physical side of AI</p>
          <h2 id="research-title">
            Progress in robotics depends on what happens{' '}
            <span className="research-highlight">outside the model</span>
          </h2>
        </div>
        <p
          className="research-statement-copy"
          data-reveal="rise"
          data-reveal-delay="1"
        >
          Understanding how a robot moves an object, recovers from a mistake,
          and works in changing conditions takes time with real hardware. Coop
          brings the equipment, physical setup, and day-to-day lab operations
          together, so your team can focus on the research.
        </p>
      </section>

      <section
        className="editorial-experiments"
        id="experiments"
        aria-labelledby="experiments-title"
      >
        <div className="wrap">
          <div className="editorial-section-intro" data-reveal="rise">
            <p className="overline">Experiments at Coop</p>
            <h2 id="experiments-title">
              A closer look at what your robots can do
            </h2>
            <p>
              Start with the question your team needs to answer. We’ll shape the
              experiment around it.
            </p>
          </div>
          <ExperimentStudio />
        </div>
      </section>

      <section
        className="lab-approach wrap"
        id="how-it-works"
        aria-labelledby="approach-title"
      >
        <div className="approach-intro" data-reveal="rise">
          <p className="overline">Working with the lab</p>
          <h2 id="approach-title">An extension of your research team</h2>
          <p>
            From an initial question to a set of runs you can learn from, we
            manage the physical work at every stage.
          </p>
          <ContactTrigger className="editorial-link">
            Talk through your project{' '}
            <ArrowUpRight size={17} aria-hidden="true" />
          </ContactTrigger>
        </div>
        <div className="approach-details">
          {process.map((step, index) => (
            <details
              key={step.title}
              open={index === 0}
              data-reveal="rise"
              data-reveal-delay={index}
            >
              <summary>
                <span className="approach-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <Plus size={18} aria-hidden="true" />
              </summary>
              <p>{step.description}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="editorial-journal wrap"
        aria-labelledby="journal-title"
      >
        {posts.length > 0 ? (
          <>
            <div className="editorial-journal-heading" data-reveal="rise">
              <div>
                <p className="overline">From the Coop team</p>
                <h2 id="journal-title">Research & insights</h2>
              </div>
              <Link href="/insights" className="editorial-link">
                View all insights <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="insights-grid" data-reveal="rise">
              {posts.slice(0, 3).map((post) => (
                <InsightCard key={post.slug} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div className="journal-invitation" data-reveal="journal">
            <LandscapeLines className="journal-landscape" />
            <div className="reveal-part">
              <p className="overline">From the Coop team</p>
              <h2 id="journal-title">Research & insights</h2>
            </div>
            <div
              className="journal-invitation-copy reveal-part"
              data-reveal-step="1"
            >
              <p>
                Perspectives on robotics, experimental practice, and the work of
                building a physical lab.
              </p>
              <Link href="/insights" className="editorial-link">
                Visit the journal <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <span className="journal-note reveal-part" data-reveal-step="2">
              First articles coming soon
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
