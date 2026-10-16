// ============================================================
// localStorage Wrapper — Crypto Tycoon
// ============================================================

import type { SaveData } from '../types/game';

const SAVE_KEY = 'crypto_tycoon_save';
const SAVE_SLOTS_KEY = 'crypto_tycoon_saves';

export interface StorageError {
  type: 'quota' | 'parse' | 'unknown';
  message: string;
}

/**
 * Safely write JSON to localStorage.
 */
export function saveToStorage<T>(key: string, data: T): true | StorageError {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return { type: 'quota', message: 'Storage quota exceeded' };
    }
    return { type: 'unknown', message: String(e) };
  }
}

/**
 * Safely read JSON from localStorage.
 */
export function loadFromStorage<T>(key: string): T | null | StorageError {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    return { type: 'parse', message: String(e) };
  }
}

/**
 * Remove a key from localStorage.
 */
export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Check if a key exists in localStorage.
 */
export function hasStorageKey(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

// ============================================================
// Save-slot helpers (auto-save + 2 manual slots)
// ============================================================

export type SaveSlot = 'auto' | 'manual1' | 'manual2';

function slotKey(slot: SaveSlot): string {
  return `${SAVE_SLOTS_KEY}_${slot}`;
}

export function saveSlot<T>(slot: SaveSlot, data: T): true | StorageError {
  return saveToStorage(slotKey(slot), data);
}

export function loadSlot<T>(slot: SaveSlot): T | null | StorageError {
  return loadFromStorage<T>(slotKey(slot));
}

export function deleteSlot(slot: SaveSlot): void {
  removeFromStorage(slotKey(slot));
}

export function listSaveSlots(): SaveSlot[] {
  const slots: SaveSlot[] = ['auto', 'manual1', 'manual2'];
  return slots.filter((s) => hasStorageKey(slotKey(s)));
}

// ============================================================
// Legacy single-save helpers (backward compat)
// ============================================================

export function saveGame(data: SaveData): true | StorageError {
  return saveToStorage(SAVE_KEY, data);
}

export function loadGame(): SaveData | null | StorageError {
  return loadFromStorage<SaveData>(SAVE_KEY);
}

export function deleteGame(): void {
  removeFromStorage(SAVE_KEY);
}

export function exportSave(data: SaveData): string {
  return btoa(JSON.stringify(data));
}

export function importSave(base64: string): SaveData | StorageError {
  try {
    const json = atob(base64);
    return JSON.parse(json) as SaveData;
  } catch (e) {
    return { type: 'parse', message: String(e) };
  }
}
