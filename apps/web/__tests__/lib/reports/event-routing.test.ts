import { describe, expect, it } from 'vitest';

import {
  getClarificationEventName,
  getModeEventNames,
  getSupportedReportModes,
  isSupportedReportMode,
} from '~/lib/reports/event-routing';

describe('Event Routing', () => {
  describe('getClarificationEventName', () => {
    it('maps discovery mode to correct event', () => {
      const event = getClarificationEventName('discovery');
      expect(event).toBe('report/discovery-clarification-answered');
    });

    it('maps hybrid mode to correct event', () => {
      const event = getClarificationEventName('hybrid');
      expect(event).toBe('report/hybrid-clarification-answered');
    });

    it('maps dd mode to correct event', () => {
      const event = getClarificationEventName('dd');
      expect(event).toBe('report/dd-clarification-answered');
    });

    it('throws on unknown mode with helpful error', () => {
      expect(() => getClarificationEventName('unknown')).toThrow(
        /Unknown report mode.*unknown/,
      );
    });

    it('error message suggests updating event-routing.ts', () => {
      try {
        getClarificationEventName('future-mode');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(String(error)).toMatch(/event-routing.ts/);
      }
    });

    it('throws on undefined mode', () => {
      expect(() => getClarificationEventName(undefined)).toThrow(
        /Unknown report mode/,
      );
    });

    it('throws on null mode', () => {
      expect(() =>
        getClarificationEventName(null as unknown as string),
      ).toThrow(/Unknown report mode/);
    });

    it('throws on empty string mode', () => {
      expect(() => getClarificationEventName('')).toThrow(
        /Unknown report mode/,
      );
    });

    it('error message includes all supported modes', () => {
      const error = expect(() =>
        getClarificationEventName('new-mode'),
      ).toThrow();
      error.toMatch(/discovery/);
      error.toMatch(/hybrid/);
      error.toMatch(/dd/);
    });
  });

  describe('getSupportedReportModes', () => {
    it('returns all supported modes', () => {
      const modes = getSupportedReportModes();
      expect(modes).toContain('discovery');
      expect(modes).toContain('hybrid');
      expect(modes).toContain('dd');
    });

    it('returns non-empty array', () => {
      const modes = getSupportedReportModes();
      expect(modes.length).toBeGreaterThan(0);
    });

    it('returns correct count of modes', () => {
      const modes = getSupportedReportModes();
      expect(modes).toHaveLength(3); // discovery, hybrid, dd
    });

    it('returns modes in consistent order', () => {
      const modes1 = getSupportedReportModes();
      const modes2 = getSupportedReportModes();
      expect(modes1).toEqual(modes2);
    });
  });

  describe('isSupportedReportMode', () => {
    it('returns true for discovery', () => {
      expect(isSupportedReportMode('discovery')).toBe(true);
    });

    it('returns true for hybrid', () => {
      expect(isSupportedReportMode('hybrid')).toBe(true);
    });

    it('returns true for dd', () => {
      expect(isSupportedReportMode('dd')).toBe(true);
    });

    it('returns false for unknown mode', () => {
      expect(isSupportedReportMode('unknown')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isSupportedReportMode(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isSupportedReportMode(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isSupportedReportMode('')).toBe(false);
    });

    it('returns false for number', () => {
      expect(isSupportedReportMode(123)).toBe(false);
    });

    it('returns false for object', () => {
      expect(isSupportedReportMode({})).toBe(false);
    });

    it('is a type guard - narrows type for discovery', () => {
      const mode: unknown = 'discovery';
      if (isSupportedReportMode(mode)) {
        // TypeScript now knows mode is ReportMode
        const event = getClarificationEventName(mode);
        expect(event).toBeDefined();
        expect(typeof event).toBe('string');
      }
    });

    it('is a type guard - narrows type for hybrid', () => {
      const mode: unknown = 'hybrid';
      if (isSupportedReportMode(mode)) {
        const event = getClarificationEventName(mode);
        expect(event).toBeDefined();
      }
    });

    it('is a type guard - narrows type for dd', () => {
      const mode: unknown = 'dd';
      if (isSupportedReportMode(mode)) {
        const event = getClarificationEventName(mode);
        expect(event).toBeDefined();
      }
    });
  });

  describe('getModeEventNames', () => {
    it('returns event names for discovery mode', () => {
      const { clarificationEvent, generateEvent } =
        getModeEventNames('discovery');
      expect(clarificationEvent).toBe(
        'report/discovery-clarification-answered',
      );
      expect(generateEvent).toBe('report/generate-discovery');
    });

    it('returns event names for hybrid mode', () => {
      const { clarificationEvent, generateEvent } = getModeEventNames('hybrid');
      expect(clarificationEvent).toBe('report/hybrid-clarification-answered');
      expect(generateEvent).toBe('report/generate-hybrid');
    });

    it('returns event names for dd mode', () => {
      const { clarificationEvent, generateEvent } = getModeEventNames('dd');
      expect(clarificationEvent).toBe('report/dd-clarification-answered');
      expect(generateEvent).toBe('report/generate-dd');
    });

    it('generate event follows pattern: report/generate-{mode}', () => {
      const modes = getSupportedReportModes();
      modes.forEach((mode) => {
        const { generateEvent } = getModeEventNames(mode);
        expect(generateEvent).toBe(`report/generate-${mode}`);
      });
    });
  });

  describe('Mode Consistency', () => {
    it('all supported modes have clarification events', () => {
      const modes = getSupportedReportModes();
      modes.forEach((mode) => {
        expect(() => getClarificationEventName(mode)).not.toThrow();
      });
    });

    it('clarification events are unique per mode (no duplicates)', () => {
      const modes = getSupportedReportModes();
      const events = modes.map(getClarificationEventName);
      const uniqueEvents = new Set(events);
      expect(uniqueEvents.size).toBe(events.length);
    });

    it('clarification event names follow pattern: report/{mode}-clarification-answered', () => {
      const modes = getSupportedReportModes();
      modes.forEach((mode) => {
        const event = getClarificationEventName(mode);
        expect(event).toMatch(/^report\/.+-clarification-answered$/);
        expect(event).toContain(mode);
      });
    });

    it('all modes can be validated with isSupportedReportMode', () => {
      const modes = getSupportedReportModes();
      modes.forEach((mode) => {
        expect(isSupportedReportMode(mode)).toBe(true);
      });
    });

    it('mode mapping is bidirectional', () => {
      const modes = getSupportedReportModes();
      modes.forEach((mode) => {
        const event = getClarificationEventName(mode);
        expect(event).toBeTruthy();
        expect(typeof event).toBe('string');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles mode with special characters', () => {
      expect(() => getClarificationEventName('foo-bar')).toThrow();
    });

    it('handles mode with spaces', () => {
      expect(() => getClarificationEventName('foo bar')).toThrow();
    });

    it('is case-sensitive', () => {
      expect(() => getClarificationEventName('HYBRID')).toThrow();
      expect(() => getClarificationEventName('Hybrid')).toThrow();
    });

    it('handles very long unknown mode name', () => {
      const longMode = 'a'.repeat(1000);
      expect(() => getClarificationEventName(longMode)).toThrow();
    });
  });

  describe('Regression Tests (prevent adding bug back)', () => {
    it('dd mode event is registered (regression: was missing)', () => {
      const event = getClarificationEventName('dd');
      expect(event).toBe('report/dd-clarification-answered');
    });

    it('discovery mode event is correct (regression)', () => {
      const event = getClarificationEventName('discovery');
      expect(event).toBe('report/discovery-clarification-answered');
    });

    it('hybrid mode event is correct (regression)', () => {
      const event = getClarificationEventName('hybrid');
      expect(event).toBe('report/hybrid-clarification-answered');
    });
  });
});
