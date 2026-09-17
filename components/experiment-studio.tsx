'use client';

/* oxlint-disable nextjs/no-img-element -- Local editorial artwork is explicitly sized. */
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ContactTrigger } from './contact-dialog';

const experiments = [
  {
    name: 'Policy comparison',
    title: 'Compare policies on common ground',
    description:
      'Evaluate compatible policies on the same robot, tasks, and starting conditions. Measure autonomous success, completion time, and interventions, with every trial accounted for.',
    comparison: 'Different policies on one documented robot setup',
    evidence:
      'Per-task results, trial counts, and success and failure recordings',
    image: '/images/coop-benchmark-comparison-humanoid.webp',
    alt: 'Concept illustration of two matching humanoid robots sorting blocks at identical workstations for repeated policy comparison trials',
  },
  {
    name: 'Robustness',
    title: 'Find where performance starts to break',
    description:
      'Vary object placement, lighting, or clutter in a controlled test. See which conditions a policy handles reliably, which failures repeat, and when it needs human help.',
    comparison: 'One policy across defined changes in task conditions',
    evidence:
      'Results by condition, intervention counts, and failure recordings',
    image: '/images/coop-benchmark-robustness-humanoid.webp',
    alt: 'Concept illustration of a humanoid robot sorting objects with interchangeable trays showing sparse and cluttered arrangements',
  },
  {
    name: 'Regression testing',
    title: 'Know whether a new version is a step forward',
    description:
      'Re-run a fixed task suite when a checkpoint, training dataset, or control setting changes. Compare against a reference baseline to see where performance improves and where earlier capabilities slip.',
    comparison: 'Baseline and candidate on the same versioned task suite',
    evidence: 'Per-task changes, trial counts, and recordings of regressions',
    image: '/images/coop-benchmark-regression-humanoid.webp',
    alt: 'Concept illustration of a humanoid robot beside a monitor showing paired humanoid task recordings, with a placed object in one and a missed placement in the other',
  },
];

export function ExperimentStudio() {
  const [selected, setSelected] = useState(0);
  const experiment = experiments[selected];

  return (
    <div className="experiment-studio">
      <fieldset className="studio-options" data-reveal="rise">
        <legend className="sr-only">Choose an evaluation type</legend>
        {experiments.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={selected === index}
            aria-controls="experiment-detail"
            onClick={() => setSelected(index)}
          >
            {item.name}
          </button>
        ))}
      </fieldset>
      <div className="studio-panel" id="experiment-detail">
        <figure className="studio-visual" data-reveal="rise">
          <img
            key={experiment.image}
            src={experiment.image}
            alt={experiment.alt}
            width="1024"
            height="1024"
            loading="lazy"
          />
        </figure>
        <div
          className="studio-copy"
          aria-live="polite"
          aria-atomic="true"
          data-reveal="rise"
          data-reveal-delay="1"
        >
          <h3>{experiment.title}</h3>
          <p>{experiment.description}</p>
          <dl>
            <div>
              <dt>The comparison</dt>
              <dd>{experiment.comparison}</dd>
            </div>
            <div>
              <dt>The evidence</dt>
              <dd>{experiment.evidence}</dd>
            </div>
          </dl>
          <ContactTrigger className="editorial-link">
            Discuss an evaluation <ArrowRight size={17} aria-hidden="true" />
          </ContactTrigger>
        </div>
      </div>
    </div>
  );
}
