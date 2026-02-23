# Cookie Consent Script — Build Spec

## Project Overview

Build a lightweight, GDPR/ePrivacy-compliant cookie consent library that integrates with Google Consent Mode v2 and Google Tag Manager. The library must work in two environments:

1. **Webflow** — the script is loaded via `<script>` tag in custom code, and the banner HTML is built manually in Webflow using data attributes.
2. **Next.js / React** — the core logic is imported as a module, and the banner is a React component.

The library is used by a B2B product marketing / design studio across all client websites. It must be reusable, configurable per site, and simple to integrate.

**Hosting:** GitHub repo, served via jsDelivr CDN for Webflow. Imported as a package for Next.js.

---

## Consent Categories & Google Consent Mode v2 Mapping

These are the four user-facing categories and their corresponding Google Consent Mode v2 types:

| Banner Category | Consent Mode v2 Types                              | User Can Toggle?                |
| --------------- | -------------------------------------------------- | ------------------------------- |
| Necessary       | `security_storage`                                 | No — always on, toggle disabled |
| Functional      | `functionality_storage`, `personalization_storage` | Yes                             |
| Analytics       | `analytics_storage`                                | Yes                             |
| Marketing       | `ad_storage`, `ad_user_data`, `ad_personalization` | Yes                             |

---

## Architecture

### File Structure

```
cookie-consent/
├── src/
│   ├── core.js            # Consent state machine, cookie r/w, GTM integration
│   ├── dom-adapter.js     # Webflow/vanilla HTML adapter (reads data attributes)
│   ├── index.js           # Main entry point, exports init() for Webflow
│   └── react/
│       └── CookieConsent.jsx  # React component wrapping core.js
├── dist/
│   ├── cookie-consent.min.js       # IIFE bundle for Webflow (CDN)
│   └── cookie-consent.esm.js       # ESM bundle for Next.js
├── examples/
│   ├── webflow-embed.html           # Copy-paste Webflow integration example
│   └── nextjs-example.jsx           # Next.js integration example
├── README.md
└── package.json
```

### Core Logic (`core.js`)

This is the shared brain. It has zero DOM dependencies. It exposes:

- `init(config)` — initializes consent defaults, checks stored consent, returns current state
- `getConsent()` — returns current consent state object
- `updateConsent(categories)` — saves consent, updates Consent Mode, fires dataLayer event
- `resetConsent()` — clears stored consent (for "manage cookies" re-open flow)
- `hasValidConsent()` — checks if stored consent exists and version matches
- `onConsentChange(callback)` — register a listener for consent state changes

#### Config Object

```js
{
  // Consent cookie settings
  cookieName: 'cookie_consent',        // Name of the first-party consent cookie
  cookieDuration: 182,                 // Days (6 months default)
  consentVersion: '1.0',               // Bump to re-trigger banner for returning visitors

  // Google Consent Mode
  waitForUpdate: 500,                  // ms to wait for consent before GTM fires defaults
  advancedMode: false,                 // Enable cookieless pings when consent denied
  adsDataRedaction: true,              // Redact ad click identifiers when ad_storage denied
  urlPassthrough: false,               // Pass ad click info through URLs when ad_storage denied

  // Default consent state (all denied except necessary)
  defaults: {
    necessary: true,      // Always true, cannot be changed
    functional: false,
    analytics: false,
    marketing: false,
  },

  // DOM selectors (Webflow adapter only — React component handles its own)
  selectors: {
    banner: '[data-cc="banner"]',
    acceptAll: '[data-cc="accept-all"]',
    rejectAll: '[data-cc="reject-all"]',
    savePreferences: '[data-cc="save-preferences"]',
    openPreferences: '[data-cc="open-preferences"]',
    closePreferences: '[data-cc="close-preferences"]',
    preferencesPanel: '[data-cc="preferences-panel"]',
    toggleFunctional: '[data-cc="toggle-functional"]',
    toggleAnalytics: '[data-cc="toggle-analytics"]',
    toggleMarketing: '[data-cc="toggle-marketing"]',
    manageCookies: '[data-cc="manage-cookies"]',  // Footer link to re-open banner
  }
}
```

