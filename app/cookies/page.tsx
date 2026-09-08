import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie policy',
  description:
    'The essential cookie Coop uses and how to manage your privacy preferences.',
};

export default function CookiesPage() {
  return (
    <main className="policy-page wrap" id="main-content">
      <div className="page-intro">
        <h1>Cookie policy</h1>
        <p className="policy-date">Last updated September 7, 2026</p>
        <p>
          We keep this simple. Coop uses one essential cookie to remember your
          privacy choice. We do not use analytics, advertising, or cross-site
          tracking cookies.
        </p>
      </div>
      <div className="policy-body">
        <section>
          <h2>What cookies do</h2>
          <p>
            Cookies are small pieces of information stored by your browser. They
            can remember a preference between visits. Our privacy cookie records
            only that you chose necessary cookies; it contains no personal
            identifier.
          </p>
        </section>
        <section>
          <h2>What this site stores</h2>
          <div className="policy-table-wrap">
            <table className="policy-table">
              <caption>Coop’s essential cookie</caption>
              <thead>
                <tr>
                  <th scope="col">Cookie</th>
                  <th scope="col">Purpose</th>
                  <th scope="col">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>coop_cookie_consent</code>
                  </td>
                  <td>
                    Remembers your necessary-only cookie choice. Set by this
                    website when you save your choice.
                  </td>
                  <td>180 days</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            This cookie is strictly necessary to remember the privacy setting
            you request. The website can still be browsed if your browser blocks
            it, but the notice may reappear.
          </p>
        </section>
        <section>
          <h2>No optional tracking</h2>
          <p>
            We do not currently use analytics cookies, advertising pixels, or
            embedded third-party media. Our images and fonts load from the site
            or your device. If we introduce optional cookies, we will explain
            them here and request your permission before they are used.
          </p>
        </section>
        <section>
          <h2>Manage your choice</h2>
          <p>You can delete cookies or block them in your browser settings.</p>
        </section>
        <section>
          <h2>Questions</h2>
          <p>
            For more about personal information, read our{' '}
            <Link href="/privacy">privacy policy</Link>. You can contact us at{' '}
            <a href="mailto:founders@cooplabs.com">founders@cooplabs.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
