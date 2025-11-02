import type { Applet } from '../types';

const APPLETS_STORAGE_KEY = 'quick-apps-applets';
const API_KEY_STORAGE_KEY = 'quick-apps-client-api-key';

export function loadAppletsFromStorage(): Applet[] {
    try {
        const saved = window.localStorage.getItem(APPLETS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to load applets from local storage:", error);
        return [];
    }
}

export function saveAppletsToStorage(applets: Applet[]): void {
    try {
        window.localStorage.setItem(APPLETS_STORAGE_KEY, JSON.stringify(applets));
    } catch (error) {
        console.error("Failed to save applets to local storage:", error);
    }
}

export function getClientApiKey(): string | null {
    try {
        return window.localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to get API key from local storage:", error);
        return null;
    }
}

export function setClientApiKey(key: string): void {
    try {
        if (key) {
            window.localStorage.setItem(API_KEY_STORAGE_KEY, key);
        } else {
            window.localStorage.removeItem(API_KEY_STORAGE_KEY);
        }
    } catch (error) {
        console.error("Failed to set API key in local storage:", error);
    }
}
