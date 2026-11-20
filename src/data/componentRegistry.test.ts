import { describe, expect, it } from 'vitest';
import { COMPONENT_REGISTRY } from './componentRegistry';

describe('COMPONENT_REGISTRY', () => {
  it('keeps type, terminals, and pinCount consistent', () => {
    for (const [key, definition] of Object.entries(COMPONENT_REGISTRY)) {
      expect(definition.type).toBe(key);
      expect(definition.terminals.length).toBeGreaterThan(0);
      expect(definition.pinCount).toBe(definition.terminals.length);
    }
  });

  it('includes the new essential parts', () => {
    for (const type of [
      'diode',
      'npn_transistor',
      'inductor',
      'potentiometer',
      'push_button',
    ]) {
      expect(COMPONENT_REGISTRY[type]).toBeDefined();
    }
  });
});
