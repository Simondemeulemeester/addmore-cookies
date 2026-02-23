import {
  type ConsentCategory,
  type UIState,
  getConsent,
  acceptAll,
  rejectAll,
  updateConsent,
  showBanner,
  showPreferences,
  hideUI,
  onUIChange,
  getUIState,
} from './core';

// ---------------------------------------------------------------------------
// DOM query helpers
// ---------------------------------------------------------------------------

function $<T extends HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

function $$<T extends HTMLElement>(sel: string): T[] {
  return Array.from(document.querySelectorAll<T>(sel));
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let cleanupFns: (() => void)[] = [];
let previousFocus: HTMLElement | null = null;

// ---------------------------------------------------------------------------
// Focus trap (preferences panel only)
// ---------------------------------------------------------------------------

function trapFocus(container: HTMLElement) {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeydown);
  first.focus();
  cleanupFns.push(() => container.removeEventListener('keydown', handleKeydown));
}

// ---------------------------------------------------------------------------
// Sync toggles from current consent
// ---------------------------------------------------------------------------

function syncToggles() {
  const consent = getConsent();
  const categories: ConsentCategory[] = ['functional', 'analytics', 'marketing'];

  for (const cat of categories) {
    const toggle = $<HTMLInputElement>(`[data-cc-toggle="${cat}"]`);
    if (toggle) {
      toggle.checked = consent?.categories[cat] ?? false;
    }
  }
}

// ---------------------------------------------------------------------------
// Read toggles → categories
// ---------------------------------------------------------------------------

function readToggles(): Partial<Record<ConsentCategory, boolean>> {
  const cats: Partial<Record<ConsentCategory, boolean>> = {};
  const toggleable: ConsentCategory[] = ['functional', 'analytics', 'marketing'];
  for (const cat of toggleable) {
    const toggle = $<HTMLInputElement>(`[data-cc-toggle="${cat}"]`);
    if (toggle) cats[cat] = toggle.checked;
  }
  return cats;
}

// ---------------------------------------------------------------------------
// UI state → DOM classes
// ---------------------------------------------------------------------------

function applyUIState(uiState: UIState) {
  const banner = $('[data-cc="banner"]');
  const notice = $('[data-cc="notice"]');
  const prefs = $('[data-cc="preferences-panel"]');

  if (!banner) return;

  switch (uiState) {
    case 'hidden':
      banner.classList.remove('cc-visible');
      if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }
      break;

    case 'banner':
      banner.classList.add('cc-visible');
      notice?.classList.remove('cc-hidden');
      prefs?.classList.remove('cc-visible');
      if (!previousFocus) previousFocus = document.activeElement as HTMLElement;
      // Focus the banner after transition
      setTimeout(() => {
        const firstBtn = banner.querySelector<HTMLElement>('button, [href], [tabindex]');
        firstBtn?.focus();
      }, 50);
      break;

    case 'preferences':
      banner.classList.add('cc-visible');
      notice?.classList.add('cc-hidden');
      prefs?.classList.add('cc-visible');
      syncToggles();
      if (prefs) {
        setTimeout(() => trapFocus(prefs), 50);
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Bind event listeners
// ---------------------------------------------------------------------------

function on(el: HTMLElement, event: string, handler: EventListener) {
  el.addEventListener(event, handler);
  cleanupFns.push(() => el.removeEventListener(event, handler));
}

export function bindDOM(): void {
  // ARIA setup
  const banner = $('[data-cc="banner"]');
  if (banner) {
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.setAttribute('aria-modal', 'false');
  }

  // Accept All buttons
  for (const btn of $$('[data-cc-action="accept-all"]')) {
    on(btn, 'click', () => acceptAll());
  }

  // Reject All buttons
  for (const btn of $$('[data-cc-action="reject-all"]')) {
    on(btn, 'click', () => rejectAll());
  }

  // Show preferences / customize buttons
  for (const btn of $$('[data-cc-action="show-preferences"]')) {
    on(btn, 'click', () => showPreferences());
  }

  // Save preferences button
  for (const btn of $$('[data-cc-action="save-preferences"]')) {
    on(btn, 'click', () => {
      updateConsent(readToggles(), 'custom');
    });
  }

  // Manage cookies (re-open banner with preferences)
  for (const btn of $$('[data-cc-action="manage"]')) {
    on(btn, 'click', () => {
      showBanner();
      // Small delay so banner is visible before opening preferences
      setTimeout(() => showPreferences(), 10);
    });
  }

  // Close / dismiss
  for (const btn of $$('[data-cc-action="close"]')) {
    on(btn, 'click', () => hideUI());
  }

  // Escape key to close preferences → back to notice
  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && getUIState() === 'preferences') {
      showBanner(); // back to notice view
    }
  }
  document.addEventListener('keydown', handleEscape);
  cleanupFns.push(() => document.removeEventListener('keydown', handleEscape));

  // Subscribe to UI state changes
  const unsubUI = onUIChange(applyUIState);
  cleanupFns.push(unsubUI);

  // Apply initial state
  applyUIState(getUIState());
}

export function destroy(): void {
  for (const fn of cleanupFns) fn();
  cleanupFns = [];
  previousFocus = null;
}
