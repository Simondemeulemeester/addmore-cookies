let injected = false;

export const CSS = /* css */ `
/* Hidden by default — safe to also set display:none in Webflow */
[data-cc="banner"] {
  display: none !important;
  z-index: 999999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

[data-cc="banner"].cc-visible {
  display: block !important;
  opacity: 1;
  pointer-events: auto;
}

[data-cc="notice"].cc-hidden {
  display: none !important;
}

[data-cc="preferences-panel"] {
  display: none !important;
}

[data-cc="preferences-panel"].cc-visible {
  display: block !important;
}

[data-cc="overlay"] {
  display: none !important;
}

[data-cc="overlay"].cc-visible {
  display: block !important;
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
