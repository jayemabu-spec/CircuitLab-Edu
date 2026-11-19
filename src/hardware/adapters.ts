import type { HardwareAdapter, NFCComponentRecord } from '../types/simulation';
import { virtualScanner } from '../nfc/scanner';

/**
 * Communication protocol messages between the web app and the microcontroller.
 * All messages are JSON.
 *
 * Example messages:
 *
 * Component detected:
 * {
 *   "type": "component_detected",
 *   "uid": "A1B2C3D4",
 *   "component": "resistor",
 *   "value": 220,
 *   "unit": "ohm"
 * }
 *
 * Measurement reading:
 * {
 *   "type": "measurement",
 *   "instrument": "voltmeter",
 *   "value": 4.82,
 *   "unit": "V"
 * }
 *
 * Command to set LED pattern:
 * {
 *   "type": "led_pattern",
 *   "pattern": [1, 0, 1, 1, 0]
 * }
 *
 * Command to LCD display:
 * {
 *   "type": "display",
 *   "line1": "V=4.82V",
 *   "line2": "I=0.24A"
 * }
 */

/**
 * Mock hardware adapter - simulates physical hardware for development.
 * No actual hardware is connected. Replace with Web Serial/Web Bluetooth adapter later.
 */
export class MockHardwareAdapter implements HardwareAdapter {
  name = 'Mock Hardware Adapter';
  connected = true;

  async scanNFC(): Promise<NFCComponentRecord | null> {
    // Simulate scanning a random known tag
    const scanner = virtualScanner;
    const db = scanner.getDatabase();
    const uids = Object.keys(db);
    const uid = uids[Math.floor(Math.random() * uids.length)];
    return scanner.scanComponent(uid);
  }

  async readDisplay(): Promise<string> {
    return 'CircuitLab Edu\nReady';
  }

  async writeDisplay(_text: string): Promise<void> {
    // Mock: do nothing
  }

  async setLEDs(_pattern: number[]): Promise<void> {
    // Mock: do nothing
  }
}

/**
 * NFC adapter interface for future hardware NFC reader.
 * Currently delegates to the virtual scanner.
 */
export class NFCAdapter implements HardwareAdapter {
  name = 'NFC Adapter (Virtual)';
  connected = true;

  async scanNFC(): Promise<NFCComponentRecord | null> {
    return virtualScanner.scanComponent('A1B2C3D4'); // Default demo tag
  }

  async readDisplay(): Promise<string> {
    return 'NFC Scanner\nReady';
  }

  async writeDisplay(_text: string): Promise<void> {
    // No-op
  }

  async setLEDs(_pattern: number[]): Promise<void> {
    // No-op
  }
}

/**
 * Display adapter for LCD/OLED display on the physical platform.
 */
export class DisplayAdapter implements HardwareAdapter {
  name = 'Display Adapter (Mock)';
  connected = true;
  private buffer = '';

  async scanNFC(): Promise<NFCComponentRecord | null> {
    return null;
  }

  async readDisplay(): Promise<string> {
    return this.buffer;
  }

  async writeDisplay(text: string): Promise<void> {
    this.buffer = text;
  }

  async setLEDs(_pattern: number[]): Promise<void> {
    // No-op
  }
}

/**
 * LED visualization adapter for LED strips showing current flow.
 */
export class LEDVisualizationAdapter implements HardwareAdapter {
  name = 'LED Adapter (Mock)';
  connected = true;
  private pattern: number[] = [];

  async scanNFC(): Promise<NFCComponentRecord | null> {
    return null;
  }

  async readDisplay(): Promise<string> {
    return `LEDs: ${this.pattern.join(',')}`;
  }

  async writeDisplay(_text: string): Promise<void> {
    // No-op
  }

  async setLEDs(pattern: number[]): Promise<void> {
    this.pattern = pattern;
  }
}

export const mockHardware = new MockHardwareAdapter();
export const nfcAdapter = new NFCAdapter();
export const displayAdapter = new DisplayAdapter();
export const ledAdapter = new LEDVisualizationAdapter();