---

## Consent Flow (Step by Step)

### First Visit

1. Script loads **before** the GTM snippet.
2. `core.init(config)` runs immediately:
   - Pushes `gtag('consent', 'default', {...})` with ALL consent types set to `'denied'` (except `security_storage: 'granted'`).
   - Sets `wait_for_update` to give the banner time to render.
   - If `advancedMode` is true, also sets `ads_data_redaction` and `url_passthrough`.
3. Checks `navigator.globalPrivacyControl`. If GPC is `true`:
   - Store consent as all-denied.
   - Do NOT show banner.
   - Fire `consent_update` dataLayer event with `gpc: true`.
   - Done.
4. Checks for existing consent cookie:
   - Not found → show the banner (trigger the show animation).
5. GTM snippet loads after this script. Because defaults are "denied," no tracking tags fire.

### User Interacts with Banner

**Accept All:**

- Sets all categories to `true`.
- Calls `core.updateConsent({ functional: true, analytics: true, marketing: true })`.
- Core maps categories to Consent Mode types and pushes `gtag('consent', 'update', {...})`.
- Saves consent cookie with: `{ categories: {...}, consentVersion: '1.0', timestamp: ISO string }`.
- Fires `dataLayer.push({ event: 'consent_update', consent_categories: {...}, consent_action: 'accept_all' })`.
- Banner hides (trigger hide animation).

**Reject All:**

- Same flow but all toggleable categories set to `false`.
- `consent_action: 'reject_all'` in dataLayer event.

**Save Preferences:**

- Reads toggle states for functional, analytics, marketing.
- Same flow as above with the specific selection.
- `consent_action: 'save_preferences'` in dataLayer event.

### Returning Visit (Consent Exists)

1. Script loads, sets Consent Mode defaults to denied.
2. Reads consent cookie.
3. Checks `consentVersion` matches config. If outdated → treat as no consent, show banner.
4. If valid → immediately pushes `gtag('consent', 'update', {...})` with stored choices.
5. Banner stays hidden.
6. GTM loads and tags fire according to granted consent types.

### "Manage Cookies" (Re-open)

- A link/button in the site footer (or anywhere) with `data-cc="manage-cookies"`.
- Clicking it opens the banner with the preferences panel visible.
- Toggle states are pre-populated with the user's current choices.
- User can change and save, which overwrites the consent cookie and updates Consent Mode.

---

## HTML Structure & Data Attributes (Webflow)

This is the exact HTML structure to build in Webflow. Every interactive element uses a `data-cc` attribute. The script finds elements by these attributes — class names and styling are completely free.

**IMPORTANT FOR WEBFLOW:** The banner should be built as a fixed/sticky component. Set it to `display: none` by default (or `opacity: 0` with a Webflow interaction). The script manages visibility by adding/removing a `data-cc-visible="true"` attribute on the banner wrapper. You bind your Webflow show/hide animation to this attribute, OR the script can toggle a class.

