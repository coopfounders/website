'use client';

/* oxlint-disable nextjs/no-img-element -- Local editorial artwork is explicitly sized. */
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ContactTrigger } from './contact-dialog';

const experiments = [
  {
    name: 'Policy evaluation',
    title: 'Understand how your policy behaves on a real robot',
    description:
      'Compare versions across the same tasks, objects, and starting conditions. Build a clearer picture of what improved, what regressed, and what to investigate next.',
    variable: 'Policy version, task, or operating condition',
    evidence: 'Trial recordings, outcomes, and failure cases',
    image: '/images/coop-experiment-policy.webp',
    alt: 'Two robot arms performing matched block-sorting trials at adjacent workstations',
  },
  {
    name: 'Data validation',
    title: 'See what a change in training data changes in practice',
    description:
      'Take a dataset or processing decision beyond an offline metric. Run controlled comparisons to understand its effect on behavior in a physical environment.',
    variable: 'Dataset, demonstration quality, or processing method',
    evidence: 'Behavioral comparisons across agreed tasks',
    image: '/images/coop-experiment-data.webp',
    alt: 'Cameras recording a humanoid robot demonstration beside a monitor showing captured task sequences',
  },
  {
    name: 'Sim-to-real',
    title: 'Find the gaps between a simulation and a physical task',
    description:
      'Test transfer on real hardware and examine the details that simulation can miss, from object placement and lighting to contact and hardware variation.',
    variable: 'Environment, object properties, or hardware setup',
    evidence: 'Transfer outcomes and physical failure analysis',
    image: '/images/coop-experiment-transfer.webp',
    alt: 'A blue wireframe simulation beside the same robot arm and manipulation task on physical hardware',
  },
];

export function ExperimentStudio() {
  const [selected, setSelected] = useState(0);
  const experiment = experiments[selected];

  return (
    <div className="experiment-studio">
      <fieldset className="studio-options" data-reveal="rise">
        <legend className="sr-only">Choose an experiment type</legend>
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
          <figcaption>
            <span>{experiment.name}</span>
          </figcaption>
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
              <dt>What we vary</dt>
              <dd>{experiment.variable}</dd>
            </div>
            <div>
              <dt>What you review</dt>
              <dd>{experiment.evidence}</dd>
            </div>
          </dl>
          <ContactTrigger className="editorial-link">
            Discuss an experiment <ArrowRight size={17} aria-hidden="true" />
          </ContactTrigger>
        </div>
      </div>
    </div>
  );
}
