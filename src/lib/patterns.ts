import { luhnValid } from './luhn';
import { detectionId, type Detection, type EntityType } from './types';

interface PatternRule {
  type: EntityType | 'CARD';
  pattern: RegExp;
  confidence: number;
  priority: number;
  group?: number;
  validate?: (value: string) => boolean;
  trim?: (value: string) => string;
}

const trimUrl = (value: string) => {
  let end = value.length;
  while (end > 0 && /[.,;:!?]/.test(value[end - 1])) end -= 1;
  while (end > 0 && value[end - 1] === ')' && count(value.slice(0, end), ')') > count(value.slice(0, end), '(')) {
    end -= 1;
  }
  return value.slice(0, end);
};

function count(value: string, character: string): number {
  return value.split(character).length - 1;
}

const RULES: PatternRule[] = [
  {
    type: 'EMAIL',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    confidence: 0.99,
    priority: 100,
  },
  {
    type: 'URL',
    pattern: /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi,
    confidence: 0.97,
    priority: 96,
    trim: trimUrl,
  },
  {
    type: 'CARD',
    pattern: /\b\d(?:[ -]?\d){12,18}\b/g,
    confidence: 0.98,
    priority: 94,
    validate: (value) => luhnValid(value),
  },
  {
    type: 'ID',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    confidence: 0.98,
    priority: 92,
  },
  {
    type: 'ID',
    pattern: /\b[A-Z]{2,6}-\d{2,6}\b/g,
    confidence: 0.88,
    priority: 82,
  },
  {
    type: 'ID',
    pattern: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30}\b/g,
    confidence: 0.94,
    priority: 90,
    validate: (value) => {
      const compact = value.replace(/\s/g, '');
      return compact.length >= 15 && compact.length <= 34;
    },
  },
  {
    type: 'ADDRESS',
    pattern:
      /\b\d{1,5}\s+(?:[A-Za-z0-9.'-]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl)\b\.?(?:,\s*[A-Za-z][A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)?/gi,
    confidence: 0.9,
    priority: 86,
  },
  {
    type: 'ID',
    pattern:
      /\b(?:account|acct|policy|employee\s+id|invoice|reference|case)\b(?:\s+(?:number|no\.?|#))?\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{5,})/gi,
    confidence: 0.91,
    priority: 84,
    group: 1,
    validate: (value) => /\d/.test(value) && /^[A-Z0-9][A-Z0-9-]+$/i.test(value),
  },
  {
    type: 'MONEY',
    pattern: /[$€£]\s?\d(?:[\d,]*\d)?(?:\.\d{2})?/g,
    confidence: 0.93,
    priority: 80,
  },
  {
    type: 'PHONE',
    pattern: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    confidence: 0.92,
    priority: 76,
  },
];

// The card rule uses a pseudo-type so Luhn-valid numbers are labelled as an
// identifier, matching the product's vocabulary.
const normalizeRuleType = (type: EntityType | 'CARD'): EntityType => (type === 'CARD' ? 'ID' : type);

interface Candidate extends Detection {
  priority: number;
}

export function findPatternDetections(text: string): Detection[] {
  const candidates: Candidate[] = [];

  for (const rule of RULES) {
    const flags = rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`;
    const expression = new RegExp(rule.pattern.source, flags);
    let match: RegExpExecArray | null;

    while ((match = expression.exec(text)) !== null) {
      if (match[0] === '') {
        expression.lastIndex += 1;
        continue;
      }

      const group = rule.group ?? 0;
      const rawValue = match[group];
      if (!rawValue) continue;

      let value = rawValue;
      if (rule.trim) value = rule.trim(value);
      if (!value) continue;
      if (rule.validate && !rule.validate(value)) continue;

      const offsetInMatch = group === 0 ? 0 : match[0].indexOf(value);
      if (offsetInMatch < 0) continue;
      const start = match.index + offsetInMatch;
      const end = start + value.length;
      const type = normalizeRuleType(rule.type);

      candidates.push({
        id: detectionId('pattern', type, start, end),
        start,
        end,
        text: text.slice(start, end),
        type,
        source: 'pattern',
        confidence: rule.confidence,
        priority: rule.priority,
      });
    }
  }

  candidates.sort(
    (a, b) =>
      b.priority - a.priority ||
      a.start - b.start ||
      b.end - b.start - (a.end - a.start),
  );

  const accepted: Candidate[] = [];
  for (const candidate of candidates) {
    if (accepted.some((existing) => overlaps(candidate, existing))) continue;
    accepted.push(candidate);
  }

  return accepted
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .map(({ priority: _priority, ...detection }) => detection);
}

function overlaps(a: Detection, b: Detection): boolean {
  return a.start < b.end && b.start < a.end;
}
