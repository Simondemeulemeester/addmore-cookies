import { type ReactNode } from 'react';
import { type ConsentConfig, type ConsentState, type ConsentCategory, type UIState } from '../core';
interface CookieConsentContextValue {
    consent: ConsentState | null;
    uiState: UIState;
    hasConsent: boolean;
    acceptAll: () => void;
    rejectAll: () => void;
    updateConsent: (categories: Partial<Record<ConsentCategory, boolean>>) => void;
    resetConsent: () => void;
    showBanner: () => void;
    showPreferences: () => void;
    hideUI: () => void;
}
interface ProviderProps {
    config?: ConsentConfig;
    children: ReactNode;
}
export declare function CookieConsentProvider({ config, children }: ProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useCookieConsent(): CookieConsentContextValue;
export {};
