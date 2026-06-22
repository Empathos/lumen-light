/**
 * Lumen Light: briefing-review artifact state machine and export packet builder.
 *
 * This module is the durable-state core of the assistant/operator-controlled
 * briefing review demo. It is deterministic and DOM-free so it can run under
 * the Node test runner and inside the browser demo controller alike.
 *
 * Product rules encoded here (see the overnight build spec):
 *   - Agent-proposed artifacts start as `staged`.
 *   - Only user action produces `accepted` artifacts.
 *   - Every accepted artifact must keep at least one source span reference.
 *   - Editing preserves the original agent-proposed text.
 *   - Default export includes accepted artifacts only.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LumenBriefingState = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ARTIFACT_KINDS = ['claim', 'decision', 'question', 'risk', 'action', 'insight'];
  const ARTIFACT_STATES = ['staged', 'accepted', 'rejected', 'edited'];

  /**
   * Build a review state store from a briefing session fixture.
   * Artifacts are cloned so the original fixture is never mutated.
   */
  function createReviewState(session) {
    if (!session || typeof session !== 'object') {
      throw new Error('createReviewState requires a session object');
    }

    const sessionId = session.session_id || 'briefing_session';
    const source = session.source || {};
    const artifacts = (session.artifacts || []).map(normalizeArtifact);
    const byId = new Map(artifacts.map((a) => [a.artifact_id, a]));

    function get(artifactId) {
      const artifact = byId.get(artifactId);
      if (!artifact) throw new Error('unknown artifact: ' + artifactId);
      return artifact;
    }

    function accept(artifactId) {
      const artifact = get(artifactId);
      if (!Array.isArray(artifact.source_span_refs) || artifact.source_span_refs.length === 0) {
        throw new Error('cannot accept artifact without a source span reference: ' + artifactId);
      }
      artifact.state = 'accepted';
      return artifact;
    }

    function reject(artifactId) {
      const artifact = get(artifactId);
      artifact.state = 'rejected';
      return artifact;
    }

    function edit(artifactId, nextText) {
      const artifact = get(artifactId);
      if (typeof nextText !== 'string' || nextText.length === 0) {
        throw new Error('edit requires non-empty text: ' + artifactId);
      }
      if (typeof artifact.original_text !== 'string') {
        artifact.original_text = artifact.text;
      }
      artifact.text = nextText;
      artifact.state = 'edited';
      return artifact;
    }

    return {
      sessionId,
      source,
      list() {
        return artifacts.map((a) => Object.assign({}, a));
      },
      get(artifactId) {
        return Object.assign({}, get(artifactId));
      },
      accept,
      reject,
      edit,
      /**
       * Build a deterministic export packet.
       * Default export carries accepted artifacts only; debug carries all.
       * `exportedAt` is injected so callers control the one non-deterministic
       * field (tests pass a fixed value; the browser passes the current time).
       */
      buildPacket(options) {
        const opts = options || {};
        const debug = Boolean(opts.debug);
        const selected = debug ? artifacts : artifacts.filter((a) => a.state === 'accepted');
        return {
          packet_id: 'packet_' + sessionId,
          session_id: sessionId,
          exported_at: opts.exportedAt || null,
          debug: debug,
          source: {
            document_id: source.document_id || null,
            title: source.title || null,
          },
          artifacts: selected.map((a) => Object.assign({}, a)),
        };
      },
    };
  }

  function normalizeArtifact(raw) {
    const artifact = Object.assign({}, raw);
    // Agent-proposed artifacts may only enter the surface as staged. A fixture
    // that asserts a stronger state is downgraded so the agent can never seed
    // an accepted artifact.
    if (artifact.state !== 'staged') {
      artifact.state = 'staged';
    }
    return artifact;
  }

  return {
    ARTIFACT_KINDS,
    ARTIFACT_STATES,
    createReviewState,
  };
}));
