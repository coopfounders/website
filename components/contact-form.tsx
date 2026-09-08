'use client';

import Link from 'next/link';

import { useRef, useState, useSyncExternalStore } from 'react';
import type { SubmitEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';

const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function ContactForm({ onNavigate }: { onNavigate?: () => void }) {
  // Mount inputs after hydration so autofill extensions can safely add controls.
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const statusElement = useRef<HTMLParagraphElement>(null);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    submitting.current = true;
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || result.ok !== true) {
        setError(
          result.error ||
            'We couldn’t send your inquiry. Please try again later.',
        );
        setStatus('error');
        return;
      }
      form.reset();
      setStatus('success');
    } catch {
      setError('We couldn’t confirm delivery. Please try again later.');
      setStatus('error');
    } finally {
      submitting.current = false;
      requestAnimationFrame(() => statusElement.current?.focus());
    }
  }

  if (!ready)
    return (
      <div className="contact-form-placeholder" aria-busy="true">
        <p className="form-note">Loading inquiry form…</p>
        <noscript>
          <p>
            Please enable JavaScript to use the form, or email
            founders@cooplabs.com.
          </p>
        </noscript>
      </div>
    );

  return (
    <form
      className="contact-form"
      onSubmit={submit}
      aria-busy={status === 'sending'}
    >
      <div className="form-field">
        <label htmlFor="contact-name">Your name</label>
        <input
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          placeholder="Full name"
        />
      </div>
      <div className="form-field">
        <label htmlFor="contact-email">Email address</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@company.com"
        />
      </div>
      <div className="form-field form-full">
        <label htmlFor="contact-company">
          Company <span>(optional)</span>
        </label>
        <input
          id="contact-company"
          name="company"
          autoComplete="organization"
          maxLength={150}
          placeholder="Your team or organization"
        />
      </div>
      <div className="form-field form-full">
        <label htmlFor="contact-message">What would you like to test?</label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={20}
          maxLength={5000}
          placeholder="Tell us about your task, hardware, timeline, or the question you want to answer."
          aria-describedby="contact-message-help"
        />
        <p id="contact-message-help" className="form-note">
          A few sentences is plenty. Please leave out confidential information.
        </p>
      </div>
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <p className="form-note form-full">
        We’ll use these details to respond to your inquiry, as described in our{' '}
        <Link href="/privacy" onClick={onNavigate}>
          privacy policy
        </Link>
        . No mailing lists.
      </p>
      <div className="form-submit form-full">
        <span className="form-note">
          All fields required unless marked optional.
        </span>
        <button className="cta" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send inquiry'}
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div
        className="form-full form-feedback"
        aria-live="polite"
        aria-atomic="true"
      >
        {status === 'success' && (
          <p className="form-status" tabIndex={-1} ref={statusElement}>
            <Check size={17} aria-hidden="true" /> Your inquiry has been sent.
            Thanks for telling us about your experiment. We’ll reply to the
            email you provided.
          </p>
        )}
        {status === 'error' && (
          <p
            className="form-status"
            data-error="true"
            tabIndex={-1}
            ref={statusElement}
          >
            {error} Your entries are still here. You can also reach us at{' '}
            <a href="mailto:founders@cooplabs.com">founders@cooplabs.com</a>.
          </p>
        )}
      </div>
      <noscript>
        <p className="form-note form-full">
          Please enable JavaScript to submit this form, or email
          founders@cooplabs.com.
        </p>
      </noscript>
    </form>
  );
}
