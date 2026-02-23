export {};

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
    CookieConsent: typeof import('./core');
  }

  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}
