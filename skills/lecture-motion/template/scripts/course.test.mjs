import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCourse, toSrt } from './course.mjs';

const example = async name => JSON.parse(await readFile(new URL('../examples/' + name + '.json', import.meta.url), 'utf8'));

test('both sample scripts compose through the same timing input', async () => {
  const attention = buildCourse(await example('attention'));
  const pipeline = buildCourse(await example('pipeline'));
  assert.equal(attention.duration, 36000);
  assert.equal(pipeline.duration, 27500);
  assert.equal(pipeline.shots[2].start, 13500);
  assert.match(toSrt(pipeline.cues), /00:00:09,900 --> 00:00:13,500/);
});

test('invalid motions and overlapping caption starts cannot replace the loaded draft', async () => {
  const config = await example('attention');
  config.shots[4].params.weights = [0, 0];
  assert.throws(() => buildCourse(config), /动效参数/);
  const other = await example('pipeline');
  other.shots[1].captions[1].at = 0;
  assert.throws(() => buildCourse(other), /递增/);
});