```html
<!-- ============================================ -->
<!-- COOKIE BANNER — fixed position, bottom of page -->
<!-- Set to display:none or opacity:0 by default in Webflow -->
<!-- ============================================ -->
<div data-cc="banner" class="cc-banner">
  <!-- ===== INITIAL VIEW (simple accept/reject) ===== -->
  <div data-cc="notice" class="cc-notice">
    <div class="cc-notice-content">
      <p class="cc-notice-text">
        We use cookies to improve your experience. You can customize your
        preferences or accept all cookies.
      </p>
      <div class="cc-notice-actions">
        <button data-cc="reject-all" class="cc-btn cc-btn-secondary">
          Reject All
        </button>
        <button data-cc="open-preferences" class="cc-btn cc-btn-secondary">
          Manage Preferences
        </button>
        <button data-cc="accept-all" class="cc-btn cc-btn-primary">
          Accept All
        </button>
      </div>
    </div>
  </div>

  <!-- ===== PREFERENCES PANEL (toggled open/closed) ===== -->
  <!-- Hidden by default. Shown when "Manage Preferences" is clicked. -->
  <div
    data-cc="preferences-panel"
    class="cc-preferences"
    style="display: none;"
  >
    <div class="cc-preferences-header">
      <h3>Cookie Preferences</h3>
      <button data-cc="close-preferences" class="cc-close-btn">✕</button>
    </div>

    <div class="cc-preferences-body">
      <!-- Necessary — always on, no toggle -->
      <div class="cc-category">
        <div class="cc-category-header">
          <span class="cc-category-title">Necessary</span>
          <span class="cc-category-badge">Always Active</span>
        </div>
        <p class="cc-category-description">
          Essential cookies required for the website to function. These cannot
          be disabled.
        </p>
      </div>

      <!-- Functional -->
      <div class="cc-category">
        <div class="cc-category-header">
          <label class="cc-category-title" for="cc-functional"
            >Functional</label
          >
          <!-- 
            The toggle is a native checkbox input. 
            Style it however you want in Webflow (custom toggle, switch, etc.)
            The data-cc attribute is what matters, not the visual style.
          -->
          <input
            type="checkbox"
            id="cc-functional"
            data-cc="toggle-functional"
            class="cc-toggle"
          />
        </div>
        <p class="cc-category-description">
          Enable enhanced functionality and personalization features.
        </p>
      </div>

      <!-- Analytics -->
      <div class="cc-category">
        <div class="cc-category-header">
          <label class="cc-category-title" for="cc-analytics">Analytics</label>
          <input
            type="checkbox"
            id="cc-analytics"
            data-cc="toggle-analytics"
            class="cc-toggle"
          />
        </div>
        <p class="cc-category-description">
          Help us understand how visitors interact with the website.
        </p>
      </div>

      <!-- Marketing -->
      <div class="cc-category">
        <div class="cc-category-header">
          <label class="cc-category-title" for="cc-marketing">Marketing</label>
          <input
            type="checkbox"
            id="cc-marketing"
            data-cc="toggle-marketing"
            class="cc-toggle"
          />
        </div>
        <p class="cc-category-description">
          Used to deliver relevant ads and track campaign performance.
        </p>
      </div>
    </div>

    <div class="cc-preferences-footer">
      <button data-cc="reject-all" class="cc-btn cc-btn-secondary">
        Reject All
      </button>
      <button data-cc="save-preferences" class="cc-btn cc-btn-primary">
        Save Preferences
      </button>
    </div>
  </div>
</div>

<!-- ============================================ -->
<!-- MANAGE COOKIES LINK — place in site footer -->
<!-- ============================================ -->
<button data-cc="manage-cookies" class="cc-manage-link">
  Manage Cookie Settings
</button>
```

### Data Attribute Reference

| Attribute                     | Element        | Purpose                                                                      |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `data-cc="banner"`            | Wrapper div    | The entire banner container. Script toggles visibility on this.              |
| `data-cc="notice"`            | Div            | The initial simple notice view (text + accept/reject/manage buttons).        |
| `data-cc="preferences-panel"` | Div            | The detailed preferences panel with category toggles. Hidden by default.     |
| `data-cc="accept-all"`        | Button         | Grants all consent categories. Can appear in both notice and preferences.    |
| `data-cc="reject-all"`        | Button         | Denies all toggleable categories. Can appear in both notice and preferences. |
| `data-cc="open-preferences"`  | Button         | Shows the preferences panel (hides the simple notice).                       |
| `data-cc="close-preferences"` | Button         | Closes preferences panel, returns to simple notice.                          |
| `data-cc="save-preferences"`  | Button         | Saves the current toggle states as the user's consent choice.                |
| `data-cc="toggle-functional"` | Checkbox input | Toggle for functional cookies category.                                      |
| `data-cc="toggle-analytics"`  | Checkbox input | Toggle for analytics cookies category.                                       |
| `data-cc="toggle-marketing"`  | Checkbox input | Toggle for marketing cookies category.                                       |
| `data-cc="manage-cookies"`    | Button/link    | Re-opens the banner with preferences panel. Place anywhere (usually footer). |

