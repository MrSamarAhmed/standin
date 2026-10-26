import { describe, expect, it } from 'vitest';
import { buildCast } from './cast';
import { checkLeaks } from './leakCheck';
import { detectionId, type Detection, type EntityType } from './types';

function castFor(text: string, needle: string, type: EntityType = 'PERSON') {
  const start = text.indexOf(needle);
  const detection: Detection = {
    id: detectionId('model', type, start, start + needle.length),
    start,
    end: start + needle.length,
    text: needle,
    type,
    source: 'model',
    confidence: 0.9,
  };
  return buildCast([detection], text);
}

describe('checkLeaks', () => {
  it('flags structured data left in the safe text', () => {
    const leaks = checkLeaks('Email alice@example.com if the plan changes.', []);
    expect(leaks).toHaveLength(1);
    expect(leaks[0]).toMatchObject({ kind: 'pattern', text: 'alice@example.com', type: 'EMAIL' });
    expect(leaks[0].message).toContain('Email still visible');
  });

  it('returns no leaks when a selected original was replaced', () => {
    const original = 'Maya Chen approved the plan.';
    const cast = castFor(original, 'Maya Chen');
    const leaks = checkLeaks('[PERSON_1] approved the plan.', cast);
    expect(leaks).toEqual([]);
  });

  it('flags a selected original that remains in the safe text', () => {
    const original = 'Maya Chen approved the plan.';
    const cast = castFor(original, 'Maya Chen');
    const leaks = checkLeaks(original, cast);
    expect(leaks.some((leak) => leak.kind === 'original' && leak.text === 'Maya Chen')).toBe(true);
  });

  it('does not flag rejected entries, because they were deliberately kept', () => {
    const original = 'Maya Chen approved the plan.';
    const cast = castFor(original, 'Maya Chen');
    cast[0].accepted = false;
    expect(checkLeaks(original, cast)).toEqual([]);
  });

  it('flags unknown and malformed stand-ins as broken tokens', () => {
    const original = 'Maya Chen approved the plan.';
    const cast = castFor(original, 'Maya Chen');
    const leaks = checkLeaks('[person_1] met [PERSON_9].', cast);

    expect(leaks.filter((leak) => leak.kind === 'orphanToken')).toHaveLength(2);
    expect(leaks.map((leak) => leak.text)).toEqual(['[person_1]', '[PERSON_9]']);
  });

  it('does not flag a well-formed token that belongs to the cast', () => {
    const original = 'Maya Chen approved the plan.';
    const cast = castFor(original, 'Maya Chen');
    expect(checkLeaks('[PERSON_1] approved the plan.', cast)).toEqual([]);
  });
});
