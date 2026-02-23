let injected = false;

export const CSS = /* css */ `
[data-cc="banner"] {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999999;
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: opacity 0.35s ease, transform 0.35s ease;
}

[data-cc="banner"].cc-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

[data-cc="notice"] {
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

[data-cc="notice"].cc-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

[data-cc="preferences-panel"] {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease;
}

[data-cc="preferences-panel"].cc-visible {
  max-height: 80vh;
  overflow-y: auto;
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
