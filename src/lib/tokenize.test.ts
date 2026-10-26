import { describe, expect, it } from 'vitest';
import { buildCast } from './cast';
import { findOccurrences, tokenizeDocument } from './tokenize';
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

describe('findOccurrences', () => {
  it('is case-insensitive and respects word boundaries', () => {
    const text = 'Ann met Anna. ANN signed.';
    expect(findOccurrences(text, 'Ann')).toEqual([
      { start: 0, end: 3 },
      { start: 14, end: 17 },
    ]);
  });

  it('returns nothing for an empty needle', () => {
    expect(findOccurrences('Maya Chen', '   ')).toEqual([]);
  });
});

describe('tokenizeDocument', () => {
  it('replaces every occurrence of an accepted display with one token', () => {
    const text = 'Maya Chen called Maya Chen.';
    const cast = castFor(text, 'Maya Chen');
    const result = tokenizeDocument(text, cast);

    expect(result.text).toBe('[PERSON_1] called [PERSON_1].');
    expect(result.replacedMentions).toBe(2);
  });

  it('leaves rejected entries untouched', () => {
    const text = 'Maya Chen called.';
    const cast = castFor(text, 'Maya Chen');
    cast[0].accepted = false;

    expect(tokenizeDocument(text, cast)).toEqual({ text, replacedMentions: 0 });
  });

  it('prefers the longest overlapping cast value', () => {
    const text = 'Maya Chen met Chen.';
    const fullStart = 0;
    const partialStart = text.lastIndexOf('Chen');
    const detections: Detection[] = [
      {
        id: detectionId('model', 'PERSON', fullStart, fullStart + 9),
        start: fullStart,
        end: fullStart + 9,
        text: 'Maya Chen',
        type: 'PERSON',
        source: 'model',
        confidence: 0.9,
      },
      {
        id: detectionId('model', 'PERSON', partialStart, partialStart + 4),
        start: partialStart,
        end: partialStart + 4,
        text: 'Chen',
        type: 'PERSON',
        source: 'model',
        confidence: 0.8,
      },
    ];
    const cast = buildCast(detections, text);

    expect(tokenizeDocument(text, cast).text).toBe('[PERSON_1] met [PERSON_2].');
  });

  it('does not replace a partial word', () => {
    const text = 'Ann and Anna spoke.';
    const cast = castFor(text, 'Ann');
    const result = tokenizeDocument(text, cast);

    expect(result.text).toBe('[PERSON_1] and Anna spoke.');
    expect(result.replacedMentions).toBe(1);
  });

  it('replaces case variants of the original', () => {
    const text = 'MAYA CHEN approved it.';
    const cast = castFor(text, 'Maya Chen');
    expect(tokenizeDocument(text, cast).text).toBe('[PERSON_1] approved it.');
  });

  it('can replace more occurrences than the detector found', () => {
    const text = 'Maya Chen called. Later, Maya Chen wrote. Finally, Maya Chen signed.';
    const first = text.indexOf('Maya Chen');
    const detection: Detection = {
      id: detectionId('model', 'PERSON', first, first + 9),
      start: first,
      end: first + 9,
      text: 'Maya Chen',
      type: 'PERSON',
      source: 'model',
      confidence: 0.9,
    };
    const cast = buildCast([detection], text);

    const result = tokenizeDocument(text, cast);
    expect(result.replacedMentions).toBe(3);
    expect(result.text).toBe('[PERSON_1] called. Later, [PERSON_1] wrote. Finally, [PERSON_1] signed.');
  });
});
