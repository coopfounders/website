/* oxlint-disable nextjs/no-img-element -- Local artwork is explicitly sized and served directly by Vite. */
import { ContactTrigger } from '@/components/contact-dialog';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { ExperimentWalkthrough, HeroSignal } from './experiment';
import { ScrollEffects } from './scroll-effects';

const experiments = [
  {
    no: '01',
    type: 'Models & policies',
    title: 'Does the next version actually work better?',
    description:
      'Compare policies across agreed tasks, objects, and conditions. Capture regressions and the failures worth learning from.',
    tags: ['Policy comparisons', 'Task generalization', 'Regression testing'],
  },
  {
    no: '02',
    type: 'Training data',
    title: 'Does better data lead to better behavior?',
    description:
      'Run controlled comparisons to see how a dataset or processing change affects performance on real robots.',
    tags: [
      'Dataset comparisons',
      'Demonstration quality',
      'Real-robot validation',
    ],
  },
  {
    no: '03',
    type: 'Simulation & infrastructure',
    title: 'What happens when your system meets reality?',
    description:
      'Test transfer from simulation and surface the physical edge cases that matter to your training or deployment workflow.',
    tags: ['Sim-to-real transfer', 'Hardware variation', 'Failure analysis'],
  },
];
export default function Home() {
  return (
    <main>
      <ScrollEffects />
      <section className="hero wrap" id="main-content">
        <div className="hero-eyebrow mono">
          <span>
            <i className="status-dot" />
            San Francisco, CA
          </span>
        </div>
        <h1>
          <span>Your models.</span>
          <span className="indent">The real world.</span>
        </h1>
        <div className="hero-stage">
          <div className="hero-copy">
            <p>
              You build the intelligence.
              <br />
              We run the experiments.
            </p>
            <p className="support-copy">
              A managed robotics lab for physical setup, policy testing, resets,
              and reporting.
            </p>
            <ContactTrigger className="cta">
              Bring us your experiment <ArrowUpRight size={17} />
            </ContactTrigger>
            <div className="partner-credits" aria-label="Our supporters">
              <div className="partner-credit partner-speedrun">
                <span className="mono">Backed by</span>
                <div className="partner-logo">
                  <img
                    src="/images/a16z-speedrun.png"
                    alt="a16z Speedrun"
                    width="604"
                    height="89"
                  />
                </div>
              </div>
              <div className="partner-credit partner-inception">
                <span className="mono">Member of</span>
                <div className="partner-logo">
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
          <div className="hero-art">
            <img
              className="robot-image"
              src="/images/humanoid-lab-hero.png"
              alt="Concept illustration of a humanoid testing a pick-and-place task"
              width="1536"
              height="1024"
              fetchPriority="high"
            />
            <HeroSignal />
            <div className="scene-label mono">
              <span className="accent-square" />
              Humanoid · Pick & place
              <span className="concept-label">Concept illustration</span>
            </div>
          </div>
        </div>
        <div className="hero-bottom mono">
          <a href="#how-it-works">
            Inside the experiment <ArrowDown size={15} />
          </a>
          <span>Setup → Execute → Reset → Report</span>
        </div>
      </section>
      <section id="how-it-works" className="operations wrap">
        <div className="intro">
          <span className="mono section-label">01 / The physical layer</span>
          <h2>
            Your model, <span>our lab</span>
          </h2>
          <div className="intro-description">
            <p>
              Physical experiments come with physical work. We handle the setup,
              execution, resets, and reporting so your team can spend its time
              on what comes next.
            </p>
          </div>
        </div>
        <ExperimentWalkthrough />
      </section>
      <section id="experiments" className="experiments-section wrap">
        <div className="experiment-heading">
          <span className="mono section-label">
            02 / Built around your question
          </span>
          <h2>What do you need to prove next?</h2>
          <p>
            For teams building models, data, and tools for the physical world.
          </p>
        </div>
        <div className="use-cases">
          {experiments.map((e) => (
            <article className="use-case" key={e.no}>
              <div className="use-case-label mono">
                <span>{e.no}</span>
                <span>{e.type}</span>
              </div>
              <div className="use-case-content">
                <h3>{e.title}</h3>
                <p>{e.description}</p>
                <ul className="case-tags mono">
                  {e.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="contact-section" id="contact">
        <div className="wrap contact-inner">
          <div className="contact-kicker mono">
            <span>03 / Your next experiment</span>
          </div>
          <h2>
            Bring your next
            <br />
            experiment to life<span className="accent-text">.</span>
          </h2>
          <div className="contact-bottom">
            <p>
              Tell us what you want to test.
              <br />
              We’ll work through the hardware, scope, and outputs together.
            </p>
            <ContactTrigger className="cta">
              Talk to the team <ArrowUpRight size={18} />
            </ContactTrigger>
          </div>
        </div>
      </section>
    </main>
  );
}
