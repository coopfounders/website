'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { ContactForm } from './contact-form';

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
const isInquiryLink = () => window.location.hash === '#inquiry';
const serverClosed = () => false;

export function ContactDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const linkedOpen = useSyncExternalStore(
    subscribeToHash,
    isInquiryLink,
    serverClosed,
  );
  const title = useRef<HTMLHeadingElement>(null);

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && linkedOpen) {
      history.replaceState(
        history.state,
        '',
        location.pathname + location.search,
      );
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }

  return (
    <Dialog.Root open={open || linkedOpen} onOpenChange={changeOpen}>
      {children}
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop className="contact-modal-backdrop" />
        <Dialog.Popup className="contact-modal" initialFocus={title}>
          <Dialog.Close
            className="contact-modal-close"
            aria-label="Close contact form"
          >
            <X size={20} aria-hidden="true" />
          </Dialog.Close>
          <div className="contact-modal-scroll">
            <div className="contact-modal-intro">
              <span className="mono section-label">
                <i className="status-dot" /> Your next experiment
              </span>
              <Dialog.Title ref={title} tabIndex={-1}>
                Let’s build what’s next
              </Dialog.Title>
              <Dialog.Description>
                Tell us what you’re working on and what you want to learn. We’ll
                take it from there.
              </Dialog.Description>
            </div>
            <ContactForm onNavigate={() => changeOpen(false)} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ContactTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Dialog.Trigger className={className}>{children}</Dialog.Trigger>;
}
