const PREFIX = 'jrmsu_labtrack_';


export const setStorageItem = <T>(key: string, value: T): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const serializedValue = JSON.stringify(value);
    window.localStorage.setItem(`${PREFIX}${key}`, serializedValue);
    return true;
  } catch (error) {
    console.error(`[Storage Error] Failed to write key "${key}" to localStorage:`, error);
    return false;
  }
};


export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(`${PREFIX}${key}`);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`[Storage Error] Failed to read key "${key}" from localStorage:`, error);
    return defaultValue;
  }
};


export const removeStorageItem = (key: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.removeItem(`${PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error(`[Storage Error] Failed to remove key "${key}" from localStorage:`, error);
    return false;
  }
};


export const clearAppStorage = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('[Storage Error] Failed to clear application storage:', error);
    return false;
  }
};

export default {
  set: setStorageItem,
  get: getStorageItem,
  remove: removeStorageItem,
  clear: clearAppStorage,
};