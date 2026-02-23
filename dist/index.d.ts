import { destroy } from './dom-adapter';
import { getConsent, getConfig, getUIState, hasValidConsent, updateConsent, acceptAll, rejectAll, resetConsent, onConsentChange, onUIChange, showBanner, showPreferences, hideUI, openManage } from './core';
import type { ConsentConfig } from './core';
declare function init(userConfig?: ConsentConfig): import("./core").ConsentState | null;
export { init, getConsent, getConfig, getUIState, hasValidConsent, updateConsent, acceptAll, rejectAll, resetConsent, onConsentChange, onUIChange, showBanner, showPreferences, hideUI, openManage, destroy, };
