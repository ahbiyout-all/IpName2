// Safe localStorage wrapper for memory fallback in iframe/sandboxed environments
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage read blocked for key "${key}", using fallback memory storage.`, e);
      return memoryStorage[key] || null;
    }
  },
  
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage write blocked for key "${key}", using fallback memory storage.`, e);
      memoryStorage[key] = value;
    }
  },
  
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage remove blocked for key "${key}", using fallback memory storage.`, e);
      delete memoryStorage[key];
    }
  }
};
