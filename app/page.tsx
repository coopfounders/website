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
    title: 'Start with a shared protocol',
    description:
      'Define the robot, tasks, conditions, and success rules. Check policy compatibility and establish a reference baseline before the scored evaluation begins.',
  },
  {
    title: 'Make every trial count',
    description:
      'Run repeated trials with controlled starting conditions and documented resets. Record failures, interruptions, and human interventions alongside successful runs.',
  },
  {
    title: 'Connect results to evidence',
    description:
      'Review results by task and condition, with trial counts, uncertainty, and recordings. Understand what the comparison supports, where it is limited, and what needs another test.',
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
            Real-world benchmarks for intelligent machines
          </h1>
          <p className="hero-summary">
            Coop evaluates robot policies on real hardware, measuring what
            works, where it fails, and how reliably it performs.
          </p>
          <div className="hero-editorial-actions">
            <ContactTrigger className="editorial-button">
              Discuss an evaluation{' '}
              <ArrowUpRight size={17} aria-hidden="true" />
            </ContactTrigger>
            <a href="#experiments" className="editorial-link">
              Explore the benchmarks <ArrowDown size={16} aria-hidden="true" />
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
          turns those questions into repeatable evaluations, with defined
          conditions, measurable outcomes, and evidence you can inspect.
        </p>
      </section>

      <section
        className="editorial-experiments"
        id="experiments"
        aria-labelledby="experiments-title"
      >
        <div className="wrap">
          <div className="editorial-section-intro" data-reveal="rise">
            <p className="overline">Benchmarking & evaluations</p>
            <h2 id="experiments-title">Know what holds up in the real world</h2>
            <p>
              Compare policies, test their limits, and measure progress through
              controlled experiments on real robots.
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
          <p className="overline">How we benchmark</p>
          <h2 id="approach-title">Trust starts with the protocol</h2>
          <p>
            A useful benchmark makes clear what was tested, how it was scored,
            and what the result means. We build the evaluation around those
            details from the start.
          </p>
          <ContactTrigger className="editorial-link">
            Plan an evaluation <ArrowUpRight size={17} aria-hidden="true" />
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
                Notes on robot learning, benchmark design, and what physical
                evaluations reveal about progress in robotics.
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
