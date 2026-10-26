import {
  detectionId,
  type Detection,
  type EntityType,
  type ModelEntity,
} from './types';

const MODEL_TYPES = new Set<EntityType>(['PERSON', 'ORG', 'LOCATION', 'MISC']);
const MIN_CONFIDENCE = 0.55;

export function mergeDetections(
  text: string,
  patterns: Detection[],
  modelEntities: ModelEntity[],
): Detection[] {
  const model = mergeModelDetections(text, modelEntities);
  const withoutPatternOverlap = model.filter(
    (candidate) => !patterns.some((pattern) => overlaps(candidate, pattern)),
  );

  return [...patterns, ...withoutPatternOverlap].sort(
    (a, b) => a.start - b.start || b.end - a.end || a.type.localeCompare(b.type),
  );
}

export function mergeModelDetections(text: string, entities: ModelEntity[]): Detection[] {
  const prepared = entities
    .map((entity) => trimEntity(text, entity))
    .filter((entity): entity is ModelEntity => entity !== null)
    .filter(
      (entity) =>
        entity.confidence >= MIN_CONFIDENCE &&
        entity.end - entity.start >= 2 &&
        MODEL_TYPES.has(entity.type),
    )
    .map((entity) => ({
      ...entity,
      id: detectionId('model', entity.type, entity.start, entity.end),
      source: 'model' as const,
    }));

  prepared.sort((a, b) => a.start - b.start || b.end - a.end);

  const merged: Detection[] = [];
  for (const entity of prepared) {
    const previous = merged[merged.length - 1];
    if (!previous) {
      merged.push(entity);
      continue;
    }

    const gap = text.slice(previous.end, entity.start);
    const canMerge =
      previous.type === entity.type &&
      entity.start >= previous.start &&
      (entity.start < previous.end || gap.length === 0);

    if (canMerge) {
      const end = Math.max(previous.end, entity.end);
      const textSlice = text.slice(previous.start, end);
      const previousWeight = previous.end - previous.start;
      const entityWeight = entity.end - entity.start;
      previous.end = end;
      previous.text = textSlice;
      previous.confidence =
        (previous.confidence * previousWeight + entity.confidence * entityWeight) /
        (previousWeight + entityWeight);
      previous.id = detectionId('model', previous.type, previous.start, previous.end);
      continue;
    }

    merged.push(entity);
  }

  const accepted: Detection[] = [];
  for (const entity of merged.sort(
    (a, b) => a.start - b.start || b.end - a.end || b.confidence - a.confidence,
  )) {
    if (accepted.some((existing) => overlaps(entity, existing))) continue;
    accepted.push(entity);
  }

  return accepted;
}

function trimEntity(text: string, entity: ModelEntity): ModelEntity | null {
  let start = Math.max(0, Math.min(entity.start, text.length));
  let end = Math.max(start, Math.min(entity.end, text.length));
  if (end <= start) return null;

  const source = text.slice(start, end);
  const leading = source.length - source.trimStart().length;
  const trailing = source.length - source.trimEnd().length;
  start += leading;
  end -= trailing;
  if (end <= start) return null;

  return {
    ...entity,
    start,
    end,
    text: text.slice(start, end),
    confidence: Math.max(0, Math.min(1, entity.confidence)),
  };
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}
