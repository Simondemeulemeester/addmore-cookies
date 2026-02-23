let injected = false;

export const CSS = /* css */ `
/* Animation & visibility only — positioning is up to you */
[data-cc="banner"] {
  z-index: 999999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease, transform 0.35s ease;
}

[data-cc="banner"].cc-visible {
  opacity: 1;
  pointer-events: auto;
}

[data-cc="notice"].cc-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  position: absolute;
}

[data-cc="preferences-panel"] {
  display: none;
}

[data-cc="preferences-panel"].cc-visible {
  display: block;
}

/* Overlay behind preferences panel */
[data-cc="overlay"] {
  display: none;
}

[data-cc="overlay"].cc-visible {
  display: block;
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
