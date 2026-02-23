export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';
export type ConsentAction = 'accept_all' | 'reject_all' | 'custom' | 'gpc';
export interface ConsentConfig {
    cookieName?: string;
    cookieDomain?: string;
    cookieExpiry?: number;
    consentVersion?: string;
    gtmId?: string;
}
export interface ConsentState {
    categories: Record<ConsentCategory, boolean>;
    consentVersion: string;
    timestamp: string;
    gpc: boolean;
}
export type UIState = 'hidden' | 'banner' | 'preferences';
export type ConsentChangeCallback = (state: ConsentState, action: ConsentAction) => void;
export type UIChangeCallback = (uiState: UIState) => void;
export declare function init(userConfig?: ConsentConfig): ConsentState | null;
export declare function getConsent(): ConsentState | null;
export declare function getConfig(): Required<ConsentConfig>;
export declare function getUIState(): UIState;
export declare function hasValidConsent(): boolean;
export declare function updateConsent(categories: Partial<Record<ConsentCategory, boolean>>, action?: ConsentAction): ConsentState;
export declare function acceptAll(): ConsentState;
export declare function rejectAll(): ConsentState;
export declare function resetConsent(): void;
export declare function onConsentChange(callback: ConsentChangeCallback): () => void;
export declare function onUIChange(callback: UIChangeCallback): () => void;
export declare function showBanner(): void;
export declare function showPreferences(): void;
export declare function hideUI(): void;
export declare function openManage(): void;
