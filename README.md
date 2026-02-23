# @addmore/cookie-consent

Lightweight, GDPR/ePrivacy-compliant cookie consent with Google Consent Mode v2 and GTM integration. Built for Webflow and Next.js.

**2.8 KB gzipped** (IIFE bundle).

## Features

- Google Consent Mode v2 — consent defaults set synchronously before GTM loads
- Global Privacy Control (GPC) — auto-rejects and hides the banner
- Consent versioning — bump the version to re-prompt returning visitors
- DataLayer audit trail — every action fires a `consent_update` event
- Keyboard accessible with ARIA attributes and focus trapping
- Zero dependencies (React is an optional peer dependency)

## Consent categories

| Category | Consent Mode types | User can toggle? |
|---|---|---|
| Necessary | `security_storage` | No (always on) |
| Functional | `functionality_storage`, `personalization_storage` | Yes |
| Analytics | `analytics_storage` | Yes |
| Marketing | `ad_storage`, `ad_user_data`, `ad_personalization` | Yes |

---

## Webflow

The IIFE bundle is fully self-contained — it injects its own CSS for animations and positioning. You just provide the HTML structure and your own visual styles.

### 1. Add the script

Add this in your **Page Settings → Head Code** (or site-wide via Custom Code), **before** your GTM snippet:

```html
<script src="https://your-cdn.com/cookie-consent.min.js"></script>
```

That's it. The script auto-initialises with sensible defaults.

If you need to override config for a specific site (e.g. custom domain or version bump), add this **before** the script tag:

```html
<script>window.__CC_CONFIG__ = { consentVersion: '2', cookieDomain: '.example.com' };</script>
<script src="https://your-cdn.com/cookie-consent.min.js"></script>
```

### 2. Add the banner HTML

Paste this into a site-wide **Embed** element (or in the Before `</body>` tag custom code). Style it however you like — the library reads `data-cc` attributes, not class names.

```html
<div data-cc="banner">

  <!-- Notice (initial view) -->
  <div data-cc="notice">
    <p>We use cookies to enhance your experience. You can choose which cookies to allow.</p>
    <div>
      <button data-cc-action="accept-all">Accept All</button>
      <button data-cc-action="reject-all">Reject All</button>
      <button data-cc-action="show-preferences">Customize</button>
    </div>
  </div>

  <!-- Preferences panel -->
  <div data-cc="preferences-panel">
    <div>
      <label><input type="checkbox" checked disabled /> Necessary</label>
      <p>Essential for the website to function. Always enabled.</p>
    </div>
    <div>
      <label><input type="checkbox" data-cc-toggle="functional" /> Functional</label>
      <p>Enable enhanced functionality and personalisation.</p>
    </div>
    <div>
      <label><input type="checkbox" data-cc-toggle="analytics" /> Analytics</label>
      <p>Help us understand how visitors interact with our website.</p>
    </div>
    <div>
      <label><input type="checkbox" data-cc-toggle="marketing" /> Marketing</label>
      <p>Used to deliver relevant ads and track campaigns.</p>
    </div>
    <div>
      <button data-cc-action="save-preferences">Save Preferences</button>
      <button data-cc-action="reject-all">Reject All</button>
    </div>
  </div>

</div>
```

### 3. "Manage cookies" link

Place this button anywhere on your site (e.g. the footer). It re-opens the banner with preferences pre-populated:

```html
<button data-cc-action="manage">Manage Cookie Settings</button>
```

### Data attributes reference

| Attribute | Element | Purpose |
|---|---|---|
| `data-cc="banner"` | Wrapper `div` | The banner container (animated in/out) |
| `data-cc="notice"` | Inner `div` | The initial notice view |
| `data-cc="preferences-panel"` | Inner `div` | The expandable preferences panel |
| `data-cc-action="accept-all"` | `button` | Accept all categories |
| `data-cc-action="reject-all"` | `button` | Reject all optional categories |
| `data-cc-action="show-preferences"` | `button` | Open the preferences panel |
| `data-cc-action="save-preferences"` | `button` | Save current toggle selections |
| `data-cc-action="manage"` | `button` | Re-open the banner (for footer links) |
| `data-cc-action="close"` | `button` | Hide the banner |
| `data-cc-toggle="functional"` | `input[checkbox]` | Toggle for functional cookies |
| `data-cc-toggle="analytics"` | `input[checkbox]` | Toggle for analytics cookies |
| `data-cc-toggle="marketing"` | `input[checkbox]` | Toggle for marketing cookies |

### Injected CSS

The script automatically injects a `<style data-cc-styles>` tag with minimal animation rules:

- `[data-cc="banner"]` — fixed position, fade + slide-up transition
- `.cc-visible` / `.cc-hidden` — toggled by the library to show/hide elements
- `[data-cc="preferences-panel"]` — max-height transition for smooth expand/collapse

