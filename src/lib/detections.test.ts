import { describe, expect, it } from 'vitest';
import { findPatternDetections } from './patterns';
import { mergeDetections, mergeModelDetections } from './detections';
import type { EntityType, ModelEntity } from './types';

function entity(
  text: string,
  start: number,
  end: number,
  type: EntityType = 'PERSON',
  confidence = 0.9,
): ModelEntity {
  return { text, start, end, type, confidence };
}

describe('mergeModelDetections', () => {
  it('drops low-confidence and non-name entities', () => {
    const text = 'Maya Chen sent the invoice.';
    const merged = mergeModelDetections(text, [
      entity('Maya Chen', 0, 9, 'PERSON', 0.4),
      entity('invoice', 15, 22, 'MONEY', 0.99),
    ]);
    expect(merged).toEqual([]);
  });

  it('removes overlapping spans, keeping the first by start then length', () => {
    const text = 'Maya Chen approved it.';
    const merged = mergeModelDetections(text, [
      entity('Chen', 5, 9, 'PERSON', 0.72),
      entity('Maya Chen', 0, 9, 'PERSON', 0.99),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ text: 'Maya Chen', start: 0, end: 9 });
  });

  it('joins directly adjacent spans of the same type', () => {
    const text = 'MayaChen';
    const merged = mergeModelDetections(text, [
      entity('Maya', 0, 4, 'PERSON', 0.9),
      entity('Chen', 4, 8, 'PERSON', 0.8),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].text).toBe('MayaChen');
  });

  it('trims whitespace around model spans', () => {
    const text = '  Maya Chen  ';
    const merged = mergeModelDetections(text, [entity(' Maya Chen ', 0, 13, 'PERSON', 0.9)]);
    expect(merged[0]).toMatchObject({ text: 'Maya Chen', start: 2, end: 11 });
  });
});

describe('mergeDetections', () => {
  it('lets pattern detections win an overlap with the model', () => {
    const text = 'Write to maya@example.com today.';
    const patterns = findPatternDetections(text);
    const model: ModelEntity[] = [
      entity('maya', 9, 13, 'PERSON', 0.95),
      entity('today', 26, 31, 'MISC', 0.8),
    ];

    const merged = mergeDetections(text, patterns, model);
    expect(merged.some((detection) => detection.type === 'EMAIL')).toBe(true);
    expect(merged.some((detection) => detection.source === 'model' && detection.text === 'maya')).toBe(
      false,
    );
    expect(merged.some((detection) => detection.text === 'today')).toBe(true);
  });

  it('returns results in document order', () => {
    const text = 'Maya Chen lives in Lisbon.';
    const merged = mergeDetections(text, [], [
      entity('Lisbon', 19, 25, 'LOCATION', 0.95),
      entity('Maya Chen', 0, 9, 'PERSON', 0.98),
    ]);
    expect(merged.map((detection) => detection.text)).toEqual(['Maya Chen', 'Lisbon']);
  });
});
