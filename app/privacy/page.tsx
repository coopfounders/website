import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How Coop handles information when you visit our website or contact our team.',
};

export default function PrivacyPage() {
  return (
    <main className="policy-page wrap" id="main-content">
      <div className="page-intro">
        <h1>Privacy policy</h1>
        <p className="policy-date">Last updated September 7, 2026</p>
        <p>
          We want you to understand what you share with Coop and how we use it.
          This policy covers our website and inquiries about our robotics lab
          services.
        </p>
      </div>
      <div className="policy-body">
        <section>
          <h2>Who we are</h2>
          <p>
            Coop is a managed robotics lab based in San Francisco, California.
            Coop is responsible for the personal information described in this
            policy. For privacy questions or requests, contact{' '}
            <a href="mailto:founders@cooplabs.com">founders@cooplabs.com</a>.
          </p>
        </section>
        <section>
          <h2>Information we receive</h2>
          <p>
            When you submit an inquiry, we receive your name, email address,
            company if provided, and the details you choose to share about your
            experiment. Please do not include passwords, sensitive personal
            information, or confidential datasets in the form.
          </p>
          <p>
            Our hosting services may process technical information such as your
            IP address, browser type, requested pages, and request time to
            deliver the site and maintain security. We do not use advertising
            pixels or visitor analytics on this site.
          </p>
        </section>
        <section>
          <h2>How we use your information</h2>
          <p>
            We use inquiry details to respond to you, discuss your project,
            scope an experiment, and manage our business relationship. We use
            technical information to operate, troubleshoot, and protect the
            website. We do not use contact form submissions to sign you up for
            marketing.
          </p>
          <p>
            Where data protection law requires a legal basis, we process
            inquiries to take steps at your request before entering a contract,
            and rely on our legitimate interests in responding to business
            inquiries and keeping our services secure. We may also process
            information to meet legal obligations.
          </p>
        </section>
        <section>
          <h2>Who can receive it</h2>
          <p>
            Information may be handled by our team and service providers that
            support website hosting, inquiry delivery, and email. They receive
            the information needed to provide those services. We use Resend to
            send your inquiry details to our team by email. Your email address
            is included as the reply address so we can respond directly. We may
            disclose information when required by law or to protect legal
            rights. We do not sell personal information or share it for targeted
            advertising.
          </p>
        </section>
        <section>
          <h2>Storage and retention</h2>
          <p>
            We keep inquiry information for as long as needed to respond, manage
            our relationship, and meet applicable legal obligations. Retention
            depends on the nature of the inquiry and whether it leads to an
            ongoing engagement. Information may be processed in the United
            States or other countries where our service providers operate. Where
            applicable, required safeguards are used for international
            transfers.
          </p>
        </section>
        <section>
          <h2>Cookies and your choices</h2>
          <p>
            This website does not use cookies, browser storage, analytics tools,
            or advertising trackers. Our contact form sends inquiries through
            our server and does not load a third-party form or tracking script.
            Read more on our <Link href="/cookies">cookie policy page</Link>.
          </p>
        </section>
        <section>
          <h2>Your privacy rights</h2>
          <p>
            Depending on where you live and which laws apply, you may have
            rights to access, correct, delete, or receive a copy of your
            information, restrict or object to processing, and withdraw consent
            where processing relies on it. Contact{' '}
            <a href="mailto:founders@cooplabs.com">founders@cooplabs.com</a> to
            make a request. We may need to verify your identity before
            responding. You may also have the right to complain to your local
            data protection authority.
          </p>
        </section>
        <section>
          <h2>Updates to this policy</h2>
          <p>
            We may update this policy as our services or practices change. The
            date above shows the latest revision. Material changes will be
            explained on this website where required.
          </p>
        </section>
      </div>
    </main>
  );
}
