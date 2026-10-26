export const CHAR_LIMIT = 20_000;

export type EntityType =
  | 'PERSON'
  | 'ORG'
  | 'LOCATION'
  | 'MISC'
  | 'EMAIL'
  | 'PHONE'
  | 'ID'
  | 'MONEY'
  | 'ADDRESS'
  | 'URL'
  | 'CUSTOM';

export type DetectionSource = 'model' | 'pattern' | 'custom';

export interface Detection {
  id: string;
  start: number;
  end: number;
  text: string;
  type: EntityType;
  source: DetectionSource;
  confidence: number;
}

export interface CastEntry {
  key: string;
  display: string;
  type: EntityType;
  token: string;
  accepted: boolean;
  source: DetectionSource;
  confidence: number;
  mentions: Detection[];
}

export interface Leak {
  kind: 'pattern' | 'original' | 'orphanToken';
  text: string;
  type?: EntityType;
  message: string;
}

export interface SafeSnapshot {
  text: string;
  cast: CastEntry[];
  leaks: Leak[];
  checkedAt: number;
  unprotected: boolean;
  replacedMentions: number;
}

export interface RestoreReport {
  restored: number;
  unknown: string[];
  totalTokens: number;
}

export type Step = 'prepare' | 'safe' | 'restore';

export type ScanPhase =
  | 'idle'
  | 'chunking'
  | 'patterns'
  | 'model-loading'
  | 'model-scanning'
  | 'merging'
  | 'done'
  | 'error';

export type ModelStatus = 'unknown' | 'loading' | 'ready' | 'fallback';

export interface ModelEntity {
  start: number;
  end: number;
  text: string;
  type: EntityType;
  confidence: number;
}

export interface ScanChunk {
  text: string;
  start: number;
}

export interface ScanEvent {
  phase: 'loading' | 'ready' | 'scanning';
  progress?: number;
  detail?: string;
}

export type ModelDetector = (
  chunks: ScanChunk[],
  onEvent?: (event: ScanEvent) => void,
) => Promise<ModelEntity[]>;

export interface NerWorkerRequest {
  type: 'scan';
  requestId: number;
  chunks: ScanChunk[];
}

export type NerWorkerResponse =
  | { type: 'status'; requestId: number; phase: 'loading' | 'ready' | 'scanning'; progress?: number }
  | { type: 'result'; requestId: number; entities: ModelEntity[] }
  | { type: 'error'; requestId: number; message: string };

export interface RestoredSegment {
  kind: 'plain' | 'restored' | 'unknown';
  text: string;
  type?: EntityType;
  token?: string;
}

export type DialogState =
  | null
  | { kind: 'edit' }
  | { kind: 'reset' }
  | { kind: 'replace-sample' }
  | { kind: 'replace-text'; text: string; label: string };

export interface ToastMessage {
  id: number;
  tone: 'success' | 'error';
  message: string;
}

export const ENTITY_TYPES: EntityType[] = [
  'PERSON',
  'ORG',
  'LOCATION',
  'MISC',
  'EMAIL',
  'PHONE',
  'ID',
  'MONEY',
  'ADDRESS',
  'URL',
  'CUSTOM',
];

export const TYPE_LABELS: Record<EntityType, string> = {
  PERSON: 'Person',
  ORG: 'Organization',
  LOCATION: 'Location',
  MISC: 'Other name',
  EMAIL: 'Email',
  PHONE: 'Phone',
  ID: 'Identifier',
  MONEY: 'Money',
  ADDRESS: 'Address',
  URL: 'Link',
  CUSTOM: 'Custom term',
};

const TYPE_RANK = Object.fromEntries(ENTITY_TYPES.map((type, index) => [type, index])) as Record<
  EntityType,
  number
>;

export function compareTypes(a: EntityType, b: EntityType): number {
  return TYPE_RANK[a] - TYPE_RANK[b];
}

export function normalizeEntityText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function detectionId(
  source: DetectionSource,
  type: EntityType,
  start: number,
  end: number,
): string {
  return `${source}:${type}:${start}:${end}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