### Animation / Visibility Behavior

The script controls visibility through **two mechanisms** (configurable):

**Option A — Class-based (recommended for Webflow):**

- Script adds/removes a CSS class (default: `cc-visible`) on the banner wrapper.
- In Webflow, you set up the banner with `opacity: 0`, `pointer-events: none`, `transform: translateY(20px)` by default.
- Then use a CSS transition on the banner that activates when the class is present:
  ```css
  [data-cc="banner"] {
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px);
    transition:
      opacity 0.35s ease,
      transform 0.35s ease;
  }
  [data-cc="banner"].cc-visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  ```
- In Webflow you can add this to the site-wide custom CSS, or replicate the same behavior with Webflow's native transitions on a combo class.

**Option B — Attribute-based:**

- Script sets `data-cc-visible="true"` / `data-cc-visible="false"` on the banner.
- Style with `[data-cc="banner"][data-cc-visible="true"] { ... }`.

**Config option:**

```js
{
  animation: {
    method: 'class',           // 'class' or 'attribute'
    showClass: 'cc-visible',   // class to add when showing
    showDelay: 500,            // ms delay before showing on page load (let page render first)
    hideDelay: 350,            // ms delay after hiding (match CSS transition duration so element hides after animation)
  }
}
```

**Preferences panel toggle:**

- When "Manage Preferences" is clicked, the script hides `[data-cc="notice"]` and shows `[data-cc="preferences-panel"]`.
- When close is clicked, it reverses.
- Use the same class/attribute approach or simple display toggling.

---

## React Component (`CookieConsent.jsx`)

For Next.js, provide a React component that wraps `core.js`. The component:

- Renders the same banner UI as JSX (no data attributes needed — it uses React state directly).
- Calls `core.init()` on mount.
- Manages show/hide state, preferences panel toggle, and toggle states via React state.
- Uses `framer-motion` for animations (optional, graceful fallback to CSS transitions if not installed).
- Accepts all config options as props.
- Exposes a `useCookieConsent()` hook that returns the current consent state + `openBanner()` function for the "Manage Cookies" footer link.

```jsx
// Example Next.js usage
import {
  CookieConsent,
  CookieConsentProvider,
  useCookieConsent,
} from "@studio/cookie-consent/react";

// In layout.jsx:
<CookieConsentProvider config={{ consentVersion: "1.0", advancedMode: false }}>
  <App />
  <CookieConsent />
</CookieConsentProvider>;

// In footer.jsx:
function Footer() {
  const { openBanner } = useCookieConsent();
  return <button onClick={openBanner}>Manage Cookie Settings</button>;
}
```

**IMPORTANT:** The React component should NOT include any styling beyond structural CSS (display, position). All visual styling is done by the consuming project. The component accepts a `className` prop for the wrapper and exposes slot-based or render-prop customization for advanced cases.

---

## Script Loading Order (Critical)

### Webflow

In the **site-wide `<head>` custom code** section, in this exact order:

```html
<!-- 1. Cookie Consent Script (MUST be first) -->
<script src="https://cdn.jsdelivr.net/gh/your-org/cookie-consent@1.0.0/dist/cookie-consent.min.js"></script>
<script>
  CookieConsent.init({
    consentVersion: "1.0",
    cookieDuration: 182,
    advancedMode: false,
    animation: {
      method: "class",
      showClass: "cc-visible",
      showDelay: 500,
      hideDelay: 350,
    },
  });
</script>

<!-- 2. Google Tag Manager (loads AFTER consent defaults are set) -->
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-XXXXXXX");
</script>
```

### Next.js

