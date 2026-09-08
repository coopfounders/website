'use client';

import { useEffect } from 'react';

export function LegacyCookieCleanup() {
  useEffect(() => {
    // Expire the preference saved by the previous notice. No new cookie is kept.
    try {
      if (document.cookie.split('; ').some(cookie => cookie.startsWith('coop_cookie_consent='))) {
        document.cookie = `coop_cookie_consent=; Path=/; Max-Age=0; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
      }
    } catch {
      // Browsers that block cookies have no preference to clean up.
    }
  }, []);
  return null;
}
