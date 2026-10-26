import { describe, expect, it } from 'vitest';
import { buildCast } from './cast';
import { normalizeToken, restoreTokens, splitTokenSegments } from './restore';
import { detectionId, type CastEntry, type Detection, type EntityType } from './types';

function entry(token: string, display: string, type: EntityType = 'PERSON'): CastEntry {
  const detection: Detection = {
    id: detectionId('model', type, 0, display.length),
    start: 0,
    end: display.length,
    text: display,
    type,
    source: 'model',
    confidence: 0.9,
  };
  const [base] = buildCast([detection]);
  return { ...base, token };
}

describe('restoreTokens', () => {
  const cast = [
    entry('[PERSON_1]', 'Maya Chen'),
    entry('[ORG_1]', 'Horizon Labs', 'ORG'),
  ];

  it('normalizes a token type and number', () => {
    expect(normalizeToken('person', '01')).toBe('[PERSON_1]');
    expect(normalizeToken('ORG', 2)).toBe('[ORG_2]');
  });

  it('restores known tokens and keeps surrounding text', () => {
    const result = restoreTokens('Ask [PERSON_1] about [ORG_1].', cast);
    expect(result.output).toBe('Ask Maya Chen about Horizon Labs.');
    expect(result.report).toEqual({ restored: 2, unknown: [], totalTokens: 2 });
    expect(result.segments.map((segment) => segment.kind)).toEqual([
      'plain',
      'restored',
      'plain',
      'restored',
      'plain',
    ]);
  });

  it('tolerates case, spacing, and hyphen differences', () => {
    const result = restoreTokens('[person - 1] met [ org _ 1 ]', cast);
    expect(result.output).toBe('Maya Chen met Horizon Labs');
    expect(result.report.restored).toBe(2);
  });

  it('leaves unknown tokens untouched and reports them', () => {
    const result = restoreTokens('[PERSON_1] and [PERSON_9]', cast);
    expect(result.output).toBe('Maya Chen and [PERSON_9]');
    expect(result.report.unknown).toEqual(['[PERSON_9]']);
    expect(result.segments.some((segment) => segment.kind === 'unknown')).toBe(true);
  });

  it('returns plain text and a zero report when no token is present', () => {
    const result = restoreTokens('The AI removed the tokens.', cast);
    expect(result.output).toBe('The AI removed the tokens.');
    expect(result.report).toEqual({ restored: 0, unknown: [], totalTokens: 0 });
    expect(result.segments).toEqual([{ kind: 'plain', text: 'The AI removed the tokens.' }]);
  });

  it('does not restore tokens from a rejected entry', () => {
    const rejected = [{ ...entry('[PERSON_2]', 'Daniel Okafor'), accepted: false }];
    const result = restoreTokens('[PERSON_2]', rejected);
    expect(result.output).toBe('[PERSON_2]');
    expect(result.report.unknown).toEqual(['[PERSON_2]']);
  });
});

describe('splitTokenSegments', () => {
  it('separates strict tokens from the surrounding text', () => {
    expect(splitTokenSegments('Hi [PERSON_1], meet [ORG_2].')).toEqual([
      { kind: 'text', text: 'Hi ' },
      { kind: 'token', text: '[PERSON_1]' },
      { kind: 'text', text: ', meet ' },
      { kind: 'token', text: '[ORG_2]' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('treats loose tokens as plain text for display', () => {
    expect(splitTokenSegments('Hi [person_1].')).toEqual([
      { kind: 'text', text: 'Hi [person_1].' },
    ]);
  });

  it('returns one text segment for token-free input', () => {
    expect(splitTokenSegments('No stand-ins here.')).toEqual([
      { kind: 'text', text: 'No stand-ins here.' },
    ]);
  });
});
