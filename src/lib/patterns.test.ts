import { describe, expect, it } from 'vitest';
import { luhnValid } from './luhn';
import { findPatternDetections } from './patterns';

function texts(input: string) {
  return findPatternDetections(input).map((detection) => detection.text);
}

describe('findPatternDetections', () => {
  it('finds emails regardless of case', () => {
    const detections = findPatternDetections('Write to Maya.Chen+ops@Example.ORG today.');
    expect(detections).toHaveLength(1);
    expect(detections[0]).toMatchObject({
      text: 'Maya.Chen+ops@Example.ORG',
      type: 'EMAIL',
      source: 'pattern',
    });
  });

  it('finds several structured details in one pass', () => {
    const input =
      'Call +1 (415) 555-0199, use account 8842-1190-77, pay $12,500.50, and visit https://example.org/meridian.';
    const found = findPatternDetections(input);
    expect(found.map((detection) => detection.type)).toEqual([
      'PHONE',
      'ID',
      'MONEY',
      'URL',
    ]);
  });

  it('keeps only Luhn-valid card numbers', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBe(true);
    expect(luhnValid('4242 4242 4242 4241')).toBe(false);

    expect(texts('Card 4242 4242 4242 4242 expires soon.')).toEqual(['4242 4242 4242 4242']);
    expect(texts('Reference 4242 4242 4242 4241 is not a card.')).toEqual([]);
  });

  it('finds mainland-style identifiers and SSNs', () => {
    expect(texts('SSN 123-45-6789')).toEqual(['123-45-6789']);
    expect(texts('IBAN DE89 3704 0044 0532 0130 00')).toEqual([
      'DE89 3704 0044 0532 0130 00',
    ]);
  });

  it('finds standalone uppercase reference codes', () => {
    expect(texts('The case MRD-441 stays internal.')).toEqual(['MRD-441']);
    expect(texts('Lowercase mrd-441 is not a code match.')).toEqual([]);
  });

  it('finds money with thousands separators', () => {
    expect(texts('The fee is $48,500 and the deposit is €2,000.50.')).toEqual([
      '$48,500',
      '€2,000.50',
    ]);
  });

  it('finds a street address including city, state, and postal code', () => {
    expect(texts('Deliver to 214 Alder Street, Portland, OR 97205 by Friday.')).toEqual([
      '214 Alder Street, Portland, OR 97205',
    ]);
  });

  it('trims trailing punctuation from a link', () => {
    expect(texts('Read https://example.org/report).')).toEqual(['https://example.org/report']);
  });

  it('prefers a card over a phone number when regions overlap', () => {
    const found = findPatternDetections('Test card: 4242 4242 4242 4242.');
    expect(found).toHaveLength(1);
    expect(found[0].type).toBe('ID');
  });
});
