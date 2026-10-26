// Smoke-test the bundled NER model in Node before relying on it in the browser.
// It must load from public/models with no network access and find real names.
import path from 'node:path';
import { env, pipeline } from '@huggingface/transformers';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = path.join(process.cwd(), 'public', 'models');

const SAMPLE =
  'Maya Chen met Daniel Okafor at Horizon Labs on 12 March 2024. She emailed daniel.okafor@horizonlabs.example about the Meridian account.';

const started = Date.now();
const ner = await pipeline('token-classification', 'onnx-community/distilbert-NER-ONNX', {
  dtype: 'q8',
});

const output = await ner(SAMPLE, { aggregation_strategy: 'simple' });
const entities = output.map((entity) => ({
  text: entity.word,
  type: entity.entity_group,
  score: Number(entity.score.toFixed(3)),
}));

console.log(JSON.stringify({ entities, ms: Date.now() - started }, null, 2));

const names = entities.filter((entity) => entity.type === 'PER').map((entity) => entity.text);
if (!names.includes('Maya Chen') || !names.includes('Daniel Okafor')) {
  console.error('FAIL: expected both personal names to be detected.');
  process.exitCode = 1;
} else {
  console.log('PASS: model loaded offline and found both people.');
}
