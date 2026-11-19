const CIRCUITS_KEY = 'circuitlab_circuits';
const NFC_HISTORY_KEY = 'circuitlab_nfc_history';
const COMPONENT_INVENTORY_KEY = 'circuitlab_inventory';

export function saveCircuits(circuits: any[]): void {
  try {
    localStorage.setItem(CIRCUITS_KEY, JSON.stringify(circuits));
  } catch (e) {
    console.warn('Failed to save circuits to localStorage', e);
  }
}

export function loadCircuits(): any[] {
  try {
    const raw = localStorage.getItem(CIRCUITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load circuits from localStorage', e);
    return [];
  }
}

export function saveNFCHistory(history: any[]): void {
  try {
    localStorage.setItem(NFC_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save NFC history', e);
  }
}

export function loadNFCHistory(): any[] {
  try {
    const raw = localStorage.getItem(NFC_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load NFC history', e);
    return [];
  }
}

export function saveInventory(inventory: any[]): void {
  try {
    localStorage.setItem(COMPONENT_INVENTORY_KEY, JSON.stringify(inventory));
  } catch (e) {
    console.warn('Failed to save inventory', e);
  }
}

export function loadInventory(): any[] {
  try {
    const raw = localStorage.getItem(COMPONENT_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load inventory', e);
    return [];
  }
}