All visual styling (colors, fonts, spacing, etc.) is up to you.

---

## Next.js

### 1. Install

```bash
npm install @addmore/cookie-consent
```

### 2. Create a providers component

Since the consent provider uses browser APIs, it needs the `"use client"` directive:

```tsx
// app/providers.tsx
"use client";

import { CookieConsentProvider, CookieConsent } from '@addmore/cookie-consent/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider config={{ consentVersion: '1' }}>
      {children}
      <CookieConsent
        className="your-banner-class"
        labels={{
          title: 'We care about your privacy',
          description: 'We use cookies to improve your experience.',
          acceptAll: 'Accept All',
          rejectAll: 'Decline',
          customize: 'Manage Preferences',
        }}
      />
    </CookieConsentProvider>
  );
}
```

### 3. Use in your layout

```tsx
// app/layout.tsx
import Script from 'next/script';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>

        {/* GTM — loads after consent defaults are set by the provider */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-XXXXXXX');`,
          }}
        />
      </body>
    </html>
  );
}
```

### 4. Read consent anywhere

```tsx
"use client";

import { useCookieConsent } from '@addmore/cookie-consent/react';

export function AnalyticsNotice() {
  const { consent, hasConsent, showPreferences } = useCookieConsent();

  return (
    <div>
      {hasConsent && <p>Analytics: {consent?.categories.analytics ? 'on' : 'off'}</p>}
      <button onClick={showPreferences}>Manage Cookie Settings</button>
    </div>
  );
}
```

### Customizable labels

The `<CookieConsent>` component accepts a `labels` prop to override all text. Defaults are English:

```ts
{
  title: 'We value your privacy',
  description: 'We use cookies to enhance your browsing experience...',
  acceptAll: 'Accept All',
  rejectAll: 'Reject All',
  customize: 'Customize',
  savePreferences: 'Save Preferences',
  backToNotice: 'Back',
  functional: 'Functional',
  functionalDescription: 'Enable enhanced functionality and personalisation.',
  analytics: 'Analytics',
  analyticsDescription: 'Help us understand how visitors interact with our website.',
  marketing: 'Marketing',
  marketingDescription: 'Used to deliver relevant ads and track campaigns.',
  necessary: 'Necessary',
  necessaryDescription: 'Essential for the website to function. Always enabled.',
}
```

The React component renders unstyled structural markup — bring your own CSS or Tailwind classes via the `className` prop.

---

## Configuration

Pass these options to `init()` (Webflow) or the `config` prop on `CookieConsentProvider` (Next.js):

| Option | Type | Default | Description |
|---|---|---|---|
| `cookieName` | `string` | `'cc_consent'` | Name of the consent cookie |
| `cookieDomain` | `string` | `''` | Cookie domain (e.g. `'.example.com'` for subdomains) |
| `cookieExpiry` | `number` | `365` | Cookie lifetime in days |
| `consentVersion` | `string` | `'1'` | Bump this to re-prompt all visitors |

## JavaScript API

Available on `window.CookieConsent` (Webflow) or via `useCookieConsent()` (React):

| Method | Description |
|---|---|
| `init(config)` | Initialize — must be called before GTM loads |
| `acceptAll()` | Grant all categories |
| `rejectAll()` | Deny all optional categories |
| `updateConsent(categories)` | Set specific categories (e.g. `{ analytics: true }`) |
| `getConsent()` | Get current consent state |
| `hasValidConsent()` | Check if consent cookie exists and version matches |
| `resetConsent()` | Delete cookie and re-show the banner |
| `showBanner()` | Show the notice view |
| `showPreferences()` | Show the preferences panel |
| `hideUI()` | Hide the banner |
| `openManage()` | Re-open with preferences (same as manage link) |
| `onConsentChange(cb)` | Subscribe to changes — returns an unsubscribe function |

## GDPR/ePrivacy compliance

- No tracking fires before consent — all consent types default to `denied`
- Genuine choice — Accept All, Reject All, and per-category toggles
- Easy withdrawal — "Manage" link re-opens the banner with current selections
- Consent is timestamped and versioned
- GPC (`navigator.globalPrivacyControl`) is respected as an opt-out signal
- `security_storage` (necessary cookies) cannot be toggled off
- First-party cookie only, `SameSite=Lax`
- The page is never blocked — `aria-modal="false"`

## Development

```bash
npm install
npm run build      # builds all 3 bundles + type declarations
npm run size       # reports IIFE gzipped size
```

Output:
- `dist/cookie-consent.min.js` — IIFE for Webflow
- `dist/cookie-consent.esm.js` — ESM core for bundlers
- `dist/react/index.js` — ESM React components
- `dist/**/*.d.ts` — TypeScript declarations
