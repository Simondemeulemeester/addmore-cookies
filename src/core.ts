/// <reference path="./global.d.ts" />

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export type ConsentAction = 'accept_all' | 'reject_all' | 'custom' | 'gpc';

export interface ConsentConfig {
  cookieName?: string;
  cookieDomain?: string;
  cookieExpiry?: number; // days
  consentVersion?: string;
  gtmId?: string;
}

export interface ConsentState {
  categories: Record<ConsentCategory, boolean>;
  consentVersion: string;
  timestamp: string;
  gpc: boolean;
}

export type UIState = 'hidden' | 'banner' | 'preferences';

export type ConsentChangeCallback = (state: ConsentState, action: ConsentAction) => void;
export type UIChangeCallback = (uiState: UIState) => void;

// ---------------------------------------------------------------------------
// Category → Consent Mode v2 mapping
// ---------------------------------------------------------------------------

const CATEGORY_CONSENT_MAP: Record<ConsentCategory, string[]> = {
  necessary: ['security_storage'],
  functional: ['functionality_storage', 'personalization_storage'],
  analytics: ['analytics_storage'],
  marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Required<ConsentConfig> = {
  cookieName: 'cc_consent',
  cookieDomain: '',
  cookieExpiry: 365,
  consentVersion: '1',
  gtmId: '',
};

const DEFAULT_CATEGORIES: Record<ConsentCategory, boolean> = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let config: Required<ConsentConfig> = { ...DEFAULT_CONFIG };
let state: ConsentState | null = null;
let uiState: UIState = 'hidden';
const consentListeners: Set<ConsentChangeCallback> = new Set();
const uiListeners: Set<UIChangeCallback> = new Set();
let initialized = false;

// ---------------------------------------------------------------------------
// SSR guard
// ---------------------------------------------------------------------------

const isBrowser = typeof window !== 'undefined';

// ---------------------------------------------------------------------------
// gtag helper
// ---------------------------------------------------------------------------

function ensureGtag() {
  if (!isBrowser) return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments as unknown as Record<string, unknown>);
    };
  }
}

function pushConsentDefault(categories: Record<ConsentCategory, boolean>) {
  ensureGtag();
  const consentParams: Record<string, string> = {};
  for (const [cat, types] of Object.entries(CATEGORY_CONSENT_MAP)) {
    const granted = categories[cat as ConsentCategory];
    for (const t of types) {
      consentParams[t] = granted ? 'granted' : 'denied';
    }
  }
  window.gtag('consent', 'default', consentParams);
}

function pushConsentUpdate(categories: Record<ConsentCategory, boolean>, action: ConsentAction) {
  ensureGtag();
  const consentParams: Record<string, string> = {};
  for (const [cat, types] of Object.entries(CATEGORY_CONSENT_MAP)) {
    const granted = categories[cat as ConsentCategory];
    for (const t of types) {
      consentParams[t] = granted ? 'granted' : 'denied';
    }
  }
  window.gtag('consent', 'update', consentParams);

  window.dataLayer.push({
    event: 'consent_update',
    consent_action: action,
    consent_categories: { ...categories },
  });
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function readCookie(): ConsentState | null {
  if (!isBrowser) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${config.cookieName}=([^;]*)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as ConsentState;
  } catch {
    return null;
  }
}

function writeCookie(value: ConsentState) {
  if (!isBrowser) return;
  const encoded = encodeURIComponent(JSON.stringify(value));
  const parts = [
    `${config.cookieName}=${encoded}`,
    `path=/`,
    `max-age=${config.cookieExpiry * 86400}`,
    `SameSite=Lax`,
  ];
  if (config.cookieDomain) parts.push(`domain=${config.cookieDomain}`);
  if (location.protocol === 'https:') parts.push('Secure');
  document.cookie = parts.join('; ');
}

