import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { useCookieConsent } from './CookieConsentContext';
import type { ConsentCategory } from '../core';

// ---------------------------------------------------------------------------
// Default labels
// ---------------------------------------------------------------------------

export interface CookieConsentLabels {
  title?: string;
  description?: string;
  acceptAll?: string;
  rejectAll?: string;
  customize?: string;
  savePreferences?: string;
  backToNotice?: string;
  functional?: string;
  functionalDescription?: string;
  analytics?: string;
  analyticsDescription?: string;
  marketing?: string;
  marketingDescription?: string;
  necessary?: string;
  necessaryDescription?: string;
}

const DEFAULT_LABELS: Required<CookieConsentLabels> = {
  title: 'We value your privacy',
  description:
    'We use cookies to enhance your browsing experience, serve personalised content, and analyse our traffic. You can choose which cookies to allow.',
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
};

// ---------------------------------------------------------------------------
// Styles (structural only)
// ---------------------------------------------------------------------------

const bannerStyle: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 999999,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CookieConsentProps {
  labels?: CookieConsentLabels;
  className?: string;
}

type ToggleableCategory = 'functional' | 'analytics' | 'marketing';

export function CookieConsent({ labels: userLabels, className }: CookieConsentProps) {
  const labels = { ...DEFAULT_LABELS, ...userLabels };
  const {
    consent,
    uiState,
    acceptAll,
    rejectAll,
    updateConsent,
    showPreferences,
    showBanner,
    hideUI,
  } = useCookieConsent();

  const [toggles, setToggles] = useState<Record<ToggleableCategory, boolean>>({
    functional: false,
    analytics: false,
    marketing: false,
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Sync toggles when opening preferences
  useEffect(() => {
    if (uiState === 'preferences') {
      setToggles({
        functional: consent?.categories.functional ?? false,
        analytics: consent?.categories.analytics ?? false,
        marketing: consent?.categories.marketing ?? false,
      });
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
    if (uiState === 'hidden' && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [uiState, consent]);

  // Focus trap in preferences panel
  useEffect(() => {
    if (uiState !== 'preferences' || !panelRef.current) return;

    const panel = panelRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        showBanner();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = panel.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    panel.addEventListener('keydown', handleKeydown);
    // Focus first focusable element
    const firstEl = panel.querySelector<HTMLElement>(focusableSelector);
    firstEl?.focus();

    return () => panel.removeEventListener('keydown', handleKeydown);
  }, [uiState, showBanner]);

  const handleToggle = useCallback((cat: ToggleableCategory) => {
    setToggles((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const handleSave = useCallback(() => {
    updateConsent(toggles as Partial<Record<ConsentCategory, boolean>>);
  }, [toggles, updateConsent]);

  if (uiState === 'hidden') return null;

  const showNotice = uiState === 'banner';
  const showPrefs = uiState === 'preferences';

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      style={bannerStyle}
      className={className}
    >
      {/* Notice */}
      {showNotice && (
        <div data-cc="notice">
          <p><strong>{labels.title}</strong></p>
          <p>{labels.description}</p>
          <div>
            <button type="button" onClick={acceptAll}>{labels.acceptAll}</button>
            <button type="button" onClick={rejectAll}>{labels.rejectAll}</button>
            <button type="button" onClick={showPreferences}>{labels.customize}</button>
          </div>
        </div>
      )}

      {/* Preferences */}
      {showPrefs && (
        <div data-cc="preferences-panel" ref={panelRef}>
          <button type="button" onClick={showBanner}>{labels.backToNotice}</button>

          {/* Necessary — always on */}
          <div>
            <label>
              <input type="checkbox" checked disabled />
              <strong>{labels.necessary}</strong>
            </label>
            <p>{labels.necessaryDescription}</p>
          </div>

          {/* Toggleable categories */}
          {((['functional', 'analytics', 'marketing'] as const).map((cat) => (
            <div key={cat}>
              <label>
                <input
                  type="checkbox"
                  checked={toggles[cat]}
                  onChange={() => handleToggle(cat)}
                />
                <strong>{labels[cat]}</strong>
              </label>
              <p>{labels[`${cat}Description`]}</p>
            </div>
          )))}

          <div>
            <button type="button" onClick={handleSave}>{labels.savePreferences}</button>
            <button type="button" onClick={rejectAll}>{labels.rejectAll}</button>
          </div>
        </div>
      )}
    </div>
  );
}
