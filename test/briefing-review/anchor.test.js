'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { anchorSpan, anchorSpans } = require('../../src/briefing-review/source-pane.js');

const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../examples/briefing-session.example.json'), 'utf8')
);
const SOURCE = FIXTURE.source.text;

test('anchors an exact unique span', () => {
  const result = anchorSpan(SOURCE, { exact: 'cut onboarding to two weeks by Q3' });
  assert.equal(result.ok, true);
  assert.equal(SOURCE.slice(result.start, result.end), 'cut onboarding to two weeks by Q3');
});

test('disambiguates repeated text using prefix/suffix', () => {
  // "onboarding" occurs several times; context selects the intended occurrence.
  const span = { exact: 'onboarding', prefix: 'cut ', suffix: ' to two weeks' };
  const result = anchorSpan(SOURCE, span);
  assert.equal(result.ok, true);
  assert.equal(SOURCE.slice(result.start, result.end), 'onboarding');
  // It must resolve the "cut onboarding to two weeks" occurrence, not the first.
  assert.equal(result.start, SOURCE.indexOf('cut onboarding to two weeks') + 'cut '.length);
  assert.ok(result.start > SOURCE.indexOf('onboarding'));
});

test('skips a span whose exact text is missing instead of mis-anchoring', () => {
  const result = anchorSpan(SOURCE, { exact: 'a sentence that no longer exists in this source' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'not-found');
});

test('skips an ambiguous span that has no usable context', () => {
  const result = anchorSpan(SOURCE, { exact: 'onboarding' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ambiguous');
});

test('requires exact text', () => {
  assert.equal(anchorSpan(SOURCE, {}).ok, false);
  assert.equal(anchorSpan(SOURCE, { exact: '' }).reason, 'missing-exact');
});

test('falls back to a strict unique match when context is stale', () => {
  const result = anchorSpan(SOURCE, {
    exact: 'cut onboarding to two weeks by Q3',
    prefix: 'context that no longer matches ',
    suffix: ' nope',
  });
  assert.equal(result.ok, true);
  assert.equal(SOURCE.slice(result.start, result.end), 'cut onboarding to two weeks by Q3');
});

test('anchorSpans partitions fixture spans into anchored and skipped', () => {
  const { anchored, skipped } = anchorSpans(SOURCE, FIXTURE.spans);
  const anchoredIds = anchored.map((a) => a.span_id);
  assert.deepEqual(anchoredIds, ['span_001', 'span_002', 'span_003']); // sorted by position
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].span_id, 'span_stale');
  assert.equal(skipped[0].reason, 'not-found');
});

test('anchored offsets are returned in document order', () => {
  const { anchored } = anchorSpans(SOURCE, FIXTURE.spans);
  for (let i = 1; i < anchored.length; i++) {
    assert.ok(anchored[i].start >= anchored[i - 1].end);
  }
});