function deleteCookie() {
  if (!isBrowser) return;
  const parts = [`${config.cookieName}=`, 'path=/', 'max-age=0', 'SameSite=Lax'];
  if (config.cookieDomain) parts.push(`domain=${config.cookieDomain}`);
  document.cookie = parts.join('; ');
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

function notifyConsentChange(action: ConsentAction) {
  if (!state) return;
  for (const cb of consentListeners) {
    try { cb(state, action); } catch { /* consumer error */ }
  }
}

function notifyUIChange() {
  for (const cb of uiListeners) {
    try { cb(uiState); } catch { /* consumer error */ }
  }
}

function setUIState(next: UIState) {
  if (uiState === next) return;
  uiState = next;
  notifyUIChange();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(userConfig: ConsentConfig = {}): ConsentState | null {
  if (!isBrowser) return null;

  config = { ...DEFAULT_CONFIG, ...userConfig };
  ensureGtag();

  // Check GPC
  const gpc = !!navigator.globalPrivacyControl;

  // Read existing cookie
  const existing = readCookie();

  if (gpc && !existing) {
    // GPC: treat as reject-all, persist it
    const categories = { ...DEFAULT_CATEGORIES, necessary: true };
    state = {
      categories,
      consentVersion: config.consentVersion,
      timestamp: new Date().toISOString(),
      gpc: true,
    };
    pushConsentDefault(categories);
    writeCookie(state);
    initialized = true;
    setUIState('hidden');
    return state;
  }

  if (existing && existing.consentVersion === config.consentVersion) {
    // Valid existing consent
    state = existing;
    pushConsentDefault(existing.categories);
    initialized = true;
    setUIState('hidden');
    return state;
  }

  // No valid consent — set all denied, show banner
  const denied = { ...DEFAULT_CATEGORIES };
  pushConsentDefault(denied);
  state = null;
  initialized = true;
  setUIState('banner');
  return null;
}

export function getConsent(): ConsentState | null {
  return state ? { ...state, categories: { ...state.categories } } : null;
}

export function getConfig(): Required<ConsentConfig> {
  return { ...config };
}

export function getUIState(): UIState {
  return uiState;
}

export function hasValidConsent(): boolean {
  if (!state) return false;
  return state.consentVersion === config.consentVersion;
}

export function updateConsent(
  categories: Partial<Record<ConsentCategory, boolean>>,
  action: ConsentAction = 'custom',
): ConsentState {
  if (!isBrowser) throw new Error('updateConsent requires a browser environment');

  const merged: Record<ConsentCategory, boolean> = {
    necessary: true, // always granted
    functional: categories.functional ?? false,
    analytics: categories.analytics ?? false,
    marketing: categories.marketing ?? false,
  };

  state = {
    categories: merged,
    consentVersion: config.consentVersion,
    timestamp: new Date().toISOString(),
    gpc: !!navigator.globalPrivacyControl,
  };

  writeCookie(state);
  pushConsentUpdate(merged, action);
  notifyConsentChange(action);
  setUIState('hidden');
  return { ...state, categories: { ...merged } };
}

export function acceptAll(): ConsentState {
  return updateConsent(
    { necessary: true, functional: true, analytics: true, marketing: true },
    'accept_all',
  );
}

export function rejectAll(): ConsentState {
  return updateConsent(
    { necessary: true, functional: false, analytics: false, marketing: false },
    'reject_all',
  );
}

export function resetConsent(): void {
  deleteCookie();
  state = null;
  if (isBrowser) {
    pushConsentDefault(DEFAULT_CATEGORIES);
  }
  setUIState('banner');
}

export function onConsentChange(callback: ConsentChangeCallback): () => void {
  consentListeners.add(callback);
  return () => { consentListeners.delete(callback); };
}

export function onUIChange(callback: UIChangeCallback): () => void {
  uiListeners.add(callback);
  return () => { uiListeners.delete(callback); };
}

// UI state mutators
export function showBanner(): void { setUIState('banner'); }
export function showPreferences(): void { setUIState('preferences'); }
export function hideUI(): void { setUIState('hidden'); }
export function openManage(): void { setUIState('preferences'); }
