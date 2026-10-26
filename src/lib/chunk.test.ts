import { describe, expect, it } from 'vitest';
import { chunkText } from './chunk';

describe('chunkText', () => {
  it('returns one chunk for an empty document', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('returns one chunk when the text fits', () => {
    const text = 'A short memo about the Meridian handover.';
    expect(chunkText(text)).toEqual([{ text, start: 0 }]);
  });

  it('splits long text with a repeating overlap and keeps absolute offsets', () => {
    const paragraph = 'Maya Chen reviewed the Meridian account and signed the note. ';
    const text = paragraph.repeat(50);
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].start).toBe(0);
    for (const chunk of chunks) {
      expect(text.slice(chunk.start, chunk.start + chunk.text.length)).toBe(chunk.text);
      expect(chunk.text.length).toBeLessThanOrEqual(900);
    }

    for (let index = 1; index < chunks.length; index += 1) {
      const previous = chunks[index - 1];
      expect(chunks[index].start).toBe(previous.start + previous.text.length - 80);
    }

    const last = chunks[chunks.length - 1];
    expect(last.start + last.text.length).toBe(text.length);
  });

  it('always includes a short tail instead of dropping it', () => {
    const text = `${'word '.repeat(200)}END.`;
    const chunks = chunkText(text);
    expect(chunks[chunks.length - 1].text).toContain('END.');
  });

  it('stays within the chunk target even without sentence boundaries', () => {
    const text = 'x'.repeat(2500);
    const chunks = chunkText(text);
    expect(chunks.every((chunk) => chunk.text.length <= 900)).toBe(true);
    expect(chunks[chunks.length - 1].start + chunks[chunks.length - 1].text.length).toBe(2500);
  });
});
