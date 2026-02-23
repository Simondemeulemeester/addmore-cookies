/// <reference path="./global.d.ts" />

import { injectStyles } from './styles';
import { bindDOM, destroy } from './dom-adapter';
import {
  init as coreInit,
  getConsent,
  getConfig,
  getUIState,
  hasValidConsent,
  updateConsent,
  acceptAll,
  rejectAll,
  resetConsent,
  onConsentChange,
  onUIChange,
  showBanner,
  showPreferences,
  hideUI,
  openManage,
} from './core';
import type { ConsentConfig } from './core';

function init(userConfig: ConsentConfig = {}) {
  injectStyles();
  const result = coreInit(userConfig);

  // Bind DOM when ready (banner HTML might not be parsed yet if script is in <head>)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bindDOM(), { once: true });
  } else {
    bindDOM();
  }

  return result;
}

// Expose public API
export {
  init,
  getConsent,
  getConfig,
  getUIState,
  hasValidConsent,
  updateConsent,
  acceptAll,
  rejectAll,
  resetConsent,
  onConsentChange,
  onUIChange,
  showBanner,
  showPreferences,
  hideUI,
  openManage,
  destroy,
};

// IIFE: attach to window
if (typeof window !== 'undefined') {
  window.CookieConsent = {
    init,
    getConsent,
    getConfig,
    getUIState,
    hasValidConsent,
    updateConsent,
    acceptAll,
    rejectAll,
    resetConsent,
    onConsentChange,
    onUIChange,
    showBanner,
    showPreferences,
    hideUI,
    openManage,
    destroy,
  } as unknown as typeof import('./core');
}
