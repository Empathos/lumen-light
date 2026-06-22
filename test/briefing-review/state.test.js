'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createReviewState, ARTIFACT_KINDS, ARTIFACT_STATES } = require('../../src/briefing-review/state.js');

const FIXTURE_PATH = path.join(__dirname, '../../examples/briefing-session.example.json');

function loadSession() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

test('fixture artifacts use allowed kinds and start staged', () => {
  const session = loadSession();
  for (const artifact of session.artifacts) {
    assert.ok(ARTIFACT_KINDS.includes(artifact.kind), 'kind ' + artifact.kind);
    assert.ok(ARTIFACT_STATES.includes(artifact.state));
  }
  const state = createReviewState(session);
  for (const artifact of state.list()) {
    assert.equal(artifact.state, 'staged');
  }
});

test('agent cannot seed an accepted artifact', () => {
  const session = loadSession();
  session.artifacts[0].state = 'accepted'; // hostile fixture
  const state = createReviewState(session);
  assert.equal(state.get('artifact_001').state, 'staged');
});

test('accepting an artifact changes its state to accepted', () => {
  const state = createReviewState(loadSession());
  state.accept('artifact_001');
  assert.equal(state.get('artifact_001').state, 'accepted');
});

test('accept requires at least one source span reference', () => {
  const session = loadSession();
  session.artifacts[0].source_span_refs = [];
  const state = createReviewState(session);
  assert.throws(() => state.accept('artifact_001'), /source span/);
});

test('rejecting an artifact changes its state to rejected', () => {
  const state = createReviewState(loadSession());
  state.reject('artifact_002');
  assert.equal(state.get('artifact_002').state, 'rejected');
});

test('editing preserves original text and stores edited text', () => {
  const state = createReviewState(loadSession());
  const before = state.get('artifact_003');
  state.edit('artifact_003', 'Reworded by the reviewer.');
  const after = state.get('artifact_003');
  assert.equal(after.text, 'Reworded by the reviewer.');
  assert.equal(after.state, 'edited');
  assert.equal(after.original_text, before.original_text);
});

test('an edited artifact can still be accepted', () => {
  const state = createReviewState(loadSession());
  state.edit('artifact_001', 'Edited risk text.');
  state.accept('artifact_001');
  const artifact = state.get('artifact_001');
  assert.equal(artifact.state, 'accepted');
  assert.equal(artifact.text, 'Edited risk text.');
  assert.equal(artifact.original_text, 'Enterprise onboarding friction is the top blocker for expansion deals.');
});

test('default export includes accepted artifacts only', () => {
  const state = createReviewState(loadSession());
  state.accept('artifact_001');
  state.reject('artifact_002');
  // artifact_003 left staged
  const packet = state.buildPacket({ exportedAt: '2026-06-23T00:00:00.000Z' });
  assert.equal(packet.artifacts.length, 1);
  assert.equal(packet.artifacts[0].artifact_id, 'artifact_001');
  assert.equal(packet.debug, false);
});

test('every accepted exported artifact carries a source span reference', () => {
  const state = createReviewState(loadSession());
  state.accept('artifact_001');
  const packet = state.buildPacket({ exportedAt: '2026-06-23T00:00:00.000Z' });
  for (const artifact of packet.artifacts) {
    assert.ok(Array.isArray(artifact.source_span_refs) && artifact.source_span_refs.length > 0);
  }
});

test('debug export includes rejected and staged artifacts', () => {
  const state = createReviewState(loadSession());
  state.accept('artifact_001');
  state.reject('artifact_002');
  const packet = state.buildPacket({ exportedAt: '2026-06-23T00:00:00.000Z', debug: true });
  assert.equal(packet.artifacts.length, 3);
  assert.equal(packet.debug, true);
});

test('packet generation is deterministic except for exported_at', () => {
  const a = createReviewState(loadSession());
  const b = createReviewState(loadSession());
  a.accept('artifact_001');
  b.accept('artifact_001');
  const packetA = a.buildPacket({ exportedAt: 'T1' });
  const packetB = b.buildPacket({ exportedAt: 'T2' });
  packetA.exported_at = 'X';
  packetB.exported_at = 'X';
  assert.deepEqual(packetA, packetB);
});

test('packet carries source identity', () => {
  const state = createReviewState(loadSession());
  const packet = state.buildPacket({ exportedAt: 'T' });
  assert.equal(packet.source.document_id, 'doc_001');
  assert.equal(packet.source.title, 'Strategy excerpt');
  assert.equal(packet.session_id, 'briefing_session_001');
});
