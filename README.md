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

The IIFE bundle is fully self-contained — it auto-inits and injects minimal CSS for show/hide logic. You build the banner as native Webflow elements, style it however you want, and the library handles the rest via `data-cc` attributes.

### 1. Add the script

Add this in **Site Settings → Custom Code → Head Code**, **before** your GTM snippet:

```html
<script src="https://your-cdn.com/cookie-consent.min.js"></script>
```

That's it — one script tag, auto-initialises with sensible defaults.

To override config for a specific site (e.g. version bump or custom domain), add this **before** the script:

```html
<script>window.__CC_CONFIG__ = { consentVersion: '2', cookieDomain: '.example.com' };</script>
```

### 2. Build the banner as a Webflow Symbol

Create these elements in Webflow using the element panel (not an embed). Add custom attributes via the element settings gear icon. Wrap everything in a **Symbol** so it appears on every page.

#### Structure

```
div "cc-banner"                        → attr: data-cc="banner"
│
├── div "cc-notice"                    → attr: data-cc="notice"
│   ├── paragraph (your cookie message)
│   └── div "cc-buttons"
│       ├── button "Accept All"        → attr: data-cc-action="accept-all"
│       ├── button "Reject All"        → attr: data-cc-action="reject-all"
│       └── button "Customize"         → attr: data-cc-action="show-preferences"
│
└── div "cc-preferences"               → attr: data-cc="preferences-panel"
    ├── heading "Cookie preferences"
    ├── div "cc-category"
    │   ├── checkbox (checked + disabled)
    │   ├── text "Necessary"
    │   └── paragraph "Essential for the website to function."
    ├── div "cc-category"
    │   ├── checkbox                   → attr: data-cc-toggle="functional"
    │   ├── text "Functional"
    │   └── paragraph "Enhanced functionality and personalisation."
    ├── div "cc-category"
    │   ├── checkbox                   → attr: data-cc-toggle="analytics"
    │   ├── text "Analytics"
    │   └── paragraph "Helps us understand how visitors use the site."
    ├── div "cc-category"
    │   ├── checkbox                   → attr: data-cc-toggle="marketing"
    │   ├── text "Marketing"
    │   └── paragraph "Used for relevant ads and campaign tracking."
    └── div "cc-pref-actions"
        ├── button "Save Preferences"  → attr: data-cc-action="save-preferences"
        └── button "Reject All"        → attr: data-cc-action="reject-all"

div "cc-overlay"                       → attr: data-cc="overlay"
```

> The overlay is a **sibling** of the banner, not inside it. It sits behind the preferences modal.

#### Suggested Webflow styles

**`cc-banner`** (the notice card — bottom right):
- Position: Fixed
- Bottom: 24px, Right: 24px
- Max Width: 420px
- Z-Index: 999999

**`cc-notice`**: style freely (padding, background, border-radius, shadow, etc.)

**`cc-preferences`** (centered modal):
- Position: Fixed
- Top: 50%, Left: 50%
- Transform: translate(-50%, -50%)
- Max Width: 560px, Width: 90vw
- Max Height: 80vh, Overflow: Auto
- Z-Index: 999999
- Background, padding, border-radius, shadow — your design

**`cc-overlay`** (dim backdrop):
- Position: Fixed
- Top: 0, Right: 0, Bottom: 0, Left: 0
- Background: rgba(0, 0, 0, 0.5)
- Z-Index: 999998

**Checkboxes**: use Webflow's native checkbox element. No form wrapper needed — the library reads the checked state directly. Just make sure the custom attribute is on the `input` element itself.

### 3. "Manage cookies" link

Place a button or link anywhere (e.g. your footer Symbol):

```
button or link "Manage Cookie Settings"  → attr: data-cc-action="manage"
```

This re-opens the banner with the preferences panel and current selections pre-populated.

### How it works

The library injects a small `<style>` tag that handles show/hide logic only:

- `.cc-visible` — makes elements visible (added/removed automatically)
- `.cc-hidden` — hides elements (added/removed automatically)
- Fade transition on the banner wrapper

All visual styling (colors, fonts, spacing, layout) is entirely yours in Webflow. The library never touches your classes — it only toggles its own `cc-visible` / `cc-hidden` classes.

### Data attributes reference

| Attribute | Element | Purpose |
|---|---|---|
| `data-cc="banner"` | Wrapper div | The banner container (faded in/out) |
| `data-cc="notice"` | Inner div | The notice view (hidden when preferences open) |
| `data-cc="preferences-panel"` | Inner div | The preferences modal (shown/hidden) |
| `data-cc="overlay"` | Sibling div | Backdrop behind preferences (shown/hidden, click to close) |
| `data-cc-action="accept-all"` | Button | Accept all categories |
| `data-cc-action="reject-all"` | Button | Reject all optional categories |
| `data-cc-action="show-preferences"` | Button | Open the preferences panel |
| `data-cc-action="save-preferences"` | Button | Save current toggle selections |
| `data-cc-action="manage"` | Button/link | Re-open banner with preferences (for footer) |
| `data-cc-action="close"` | Button | Dismiss the banner |
| `data-cc-toggle="functional"` | Checkbox input | Toggle for functional cookies |
| `data-cc-toggle="analytics"` | Checkbox input | Toggle for analytics cookies |
| `data-cc-toggle="marketing"` | Checkbox input | Toggle for marketing cookies |

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
