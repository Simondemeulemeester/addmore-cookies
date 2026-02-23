/**
 * Next.js integration example
 *
 * 1. Install: npm install @addmore/cookie-consent
 * 2. Wrap your app with the provider in layout.tsx
 * 3. Place the <CookieConsent /> banner component
 * 4. Use useCookieConsent() in any component to check consent state
 */

// ─── app/layout.tsx ───────────────────────────────────────────────
// "use client" at the top of the layout or a dedicated Providers component

import Script from 'next/script';
import {
  CookieConsentProvider,
  CookieConsent,
} from '@addmore/cookie-consent/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CookieConsentProvider config={{ consentVersion: '1' }}>
          {children}

          {/* Banner — style with your own CSS / Tailwind classes */}
          <CookieConsent
            className="cookie-banner"
            labels={{
              title: 'We care about your privacy',
              acceptAll: 'Accept All',
              rejectAll: 'Decline',
              customize: 'Manage Preferences',
            }}
          />
        </CookieConsentProvider>

        {/* GTM — loads AFTER consent defaults are set by the provider */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-XXXXXXX');
            `,
          }}
        />
      </body>
    </html>
  );
}

// ─── app/page.tsx (example usage) ─────────────────────────────────
// "use client"

/*
import { useCookieConsent } from '@addmore/cookie-consent/react';

export default function Page() {
  const { consent, hasConsent, showPreferences } = useCookieConsent();

  return (
    <main>
      <h1>Home</h1>
      {hasConsent && <p>Analytics: {consent?.categories.analytics ? 'on' : 'off'}</p>}
      <button onClick={showPreferences}>Manage Cookie Settings</button>
    </main>
  );
}
*/
