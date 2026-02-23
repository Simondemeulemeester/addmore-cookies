let injected = false;

export const CSS = /* css */ `
/* Everything hidden by default */
[data-cc="banner"],
[data-cc="notice"],
[data-cc="preferences-panel"],
[data-cc="overlay"] {
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

/* Banner visible (notice state) */
[data-cc="banner"].cc-visible {
  opacity: 1 !important;
  pointer-events: auto !important;
  visibility: visible !important;
}

/* Notice visible inside banner */
[data-cc="notice"].cc-visible {
  opacity: 1 !important;
  pointer-events: auto !important;
  visibility: visible !important;
}

/* Preferences panel visible */
[data-cc="preferences-panel"].cc-visible {
  opacity: 1 !important;
  pointer-events: auto !important;
  visibility: visible !important;
}

/* Overlay visible */
[data-cc="overlay"].cc-visible {
  opacity: 1 !important;
  pointer-events: auto !important;
  visibility: visible !important;
}
`;

export function injectStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  if (document.querySelector('style[data-cc-styles]')) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-cc-styles', '');
  style.textContent = CSS;
  document.head.appendChild(style);
  injected = true;
}