```jsx
// In app/layout.jsx or _app.jsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Consent defaults are set by CookieConsentProvider on mount, before GTM */}
      </head>
      <body>
        <CookieConsentProvider config={{...}}>
          {children}
          <CookieConsent />
        </CookieConsentProvider>

        {/* GTM loads after consent provider has set defaults */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');`
          }}
        />
      </body>
    </html>
  );
}
```

---

## Cookie Format

The consent cookie stored on the user's browser:

```json
{
  "categories": {
    "necessary": true,
    "functional": false,
    "analytics": true,
    "marketing": false
  },
  "consentVersion": "1.0",
  "timestamp": "2026-02-23T14:30:00.000Z",
  "gpc": false
}
```

- Cookie name: configurable (default `cookie_consent`)
- Cookie duration: configurable (default 182 days)
- Cookie path: `/`
- Cookie SameSite: `Lax`
- Cookie Secure: `true` (only on HTTPS, which all production sites should be)

---

## DataLayer Events

When consent is saved or updated, push this to the dataLayer:

```js
window.dataLayer.push({
  event: "consent_update",
  consent_action:
    "accept_all" |
    "reject_all" |
    "save_preferences" |
    "gpc_signal" |
    "returning_visitor",
  consent_categories: {
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false,
  },
  consent_version: "1.0",
  consent_timestamp: "2026-02-23T14:30:00.000Z",
});
```

This allows the growth team to pick up consent events in GTM and forward them wherever needed.

---

## GPC (Global Privacy Control)

On init, check `navigator.globalPrivacyControl`:

- If `true`: treat as "reject all," store consent with `gpc: true`, do not show banner.
- Fire the dataLayer event with `consent_action: 'gpc_signal'`.
- If the user later explicitly opens "Manage Cookies" and accepts, their explicit choice overrides GPC.

---

## Compliance Checklist (for the script to satisfy)

- [ ] No tracking fires before explicit consent (Consent Mode defaults to denied)
- [ ] `security_storage` is always granted (necessary cookies)
- [ ] Users have a genuine choice: Accept All, Reject All, or granular per-category
- [ ] Users can withdraw/change consent at any time via "Manage Cookie Settings"
- [ ] Consent is stored with a timestamp
- [ ] Consent version mismatch triggers re-consent
- [ ] GPC signal is respected
- [ ] Banner does not block page access (must be dismissible / page is usable behind it)
- [ ] Banner is keyboard navigable and has proper ARIA attributes
- [ ] Consent update events are fired to the dataLayer for record keeping
- [ ] Cookie is first-party, SameSite=Lax, Secure
- [ ] Script loads and sets defaults before GTM snippet

---

## Accessibility Requirements

- Banner wrapper: `role="dialog"`, `aria-label="Cookie consent"`, `aria-modal="false"` (page is still usable)
- When banner appears: move focus to the banner
- Buttons: proper `aria-label` if text alone is ambiguous
- Toggles: proper `<label>` associations (use `for` attribute)
- Keyboard: all interactive elements reachable via Tab, activatable via Enter/Space
- Trap focus within preferences panel when it's open (but NOT in the simple notice view — that would block page access)
- On close/dismiss: return focus to the element that triggered the open

---

## Build & Bundle

- Use `esbuild` or `rollup` for bundling.
- Output two formats:
  - `dist/cookie-consent.min.js` — IIFE bundle, exposes `window.CookieConsent`. For Webflow.
  - `dist/cookie-consent.esm.js` — ESM bundle with named exports. For Next.js / npm.
- Target: ES2020 (covers all modern browsers).
- No dependencies in the core. The React component has a peer dependency on React 18+.
- Total bundle size target: < 5KB gzipped for the core IIFE.

---

## Summary

The key design principles:

1. **Core logic is framework-agnostic.** Zero DOM dependencies. Talks only to `window.dataLayer` and `document.cookie`.
2. **DOM adapter for Webflow** reads `data-cc` attributes and wires up event listeners. This is the thin glue layer.
3. **React component for Next.js** wraps core logic in a proper React component with hooks.
4. **All styling is external.** The script never injects CSS. The banner looks however you design it in Webflow or your React component.
5. **Config-driven.** One config object per site. Sensible defaults for everything.
