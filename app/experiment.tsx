'use client';
/* oxlint-disable nextjs/no-img-element -- Local artwork is explicitly sized and served directly by Vite. */

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  FileText,
  SlidersHorizontal,
  Camera,
  Bot,
  Box,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const steps = [
  {
    title: 'Set up',
    verb: 'Configure the physical world.',
    detail:
      'We prepare the robot, objects, sensors, and environment around your task. Together, we define what a successful run looks like.',
    file: 'Experiment specification',
    lines: [
      'Robot & task requirements',
      'Objects & scene conditions',
      'Acceptance criteria',
    ],
    icon: SlidersHorizontal,
    Camera,
    Bot,
    Box,
    CheckCircle2,
  },
  {
    title: 'Execute',
    verb: 'Put your policy to the test.',
    detail:
      'We run your experiment on physical hardware and capture the observations, actions, and outcomes that matter.',
    file: 'Synchronized observations',
    lines: ['Video & sensor streams', 'Actions & robot state', 'Task outcomes'],
    icon: ScanLine,
  },
  {
    title: 'Reset',
    verb: 'Make the next run comparable.',
    detail:
      'We reset the scene, recover the hardware, and repeat under the agreed conditions. Your engineers stay focused on the model.',
    file: 'Repeatable conditions',
    lines: [
      'Scene reset & initialization',
      'Operator intervention log',
      'Failure & recovery capture',
    ],
    icon: RotateCcw,
  },
  {
    title: 'Report',
    verb: 'Take the evidence back to work.',
    detail:
      'Get organized recordings, results, and failure analysis to compare versions and decide what to improve next.',
    file: 'Experiment report',
    lines: [
      'Results against your criteria',
      'Failures & recovery events',
      'Policy or dataset comparisons',
    ],
    icon: FileText,
  },
];

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

