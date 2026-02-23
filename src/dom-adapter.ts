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
// Webflow checkbox helper
// ---------------------------------------------------------------------------

function findToggle(cat: string): HTMLInputElement | null {
  // Direct input with the attribute
  const direct = $<HTMLInputElement>(`input[data-cc-toggle="${cat}"]`);
  if (direct) return direct;
  // Webflow wraps checkboxes — attribute may be on a parent, find the input inside
  const wrapper = $<HTMLElement>(`[data-cc-toggle="${cat}"]`);
  if (wrapper) return wrapper.querySelector<HTMLInputElement>('input[type="checkbox"]');
  return null;
}

// ---------------------------------------------------------------------------
// Sync toggles from current consent
// ---------------------------------------------------------------------------

function syncToggles() {
  const consent = getConsent();
  const categories: ConsentCategory[] = ['functional', 'analytics', 'marketing'];

  for (const cat of categories) {
    const toggle = findToggle(cat);
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
    const toggle = findToggle(cat);
    if (toggle) cats[cat] = toggle.checked;
  }
  return cats;
}

// ---------------------------------------------------------------------------
// Show/hide helpers — explicit per element
// ---------------------------------------------------------------------------

function show(el: HTMLElement | null) {
  el?.classList.add('cc-visible');
}

function hide(el: HTMLElement | null) {
  el?.classList.remove('cc-visible');
}

// ---------------------------------------------------------------------------
// UI state → DOM classes
// ---------------------------------------------------------------------------

function applyUIState(uiState: UIState) {
  const banner = $('[data-cc="banner"]');
  const notice = $('[data-cc="notice"]');
  const prefs = $('[data-cc="preferences-panel"]');
  const overlay = $('[data-cc="overlay"]');

  if (!banner) return;

  // Reset everything first
  hide(banner);
  hide(notice);
  hide(prefs);
  hide(overlay);

  switch (uiState) {
    case 'hidden':
      if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }
      break;

    case 'banner':
      show(banner);
      show(notice);
      if (!previousFocus) previousFocus = document.activeElement as HTMLElement;
      setTimeout(() => {
        const firstBtn = banner.querySelector<HTMLElement>('button, [href], [tabindex]');
        firstBtn?.focus();
      }, 50);
      break;

    case 'preferences':
      show(banner);
      show(prefs);
      show(overlay);
      syncToggles();
      if (!previousFocus) previousFocus = document.activeElement as HTMLElement;
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
  // Force wrapper visible — overrides Webflow display:none via inline style
  const wrapper = $('[data-cc="wrapper"]');
  if (wrapper) wrapper.style.display = 'block';

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

  // Overlay click → close preferences
  const overlay = $('[data-cc="overlay"]');
  if (overlay) {
    on(overlay, 'click', () => {
      if (getUIState() === 'preferences') showBanner();
    });
  }

  // Escape key to close preferences → back to notice
  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && getUIState() === 'preferences') {
      showBanner();
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
