import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  init as coreInit,
  getConsent,
  getUIState,
  hasValidConsent,
  acceptAll as coreAcceptAll,
  rejectAll as coreRejectAll,
  updateConsent as coreUpdateConsent,
  resetConsent as coreResetConsent,
  showBanner as coreShowBanner,
  showPreferences as coreShowPreferences,
  hideUI as coreHideUI,
  onConsentChange,
  onUIChange,
  type ConsentConfig,
  type ConsentState,
  type ConsentCategory,
  type UIState,
} from '../core';

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

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

interface ProviderProps {
  config?: ConsentConfig;
  children: ReactNode;
}

export function CookieConsentProvider({ config, children }: ProviderProps) {
  // Init synchronously in state initializer — runs before first paint
  const [consent, setConsent] = useState<ConsentState | null>(() => {
    return coreInit(config);
  });
  const [uiState, setUIState] = useState<UIState>(() => getUIState());

  useEffect(() => {
    const unsubConsent = onConsentChange((newState) => {
      setConsent({ ...newState, categories: { ...newState.categories } });
    });
    const unsubUI = onUIChange((newUI) => {
      setUIState(newUI);
    });
    return () => { unsubConsent(); unsubUI(); };
  }, []);

  const acceptAll = useCallback(() => {
    const s = coreAcceptAll();
    setConsent(s);
  }, []);

  const rejectAll = useCallback(() => {
    const s = coreRejectAll();
    setConsent(s);
  }, []);

  const updateConsent = useCallback((categories: Partial<Record<ConsentCategory, boolean>>) => {
    const s = coreUpdateConsent(categories, 'custom');
    setConsent(s);
  }, []);

  const resetConsent = useCallback(() => {
    coreResetConsent();
    setConsent(null);
  }, []);

  const value: CookieConsentContextValue = {
    consent,
    uiState,
    hasConsent: hasValidConsent(),
    acceptAll,
    rejectAll,
    updateConsent,
    resetConsent,
    showBanner: coreShowBanner,
    showPreferences: coreShowPreferences,
    hideUI: coreHideUI,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return ctx;
}