export function ExperimentWalkthrough() {
  const [step, setStep] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true,
  );
  const [manualPlaying, setPlaying] = useState<boolean | null>(null);
  const playing = manualPlaying ?? !reducedMotion;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setStep((s) => (s + 1) % steps.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [playing]);
  return (
    <div className="experiment-walkthrough" data-playing={playing}>
      <div className="walkthrough-top mono">
        <span>
          <i className="status-dot" /> The experiment loop
        </span>
        <Button
          variant="ghost"
          className="play-control"
          onClick={() => setPlaying(!playing)}
          aria-label={
            playing
              ? 'Pause experiment walkthrough'
              : 'Play experiment walkthrough'
          }
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </Button>
      </div>
      <Tabs
        value={String(step)}
        onValueChange={(value) => {
          setStep(Number(value));
          setPlaying(false);
        }}
        className="workflow-tabs"
      >
        <TabsList
          className="workflow-list"
          aria-label="Stages of a managed experiment"
        >
          {steps.map((s, i) => (
            <TabsTrigger
              key={s.title}
              value={String(i)}
              className="workflow-trigger"
            >
              <span className="step-number mono">0{i + 1}</span>
              <span>{s.title}</span>
              <span className="step-fill" key={`${i}-${step}-${playing}`} />
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="workflow-body">
          <div className="workflow-copy">
            {steps.map((s, i) => (
              <TabsContent key={s.title} value={String(i)}>
                <h3>{s.verb}</h3>
                <p>{s.detail}</p>
              </TabsContent>
            ))}
          </div>
          <div
            className="workflow-visual"
            aria-label={`Illustrative ${steps[step].title.toLowerCase()} workflow`}
          >
            <StepVisual step={step} key={step} />
            <span className="diagram-caption mono">
              Illustrative workflow · No measured results
            </span>
          </div>
        </div>
      </Tabs>
      <div className="loop-footer mono">
        <div className="loop-flow">
          <span>Your policy</span>
          <ArrowRight size={15} />
          <span>Physical experiment</span>
          <ArrowRight size={15} />
        </div>
        <span>Evidence for your next iteration</span>
      </div>
    </div>
  );
}

export function HeroSignal() {
  return (
    <div className="hero-signal" aria-hidden="true">
      <span className="reticle" />
      <span className="tracking-line" />
    </div>
  );
}

function StepVisual({ step }: { step: number }) {
  const Icon = steps[step].icon;
  return (
    <div className={`step-scene scene-${step}`}>
      <div className="scene-heading mono">
        <Icon size={17} />
        <span>{steps[step].file}</span>
        <span className="scene-index">0{step + 1}</span>
      </div>
      {step === 0 && (
        <div className="setup-diagram">
          <div className="setup-nodes">
            {[
              { Icon: Bot, label: 'Robot' },
              { Icon: Box, label: 'Task objects' },
              { Icon: Camera, label: 'Sensors' },
            ].map(({ Icon, label }, i) => (
              <div
                className="setup-node"
                key={label}
                style={{ animationDelay: `${i * 0.35}s` }}
              >
                <Icon size={29} strokeWidth={1.2} />
                <span className="mono">{label}</span>
                <CheckCircle2 className="node-check" size={13} />
              </div>
            ))}
          </div>
          <div className="setup-connectors">
            <span />
            <span />
            <span />
          </div>
          <div className="setup-spec">
            <SlidersHorizontal size={20} />
            <div>
              <span className="mono">Shared experiment spec</span>
              <p>Task · Conditions · Success criteria</p>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="execution-diagram">
          <div className="execution-camera">
            <img
              src="/images/humanoid-lab-hero.png"
              alt="Illustrative humanoid pick-and-place task"
            />
            <div className="camera-scan" />
            <span className="camera-label mono">Illustrative observation</span>
            <span className="object-target" />
          </div>
          <div className="telemetry mono">
            <span>Observation</span>
            <div className="telemetry-track">
              <i />
            </div>
            <span>Action</span>
          </div>
          <div className="execution-channels">
            {['Camera', 'Robot state', 'Policy action'].map((s, i) => (
              <div key={s}>
                <span className="mono">{s}</span>
                <div className="channel-bars">
                  {Array.from({ length: 20 }, (_, j) => (
                    <i
                      key={j}
                      style={{
                        height: `${20 + ((j * 13 + i * 21) % 80)}%`,
                        animationDelay: `${j * 0.07}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="reset-diagram">
          <div
            className="reset-grid"
            aria-label="Schematic showing objects returning to their starting positions"
          >
            <span className="mono reset-grid-label">
              Scene coordinates / top view
            </span>
            {[0, 1, 2].map((i) => (
              <div key={i} className={`reset-position position-${i}`}>
                <span className="reset-anchor" />
                <span className="reset-object" />
              </div>
            ))}
            <span className="reset-home mono">Reference positions</span>
          </div>
          <div className="reset-status">
            <RotateCcw size={22} />
            <div>
              <span className="mono">Restore the starting conditions</span>
              <p>Reposition objects. Reinitialize. Repeat.</p>
            </div>
          </div>
          <div className="reset-sequence mono">
            <span>Run ends</span>
            <ArrowRight size={12} />
            <span>Scene reset</span>
            <ArrowRight size={12} />
            <span>Next run</span>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="report-diagram">
          <div className="report-chart">
            <div className="report-legend mono">
              <span>
                <i />
                Version A
              </span>
              <span>
                <i />
                Version B
              </span>
            </div>
            {['Task completion', 'Recovery', 'Consistency'].map((label, i) => (
              <div className="comparison-row" key={label}>
                <span className="mono">{label}</span>
                <div className="comparison-bars">
                  <i
                    style={{
                      width: `${[56, 42, 64][i]}%`,
                      animationDelay: `${i * 0.16}s`,
                    }}
                  />
                  <i
                    style={{
                      width: `${[78, 69, 83][i]}%`,
                      animationDelay: `${i * 0.16 + 0.1}s`,
                    }}
                  />
                </div>
              </div>
            ))}
            <span className="report-note mono">
              Example comparison · Illustrative values
            </span>
          </div>
          <div className="report-deliverables mono">
            {['Recordings', 'Run logs', 'Failure analysis'].map((s, i) => (
              <span key={s} style={{ animationDelay: `${0.7 + i * 0.2}s` }}>
                <Check size={12} />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
