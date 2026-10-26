import { describe, expect, it } from 'vitest';
import {
  acceptedEntries,
  addCustomCastEntry,
  buildCast,
  cloneCast,
  sameAcceptedCast,
} from './cast';
import { detectionId, type Detection, type EntityType } from './types';

function detect(
  text: string,
  needle: string,
  type: EntityType = 'PERSON',
  source: 'model' | 'pattern' = 'model',
  occurrence = 0,
): Detection {
  let start = -1;
  let from = 0;
  for (let index = 0; index <= occurrence; index += 1) {
    start = text.indexOf(needle, from);
    from = start + needle.length;
  }
  return {
    id: detectionId(source, type, start, start + needle.length),
    start,
    end: start + needle.length,
    text: needle,
    type,
    source,
    confidence: 0.9,
  };
}

describe('buildCast', () => {
  it('groups repeated mentions and assigns one token per type', () => {
    const text = 'Maya Chen met Daniel Okafor. Maya Chen signed.';
    const cast = buildCast([
      detect(text, 'Maya Chen', 'PERSON', 'model', 0),
      detect(text, 'Daniel Okafor', 'PERSON', 'model', 0),
      detect(text, 'Maya Chen', 'PERSON', 'model', 1),
    ]);

    expect(cast).toHaveLength(2);
    expect(cast[0]).toMatchObject({
      display: 'Maya Chen',
      token: '[PERSON_1]',
      accepted: true,
    });
    expect(cast[0].mentions).toHaveLength(2);
    expect(cast[1]).toMatchObject({ display: 'Daniel Okafor', token: '[PERSON_2]' });
  });

  it('orders tokens by first appearance across types', () => {
    const text = 'Horizon Labs emailed Maya Chen about Lisbon.';
    const cast = buildCast([
      detect(text, 'Maya Chen', 'PERSON'),
      detect(text, 'Horizon Labs', 'ORG'),
      detect(text, 'Lisbon', 'LOCATION'),
    ]);
    expect(cast.map((entry) => entry.token)).toEqual(['[ORG_1]', '[PERSON_1]', '[LOCATION_1]']);
  });

  it('absorbs a partial name into a longer name at the same occurrence', () => {
    const text = 'Prepared by Maya Chen. Keep Maya Chen copied.';
    const cast = buildCast(
      [
        detect(text, 'Maya Chen', 'PERSON', 'model', 0),
        detect(text, 'Chen', 'PERSON', 'model', 1),
        detect(text, 'Maya Chen', 'PERSON', 'model', 1),
      ],
      text,
    );

    expect(cast).toHaveLength(1);
    expect(cast[0].display).toBe('Maya Chen');
    expect(cast[0].mentions).toHaveLength(2);
  });

  it('keeps a standalone partial name when it is not inside a full name', () => {
    const text = 'Maya Chen met Chen at the desk.';
    const cast = buildCast(
      [
        detect(text, 'Maya Chen', 'PERSON', 'model', 0),
        detect(text, 'Chen', 'PERSON', 'model', 1),
      ],
      text,
    );

    expect(cast.map((entry) => entry.display)).toEqual(['Maya Chen', 'Chen']);
  });
});

describe('custom cast entries', () => {
  it('adds one custom token for every occurrence', () => {
    const text = 'MRD-441 is due. MRD-441 stays private.';
    const result = addCustomCastEntry([], text, 'MRD-441');

    expect(result.error).toBeUndefined();
    expect(result.entry).toMatchObject({
      display: 'MRD-441',
      token: '[CUSTOM_1]',
      type: 'CUSTOM',
      source: 'custom',
    });
    expect(result.entry?.mentions).toHaveLength(2);
  });

  it('rejects duplicates, short terms, and terms not in the document', () => {
    const text = 'MRD-441 stays private.';
    const first = addCustomCastEntry([], text, 'MRD-441');
    expect(first.entry).toBeDefined();

    expect(addCustomCastEntry([first.entry!], text, 'mrd-441').error).toMatch(/already in the cast/);
    expect(addCustomCastEntry([], text, 'A').error).toMatch(/two characters/);
    expect(addCustomCastEntry([], text, 'MISSING-1').error).toMatch(/Nothing in this document/);
  });
});

describe('cast helpers', () => {
  it('filters accepted entries without mutating the cast', () => {
    const text = 'Maya Chen and Horizon Labs.';
    const cast = buildCast([
      detect(text, 'Maya Chen', 'PERSON'),
      detect(text, 'Horizon Labs', 'ORG'),
    ]);
    cast[1].accepted = false;

    expect(acceptedEntries(cast).map((entry) => entry.display)).toEqual(['Maya Chen']);
    expect(cast).toHaveLength(2);
  });

  it('compares only accepted entries and preserves key order', () => {
    const text = 'Maya Chen and Horizon Labs.';
    const cast = buildCast([
      detect(text, 'Maya Chen', 'PERSON'),
      detect(text, 'Horizon Labs', 'ORG'),
    ]);
    const copy = cloneCast(cast);

    expect(sameAcceptedCast(cast, copy)).toBe(true);
    copy[0].mentions[0].start = 999;
    expect(sameAcceptedCast(cast, copy)).toBe(true);
    copy[1].accepted = false;
    expect(sameAcceptedCast(cast, copy)).toBe(false);
  });

  it('clones mentions so later edits do not affect the source cast', () => {
    const text = 'Maya Chen signed.';
    const cast = buildCast([detect(text, 'Maya Chen', 'PERSON')]);
    const clone = cloneCast(cast);

    clone[0].mentions[0].text = 'Changed';
    clone[0].accepted = false;
    expect(cast[0].mentions[0].text).toBe('Maya Chen');
    expect(cast[0].accepted).toBe(true);
  });
});
