/**
 * Lumen Light: briefing-review source pane anchoring + rendering.
 *
 * The anchoring core (`anchorSpan` / `anchorSpans`) is pure and DOM-free so it
 * can be unit tested under the Node test runner. The rendering helpers
 * (`renderSource`, `setActiveSpan`) are thin DOM wrappers used by the browser
 * demo controller and are skipped when there is no `document`.
 *
 * Anchoring rule (see the overnight build spec): a span that cannot be placed
 * unambiguously is reported as skipped rather than highlighting the wrong text.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LumenSourcePane = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Resolve a single span against plain source text.
   * Returns { ok: true, start, end } or { ok: false, reason }.
   *
   * Strategy:
   *   1. If prefix/suffix context is supplied, require the full
   *      prefix+exact+suffix needle so repeated text is disambiguated.
   *   2. Otherwise accept a unique `exact` match.
   *   3. A repeated `exact` with no usable context is ambiguous -> skip.
   */
  function anchorSpan(text, span) {
    if (typeof text !== 'string') return fail('no-source-text');
    if (!span || typeof span.exact !== 'string' || span.exact.length === 0) {
      return fail('missing-exact');
    }

    const exact = span.exact;
    const prefix = typeof span.prefix === 'string' ? span.prefix : '';
    const suffix = typeof span.suffix === 'string' ? span.suffix : '';

    if (prefix || suffix) {
      const needle = prefix + exact + suffix;
      const ctxIndex = text.indexOf(needle);
      if (ctxIndex !== -1) {
        const start = ctxIndex + prefix.length;
        return ok(start, start + exact.length);
      }
      // Context was provided but did not match. Fall through to a strict unique
      // match so a stale prefix/suffix never silently mis-anchors.
    }

    const first = text.indexOf(exact);
    if (first === -1) return fail('not-found');

    const second = text.indexOf(exact, first + 1);
    if (second !== -1) return fail('ambiguous');

    return ok(first, first + exact.length);
  }

  /**
   * Resolve a list of spans, partitioning into anchored (with offsets, sorted
   * by start) and skipped (with a reason).
   */
  function anchorSpans(text, spans) {
    const anchored = [];
    const skipped = [];

    for (const span of spans || []) {
      const result = anchorSpan(text, span);
      if (result.ok) {
        anchored.push({ span_id: span.span_id, start: result.start, end: result.end, span: span });
      } else {
        skipped.push({ span_id: span && span.span_id, reason: result.reason });
      }
    }

    anchored.sort((a, b) => a.start - b.start);
    return { anchored, skipped };
  }

  function ok(start, end) {
    return { ok: true, start, end };
  }

  function fail(reason) {
    return { ok: false, reason };
  }

  // --- Browser-only rendering -------------------------------------------------

  /**
   * Render source text into `container`, wrapping anchored spans in
   * <mark data-span-id="..."> elements. Returns the skipped-span report so the
   * caller can surface unanchored spans visibly or in debug output.
   */
  function renderSource(container, text, spans) {
    if (typeof document === 'undefined' || !container) {
      return { anchored: [], skipped: [] };
    }

    const { anchored, skipped } = anchorSpans(text, spans);
    container.textContent = '';

    let cursor = 0;
    for (const hit of anchored) {
      if (hit.start < cursor) continue; // overlapping span; keep earlier one
      if (hit.start > cursor) {
        container.appendChild(document.createTextNode(text.slice(cursor, hit.start)));
      }
      const mark = document.createElement('mark');
      mark.className = 'lumen-span';
      mark.dataset.spanId = hit.span_id;
      mark.textContent = text.slice(hit.start, hit.end);
      container.appendChild(mark);
      cursor = hit.end;
    }
    if (cursor < text.length) {
      container.appendChild(document.createTextNode(text.slice(cursor)));
    }

    return { anchored, skipped };
  }

  /**
   * Set the active highlight in a rendered source pane and scroll it into view.
   * Passing a falsy spanId clears the active state.
   */
  function setActiveSpan(container, spanId) {
    if (typeof document === 'undefined' || !container) return null;
    let active = null;
    for (const mark of container.querySelectorAll('mark.lumen-span')) {
      const isActive = Boolean(spanId) && mark.dataset.spanId === spanId;
      mark.classList.toggle('lumen-span-active', isActive);
      if (isActive) active = mark;
    }
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return active;
  }

  return {
    anchorSpan,
    anchorSpans,
    renderSource,
    setActiveSpan,
  };
}));
