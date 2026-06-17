/**
 * Lumen Light: browser text highlights for static HTML.
 *
 * Drop this file into a page with:
 *   <script src="../src/static-highlighter/lumen-light.js"></script>
 *
 * Manual highlights are gold. API-created partner highlights are purple.
 * Highlights persist in localStorage and can be exported with window.lumen.export().
 */
(function () {
  'use strict';

  const STORAGE_PREFIX = 'lumen:';
  const STORAGE_KEY = STORAGE_PREFIX + window.location.pathname;
  const CONTEXT_LEN = 32;
  const PRIMARY_CLASS = 'lumen-mark';
  const PARTNER_CLASS = 'lumen-partner';

  injectStyles();
  restoreAll();

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('click', handleHighlightClick);

  window.lumen = {
    version: '1.0.0',
    highlight: highlightPartnerText,
    export: exportHighlights,
    clear: clearHighlights,
  };

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = [
      'mark.' + PRIMARY_CLASS + ' {',
      '  background: rgba(255, 191, 64, 0.32);',
      '  border-bottom: 1px solid rgba(255, 191, 64, 0.68);',
      '  color: inherit;',
      '  border-radius: 2px;',
      '  padding: 0 1px;',
      '  cursor: pointer;',
      '  -webkit-print-color-adjust: exact;',
      '}',
      'mark.' + PRIMARY_CLASS + ':hover {',
      '  background: rgba(255, 191, 64, 0.52);',
      '}',
      'mark.' + PARTNER_CLASS + ' {',
      '  background: rgba(184, 112, 255, 0.24);',
      '  border-bottom: 1px solid rgba(184, 112, 255, 0.62);',
      '  color: inherit;',
      '  border-radius: 2px;',
      '  padding: 0 1px;',
      '  cursor: pointer;',
      '  -webkit-print-color-adjust: exact;',
      '}',
      'mark.' + PARTNER_CLASS + ':hover {',
      '  background: rgba(184, 112, 255, 0.42);',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function handleSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const exact = selection.toString().trim();
    if (!exact || isInsideHighlight(range)) return;

    const context = getContextForText(exact);
    const id = makeId();
    if (!wrapRange(range, id, 'primary')) return;

    selection.removeAllRanges();
    saveHighlight({
      id,
      exact,
      prefix: context.prefix,
      suffix: context.suffix,
      timestamp: Date.now(),
      page: window.location.pathname,
      author: 'primary',
    });
  }

  function handleHighlightClick(event) {
    const mark = event.target.closest('.' + PRIMARY_CLASS + ', .' + PARTNER_CLASS);
    if (!mark) return;

    const id = mark.dataset.lumenId;
    unwrapMark(mark);
    save(load().filter((highlight) => highlight.id !== id));
  }

  function highlightPartnerText(exact) {
    if (!exact || typeof exact !== 'string') {
      return { ok: false, reason: 'text is required' };
    }

    const range = findRange({ exact, prefix: '', suffix: '' });
    if (!range) return { ok: false, reason: 'text not found' };

    const context = getContextForText(exact);
    const id = makeId();
    if (!wrapRange(range, id, 'partner')) {
      return { ok: false, reason: 'range wrap failed' };
    }

    const mark = document.querySelector('[data-lumen-id="' + id + '"]');
    if (mark) mark.scrollIntoView({ behavior: 'smooth', block: 'center' });

    saveHighlight({
      id,
      exact,
      prefix: context.prefix,
      suffix: context.suffix,
      timestamp: Date.now(),
      page: window.location.pathname,
      author: 'partner',
    });

    return { ok: true, id, scrolled: Boolean(mark) };
  }

  function restoreAll() {
    const highlights = load();
    let restored = 0;
    let skipped = 0;

    for (const highlight of highlights) {
      const range = findRange(highlight);
      if (range && wrapRange(range, highlight.id, highlight.author)) {
        restored++;
      } else {
        skipped++;
      }
    }

    if (restored || skipped) {
      console.info('[lumen] restored ' + restored + ', skipped ' + skipped);
    }
  }

  function exportHighlights() {
    const all = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;

      try {
        all.push(...JSON.parse(localStorage.getItem(key)));
      } catch (error) {
        console.warn('[lumen] skipped malformed store:', key, error);
      }
    }
    return dedup(all).sort((a, b) => a.timestamp - b.timestamp);
  }

  function clearHighlights() {
    for (const mark of document.querySelectorAll('.' + PRIMARY_CLASS + ', .' + PARTNER_CLASS)) {
      unwrapMark(mark);
    }
    localStorage.removeItem(STORAGE_KEY);
    return { ok: true };
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
      console.warn('[lumen] failed to load highlights:', error);
      return [];
    }
  }

  function save(highlights) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dedup(highlights)));
  }

  function saveHighlight(highlight) {
    const highlights = load();
    highlights.push(highlight);
    save(highlights);
  }

  function dedup(highlights) {
    const seen = new Set();
    return highlights.filter((highlight) => {
      const key = [
        highlight.exact,
        highlight.prefix || '',
        highlight.suffix || '',
        highlight.author || 'primary',
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function makeId() {
    return 'lumen-' + Date.now() + '-' + Math.floor(Math.random() * 90 + 10);
  }

  function isInsideHighlight(range) {
    const node = range.commonAncestorContainer;
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return Boolean(element && element.closest('.' + PRIMARY_CLASS + ', .' + PARTNER_CLASS));
  }

  function getContextForText(exact) {
    const body = document.body.innerText;
    const index = body.indexOf(exact);
    if (index === -1) return { prefix: '', suffix: '' };

    return {
      prefix: body.slice(Math.max(0, index - CONTEXT_LEN), index),
      suffix: body.slice(index + exact.length, index + exact.length + CONTEXT_LEN),
    };
  }

  function findRange(highlight) {
    const nodes = collectTextNodes();
    const buffer = nodes.map((entry) => entry.node.textContent).join('');
    const exact = highlight.exact;

    let index = -1;
    if (highlight.prefix || highlight.suffix) {
      const needle = (highlight.prefix || '') + exact + (highlight.suffix || '');
      const contextIndex = buffer.indexOf(needle);
      if (contextIndex !== -1) index = contextIndex + (highlight.prefix || '').length;
    }

    if (index === -1) index = buffer.indexOf(exact);
    if (index === -1) return null;

    return buildRange(nodes, index, index + exact.length);
  }

  function collectTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let offset = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (parent && parent.closest('.' + PRIMARY_CLASS + ', .' + PARTNER_CLASS)) continue;
      nodes.push({ node, start: offset });
      offset += node.textContent.length;
    }

    return nodes;
  }

  function buildRange(nodes, start, end) {
    const range = document.createRange();
    let hasStart = false;

    for (const entry of nodes) {
      const nodeEnd = entry.start + entry.node.textContent.length;

      if (!hasStart && entry.start <= start && start < nodeEnd) {
        range.setStart(entry.node, start - entry.start);
        hasStart = true;
      }

      if (hasStart && entry.start < end && end <= nodeEnd) {
        range.setEnd(entry.node, end - entry.start);
        return range;
      }
    }

    return null;
  }

  function wrapRange(range, id, author) {
    const mark = document.createElement('mark');
    mark.className = author === 'partner' ? PARTNER_CLASS : PRIMARY_CLASS;
    mark.dataset.lumenId = id;
    mark.dataset.lumenAuthor = author || 'primary';

    try {
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
      return true;
    } catch (error) {
      console.warn('[lumen] wrap failed:', error);
      return false;
    }
  }

  function unwrapMark(mark) {
    const parent = mark.parentNode;
    if (!parent) return;

    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }
}());
