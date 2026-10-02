const STORAGE_KEY = "field-operations.session";

export function loadSavedToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage can be unavailable (private browsing); the session just won't persist.
  }
}
