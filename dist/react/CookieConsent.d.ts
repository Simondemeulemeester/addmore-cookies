export interface CookieConsentLabels {
    title?: string;
    description?: string;
    acceptAll?: string;
    rejectAll?: string;
    customize?: string;
    savePreferences?: string;
    backToNotice?: string;
    functional?: string;
    functionalDescription?: string;
    analytics?: string;
    analyticsDescription?: string;
    marketing?: string;
    marketingDescription?: string;
    necessary?: string;
    necessaryDescription?: string;
}
interface CookieConsentProps {
    labels?: CookieConsentLabels;
    className?: string;
}
export declare function CookieConsent({ labels: userLabels, className }: CookieConsentProps): import("react/jsx-runtime").JSX.Element | null;
export {};
