/* NDS Colour Explorer: read-only analysis of the NDS colour variables.
   Vanilla JS, no dependencies. Data: window.NDS_TOKENS (data/nds-colour-tokens.js)
   or data/nds-colour-tokens.json when served over http. */
(function () {
  'use strict';

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  };
  const KEYS = { audit: 'nds-colour-explorer.audit.v1', pairing: 'nds-colour-explorer.pairing.v1', view: 'nds-colour-explorer.view.v1', author: 'nds-colour-explorer.author.v1' };
  const D = window.NDSDiscussions;
  const ICON_COMMENT = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7l-3 2.5V10.5a2 2 0 0 1-1.5-2z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  // Comment indicator button. Shows open count; grey when everything is resolved; faint when empty.
  function cmtButton(attrs, list, label) {
    const c = D.counts(list);
    const cls = c.open ? 'has-open' : c.total ? 'has-resolved' : 'empty';
    const tip = c.total ? `${c.open} open, ${c.total - c.open} resolved discussion(s)` : 'Add a comment';
    return `<button type="button" class="cmt ${cls}" ${attrs} title="${esc(tip)}" aria-label="${esc(label)}: ${esc(tip)}">${ICON_COMMENT}${c.total ? `<span>${c.open || c.total}</span>` : ''}</button>`;
  }
  const MATRIX_ORDER = ['ftn-dark', 'ftn-light', 'cp-dark', 'cp-light', 'psk-dark', 'psk-light'];
  const LOBBET = 'lobbet';

  function swatch(val, size = 'md', title) {
    if (!val || val.error) return `<span class="sw sw-${size}" title="${esc(val?.error || 'Unresolved')}"><i style="background:repeating-linear-gradient(45deg,#fff 0 4px,#f3c1bd 4px 8px)"></i></span>`;
    return `<span class="sw sw-${size}" title="${esc(title || val.css)}"><i style="background:${esc(val.css)}"></i></span>`;
  }
  function valText(val) {
    if (!val) return '<span class="err">Unresolved</span>';
    if (val.error) return `<span class="err" title="${esc(val.error)}">Unresolved</span>`;
    return `<span class="val">${esc(val.hex)}${val.alpha < 1 ? ` <span class="muted">${Math.round(val.alpha * 1000) / 10}%</span>` : ''}</span>`;
  }
  const plainVal = (val) => (!val || val.error ? 'UNRESOLVED' : val.alpha < 1 ? `${val.hex} @ ${Math.round(val.alpha * 1000) / 10}%` : val.hex);

  // ---------- Data ----------
  let DATA, VARS, BY_NAME, BY_ID, CONTEXTS, CTX;

  function load() {
    if (window.NDS_TOKENS) return Promise.resolve(window.NDS_TOKENS);
    return fetch('data/nds-colour-tokens.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  load().then((data) => {
    DATA = data;
    VARS = data.variables;
    BY_NAME = new Map(VARS.map((v) => [v.name, v]));
    BY_ID = new Map(VARS.map((v) => [v.id, v]));
    CONTEXTS = data.meta.contexts;
    CTX = new Map(CONTEXTS.map((c) => [c.id, c]));
    init();
  }).catch((e) => {
    $('#source-line').innerHTML = `<span class="err">Could not load data (${esc(e.message)}). Run <code>node tools/build-data.mjs</code>, or open via <code>python3 -m http.server</code>.</span>`;
  });

  // Value of a variable in a brand/theme context (Base has a single mode).
  function valueIn(v, ctxId) {
    return v.collection === 'Base' ? v.resolvedByMode[v.modes[0]] : v.resolvedByContext[ctxId];
  }
  // Own-collection mode used by a context.
  function modeIn(v, ctxId) {
    const c = CTX.get(ctxId);
    return v.collection === 'Base' ? v.modes[0] : v.collection === 'Theme' ? c.theme : c.brand;
  }
  function directAlias(v, mode) {
    const raw = v.values[mode];
    if (!raw) return '<span class="err">missing</span>';
    if (raw.type === 'alias') return `<span class="mono">→ ${esc(raw.name)}</span>`;
    if (raw.type === 'colour') return '<span class="muted">Literal</span>';
    return '<span class="err">missing</span>';
  }

  // ---------- Init ----------
  function init() {
    const m = DATA.meta;
    const when = new Date(m.exportedAt);
    $('#source-line').innerHTML =
      `Source: <a href="${esc(m.source.url)}" target="_blank" rel="noopener">${esc(m.source.fileName)}</a> ` +
      `<span class="muted">(${esc(m.source.fileKey)})</span> · exported ${esc(when.toISOString().replace('T', ' ').slice(0, 16))} UTC · ` +
      `${m.counts.total} colour variables (Base ${m.counts.Base}, Theme ${m.counts.Theme}, Brand ${m.counts.Brand})`;
    $('#source-line').title = $('#source-line').textContent;
    if (m.problems?.length) {
      const b = $('#data-problems');
      b.hidden = false;
      b.innerHTML = `<strong>${m.problems.length} value(s) could not be resolved.</strong> They are flagged in the tables, not guessed.<br>${m.problems.map(esc).join('<br>')}`;
    }
    // Token option lists
    const all = VARS.map((v) => `<option value="${esc(v.name)}">${esc(v.collection)}</option>`).join('');
    $('#token-options').innerHTML = all;
    const sem = document.createElement('datalist');
    sem.id = 'semantic-options';
    sem.innerHTML = VARS.filter((v) => v.collection !== 'Base').map((v) => `<option value="${esc(v.name)}">${esc(v.collection)}</option>`).join('');
    document.body.appendChild(sem);
    ['#pl-bg', '#pl-fg', '#pl-alt'].forEach((s) => $(s).setAttribute('list', 'semantic-options'));

    initTabs();
    initExplorer();
    initMatrix();
    initPairing();
    initAudit();
    initPrint();
    initDiscussions();
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('#popover').hidden) return hidePopover();
      if (!$('#discussion').hidden && !e.target.closest('textarea, input')) closeDiscussion();
    });
    // The popover is anchored to a cell; close it when anything scrolls so it never floats away from its cell.
    document.addEventListener('scroll', (e) => { if (!$('#popover').contains(e.target)) hidePopover(); }, true);
    window.addEventListener('resize', hidePopover);
    document.addEventListener('click', (e) => { if (!e.target.closest('#popover') && !e.target.closest('.cell button')) hidePopover(); });
  }

  // ---------- Tabs ----------
  function showView(name) {
    $$('.tabs [role=tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === name)));
    $$('.view').forEach((v) => { v.hidden = v.id !== `view-${name}`; });
    store.set(KEYS.view, name);
    if (location.hash !== `#${name}`) history.replaceState(null, '', `#${name}`);
    hidePopover();
  }
  function initTabs() {
    const tabs = $$('.tabs [role=tab]');
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => showView(t.dataset.view));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); showView(next.dataset.view);
      });
    });
    const initial = location.hash.slice(1) || store.get(KEYS.view, 'explorer');
    showView(['explorer', 'matrix', 'pairing', 'audit'].includes(initial) ? initial : 'explorer');
  }

  // ---------- View 1: Explorer ----------
  const ex = { collection: 'all', group: '', search: '', ctx: 'ftn-dark', selected: null, unresolved: false };

  function initExplorer() {
    $('#ex-context').innerHTML = CONTEXTS.map((c) => `<option value="${c.id}">${esc(c.label)}${c.note ? ' (Theme Dark)' : ''}</option>`).join('');
    $('#ex-context').addEventListener('change', (e) => { ex.ctx = e.target.value; renderExplorer(); });
    $('#ex-search').addEventListener('input', (e) => { ex.search = e.target.value.trim().toLowerCase(); renderExplorer(); });
    $('#ex-allmodes').addEventListener('change', renderExplorer);
    $('#ex-unresolved').addEventListener('change', (e) => { ex.unresolved = e.target.checked; renderExplorer(); });
    renderCollections();
    renderExplorer();
  }
  function renderCollections() {
    const cols = [['all', 'All collections', VARS.length], ...['Base', 'Theme', 'Brand'].map((c) => [c, c, VARS.filter((v) => v.collection === c).length])];
    $('#collection-list').innerHTML = cols.map(([id, label, n]) =>
      `<li><button type="button" data-col="${id}" aria-pressed="${ex.collection === id}"><span>${esc(label)}</span><span class="n">${n}</span></button></li>`).join('');
    $$('#collection-list button').forEach((b) => b.addEventListener('click', () => { ex.collection = b.dataset.col; ex.group = ''; renderCollections(); renderExplorer(); }));
    const inCol = VARS.filter((v) => ex.collection === 'all' || v.collection === ex.collection);
    const groups = [...new Set(inCol.map((v) => v.group))].sort();
    $('#group-list').innerHTML = [`<li><button type="button" data-group="" aria-pressed="${ex.group === ''}"><span>All groups</span><span class="n">${inCol.length}</span></button></li>`]
      .concat(groups.map((g) => `<li><button type="button" data-group="${esc(g)}" aria-pressed="${ex.group === g}"><span class="mono">${esc(g)}</span><span class="n">${inCol.filter((v) => v.group === g).length}</span></button></li>`)).join('');
    $$('#group-list button').forEach((b) => b.addEventListener('click', () => { ex.group = b.dataset.group; renderCollections(); renderExplorer(); }));
  }
  function matchesSearch(v, q) {
    if (!q) return true;
    if (v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)) return true;
    for (const m of v.modes) {
      const r = v.resolvedByMode[m]; const raw = v.values[m];
      if (r && !r.error && r.hex.toLowerCase().includes(q.replace(/^#?/, '#'))) return true;
      if (raw?.type === 'alias' && raw.name.toLowerCase().includes(q)) return true;
    }
    return false;
  }
  function explorerRows() {
    return VARS.filter((v) => (ex.collection === 'all' || v.collection === ex.collection) && (!ex.group || v.group === ex.group) && matchesSearch(v, ex.search)
      && (!ex.unresolved || D.counts(D.involving(v.id)).open > 0));
  }
  function renderExplorer() {
    const rows = explorerRows();
    const strip = $('#ex-allmodes').checked;
    $('#ex-count').textContent = `${rows.length} of ${VARS.length} tokens`;
    $('#ex-table tbody').innerHTML = rows.map((v) => {
      const val = valueIn(v, ex.ctx);
      const mode = modeIn(v, ex.ctx);
      const modeStrip = strip && v.modes.length > 1
        ? `<div class="mode-strip">${v.modes.map((m) => swatch(v.resolvedByMode[m], 'sm', `${m}: ${plainVal(v.resolvedByMode[m])}`)).join('')}</div>` : '';
      return `<tr data-id="${esc(v.id)}" tabindex="0" aria-selected="${ex.selected === v.id}">
        <td>${swatch(val, 'lg', `${mode}: ${plainVal(val)}`)}${modeStrip}</td>
        <td><div class="tok-row"><div class="tok">${esc(v.name)}</div>${cmtButton(`data-cmt-token="${esc(v.id)}"`, D.involving(v.id), v.name)}</div></td>
        <td><span class="tag tag-${v.collection}">${v.collection}</span></td>
        <td class="mono muted">${esc(v.group)}</td>
        <td class="desc">${esc(v.description) || '<span class="muted">None</span>'}</td>
        <td>${valText(val)}<div class="muted" style="font-size:11px">${esc(mode)}</div></td>
        <td>${directAlias(v, mode)}</td>
        <td class="muted">${v.modes.map(esc).join(', ')}</td>
      </tr>`;
    }).join('');
    $$('#ex-table [data-cmt-token]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      openDiscussion(D.tokenTarget(BY_ID.get(b.dataset.cmtToken)), { ctx: ex.ctx });
    }));
    $$('#ex-table tbody tr').forEach((tr) => {
      const open = () => openDetail(tr.dataset.id);
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }
  function chainHtml(r) {
    if (!r) return '<p class="err">Unresolved</p>';
    const steps = r.chainDetail || [];
    return `<ol class="chain">${steps.map((s) => `<li>${esc(s.name)} <span class="col">${esc(s.collection || '')}${s.mode ? ' / ' + esc(s.mode) : ''}</span></li>`).join('')}</ol>` +
      (r.error ? `<p class="err">${esc(r.error)}</p>` : '');
  }
  function openDetail(id) {
    const v = BY_ID.get(id); if (!v) return;
    ex.selected = id;
    $$('#ex-table tbody tr').forEach((tr) => tr.setAttribute('aria-selected', String(tr.dataset.id === id)));
    const d = $('#detail');
    const perMode = v.modes.map((m) => `<div class="chain-mode">${swatch(v.resolvedByMode[m], 'md')} ${esc(m)} ${valText(v.resolvedByMode[m])}</div>${chainHtml(v.resolvedByMode[m])}`).join('');
    const perCtx = v.collection === 'Base' ? '' : `<h4>Resolved per brand × theme</h4>
      <table class="data-table"><tbody>${CONTEXTS.map((c) => `<tr><td>${esc(c.label)}</td><td>${swatch(v.resolvedByContext[c.id], 'sm')} ${valText(v.resolvedByContext[c.id])}</td></tr>`).join('')}</tbody></table>`;
    d.innerHTML = `
      <button type="button" class="btn btn-small close" aria-label="Close detail">Close</button>
      <h3>${esc(v.name)}</h3>
      <dl>
        <dt>Collection</dt><dd><span class="tag tag-${v.collection}">${v.collection}</span></dd>
        <dt>Group</dt><dd class="mono">${esc(v.group)}</dd>
        <dt>Description</dt><dd>${esc(v.description) || '<span class="muted">None</span>'}</dd>
        <dt>Variable ID</dt><dd class="mono">${esc(v.id)}</dd>
        <dt>Key</dt><dd class="mono">${esc(v.key)}</dd>
        <dt>Modes</dt><dd>${v.modes.map(esc).join(', ')}</dd>
        <dt>Scopes</dt><dd class="mono">${esc(v.scopes.join(', '))}</dd>
        <dt>Publishing</dt><dd>${v.hiddenFromPublishing ? 'Hidden from publishing' : 'Published with library'}</dd>
        <dt>Aliased by</dt><dd>${v.aliasedBy.length ? v.aliasedBy.map((n) => `<div class="mono">${esc(n)}</div>`).join('') : '<span class="muted">No variables</span>'}</dd>
      </dl>
      <h4>Alias chain per mode</h4>
      ${perMode}
      ${perCtx}
      <p style="margin-top:14px;display:flex;flex-wrap:wrap;gap:6px">
        <button type="button" class="btn btn-small" data-act="comments">Comments (${D.involving(v.id).length})</button>
        <button type="button" class="btn btn-small" data-act="flag">Flag for review</button>
        ${v.collection !== 'Base' ? '<button type="button" class="btn btn-small" data-act="bg">Use as background</button><button type="button" class="btn btn-small" data-act="fg">Use as foreground</button><button type="button" class="btn btn-small" data-act="matrix">Show in matrix</button>' : ''}
      </p>`;
    d.hidden = false;
    $('.close', d).addEventListener('click', () => { d.hidden = true; ex.selected = null; renderExplorer(); });
    $$('[data-act]', d).forEach((b) => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'comments') openDiscussion(D.tokenTarget(v), { ctx: ex.ctx });
      if (act === 'flag') prefillAudit({ subject: v.name, collection: v.collection, context: 'All', values: currentValues(v) });
      if (act === 'bg') { pl.bg = v.name; $('#pl-bg').value = v.name; savePairing(); renderPairing(); showView('pairing'); }
      if (act === 'fg') { pl.fg = v.name; $('#pl-fg').value = v.name; savePairing(); renderPairing(); showView('pairing'); }
      if (act === 'matrix') { $('#mx-search').value = v.name; mx.search = v.name.toLowerCase(); renderMatrix(); showView('matrix'); }
    }));
  }
  function currentValues(v) {
    if (v.collection === 'Base') return plainVal(v.resolvedByMode[v.modes[0]]);
    return v.modes.map((m) => `${m}: ${plainVal(v.resolvedByMode[m])}`).join('; ');
  }

  // ---------- View 2: Matrix ----------
  const mx = { search: '', collection: 'all', group: '', behaviour: 'all', lobbet: true, highlight: null, unresolved: false };

  function behaviourOf(v) {
    const vals = MATRIX_ORDER.map((id) => plainVal(v.resolvedByContext[id]));
    if (vals.every((x) => x === vals[0])) return 'uniform';
    const dark = MATRIX_ORDER.filter((id) => CTX.get(id).theme === 'Dark').map((id) => plainVal(v.resolvedByContext[id]));
    const light = MATRIX_ORDER.filter((id) => CTX.get(id).theme === 'Light').map((id) => plainVal(v.resolvedByContext[id]));
    if (dark.every((x) => x === dark[0]) && light.every((x) => x === light[0])) return 'theme';
    return 'brand';
  }
  const BEHAVIOUR_LABEL = { uniform: 'Same in all six', theme: 'Varies by theme only', brand: 'Varies by brand' };

  function initMatrix() {
    const groups = [...new Set(VARS.filter((v) => v.collection !== 'Base').map((v) => v.group))].sort();
    $('#mx-group').innerHTML = '<option value="">All groups</option>' + groups.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
    $('#mx-search').addEventListener('input', (e) => { mx.search = e.target.value.trim().toLowerCase(); renderMatrix(); });
    $('#mx-collection').addEventListener('change', (e) => { mx.collection = e.target.value; renderMatrix(); });
    $('#mx-group').addEventListener('change', (e) => { mx.group = e.target.value; renderMatrix(); });
    $('#mx-behaviour').addEventListener('change', (e) => { mx.behaviour = e.target.value; renderMatrix(); });
    $('#mx-lobbet').addEventListener('change', (e) => { mx.lobbet = e.target.checked; renderMatrix(); });
    $('#mx-unresolved').addEventListener('change', (e) => { mx.unresolved = e.target.checked; renderMatrix(); });
    renderMatrix();
  }
  function renderMatrix() {
    const cols = [...MATRIX_ORDER, ...(mx.lobbet ? [LOBBET] : [])];
    const q = mx.search;
    const rows = VARS.filter((v) => v.collection !== 'Base'
      && (mx.collection === 'all' || v.collection === mx.collection)
      && (!mx.group || v.group === mx.group)
      && (mx.behaviour === 'all' || behaviourOf(v) === mx.behaviour)
      && (!mx.unresolved || D.counts(D.involving(v.id)).open > 0)
      && (!q || v.name.toLowerCase().includes(q) || cols.some((c) => plainVal(v.resolvedByContext[c]).toLowerCase().includes(q))))
      .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
    $('#mx-count').textContent = `${rows.length} tokens`;
    $('#mx-table thead').innerHTML = `<tr><th class="name">Token</th>${cols.map((c) =>
      `<th class="ctx${c === LOBBET ? ' sep' : ''}">${esc(CTX.get(c).label)}${c === LOBBET ? '<div class="behaviour">Brand LobBet + Theme Dark</div>' : ''}</th>`).join('')}</tr>`;
    let lastGroup = null;
    const html = [];
    for (const v of rows) {
      if (v.group !== lastGroup) { html.push(`<tr class="group-row"><td colspan="${cols.length + 1}">${esc(v.group)}</td></tr>`); lastGroup = v.group; }
      html.push(`<tr><td class="name"><div class="tok-row"><div class="tok">${esc(v.name)}</div>${cmtButton(`data-cmt-token="${esc(v.id)}"`, D.involving(v.id), v.name)}</div><span class="tag tag-${v.collection}">${v.collection}</span> <span class="behaviour">${BEHAVIOUR_LABEL[behaviourOf(v)]}</span></td>${cols.map((c) => {
        const val = v.resolvedByContext[c];
        const key = plainVal(val);
        const modeThreads = D.forKey(`mode:${v.id}@${c}`);
        const mc = D.counts(modeThreads);
        const dot = mc.total ? `<span class="cell-dot ${mc.open ? 'open' : 'resolved'}" title="${mc.open} open, ${mc.total - mc.open} resolved discussion(s) on this mode">${mc.open || mc.total}</span>` : '';
        return `<td class="cell${c === LOBBET ? ' sep' : ''}${mx.highlight && mx.highlight === key ? ' hl' : ''}" data-key="${esc(key)}">
          <button type="button" data-id="${esc(v.id)}" data-ctx="${c}" aria-label="${esc(v.name)} in ${esc(CTX.get(c).label)}: ${esc(key)}">${swatch(val, 'md')}${valText(val)}${dot}</button></td>`;
      }).join('')}</tr>`);
    }
    $('#mx-table tbody').innerHTML = html.join('') || `<tr><td class="empty" colspan="${cols.length + 1}">No tokens match.</td></tr>`;
    $$('#mx-table [data-cmt-token]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      openDiscussion(D.tokenTarget(BY_ID.get(b.dataset.cmtToken)), { ctx: 'ftn-dark' });
    }));
    $$('#mx-table .cell button').forEach((b) => b.addEventListener('click', (e) => {
      const key = b.parentElement.dataset.key;
      mx.highlight = mx.highlight === key ? null : key;
      $$('#mx-table .cell').forEach((td) => td.classList.toggle('hl', !!mx.highlight && td.dataset.key === mx.highlight));
      showCellPopover(b, BY_ID.get(b.dataset.id), b.dataset.ctx);
      e.stopPropagation();
    }));
  }
  function showCellPopover(anchor, v, ctxId) {
    const val = v.resolvedByContext[ctxId];
    const same = mx.highlight ? $$('#mx-table .cell.hl').length : 0;
    const p = $('#popover');
    p.innerHTML = `<div class="chain-mode">${swatch(val, 'md')} ${valText(val)}</div>
      <div class="tok" style="margin-top:6px">${esc(v.name)}</div>
      <div class="muted">${esc(CTX.get(ctxId).label)} · ${esc(v.collection)} mode ${esc(modeIn(v, ctxId))}</div>
      <h4 style="margin:10px 0 2px">Alias chain</h4>${chainHtml(val)}
      ${mx.highlight ? `<p class="muted">${same} cell(s) share this value. Shared values are not evidence of redundancy.</p>` : ''}
      <p style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 0">
        <button type="button" class="btn btn-small" id="pop-comment">${ICON_COMMENT} Comment on this mode (${D.forKey(`mode:${v.id}@${ctxId}`).length})</button>
        <button type="button" class="btn btn-small" id="pop-flag">Flag for review</button></p>`;
    p.hidden = false;
    const r = anchor.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 356, Math.max(8, r.left));
    const top = r.bottom + 8 + 320 > window.innerHeight ? Math.max(8, r.top - p.offsetHeight - 8) : r.bottom + 8;
    p.style.left = `${left}px`; p.style.top = `${top}px`;
    $('#pop-comment').addEventListener('click', () => { hidePopover(); openDiscussion(D.modeTarget(v, CTX.get(ctxId))); });
    $('#pop-flag').addEventListener('click', () => {
      hidePopover();
      prefillAudit({ subject: v.name, collection: v.collection, context: CTX.get(ctxId).label, values: plainVal(val) });
    });
  }
  function hidePopover() { const p = $('#popover'); if (p) p.hidden = true; }

  // ---------- View 3: Pairing Lab ----------
  const pl = Object.assign({ bg: 'color/surface/primary', fg: 'color/content/primary', alts: ['color/content/secondary'] }, store.get(KEYS.pairing, {}));
  const savePairing = () => store.set(KEYS.pairing, pl);

  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const over = (top, a, under) => top.map((c, i) => c * a + under[i] * (1 - a));
  const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
  const rgbCss = (rgb) => `rgb(${rgb.map((x) => Math.round(x)).join(', ')})`;

  function initPairing() {
    $('#pl-bg').value = pl.bg; $('#pl-fg').value = pl.fg;
    const commit = (key, el) => { const n = el.value.trim(); if (!n || BY_NAME.has(n)) { pl[key] = n; savePairing(); renderPairing(); } };
    $('#pl-bg').addEventListener('change', (e) => commit('bg', e.target));
    $('#pl-fg').addEventListener('change', (e) => commit('fg', e.target));
    $('#pl-swap').addEventListener('click', () => { [pl.bg, pl.fg] = [pl.fg, pl.bg]; $('#pl-bg').value = pl.bg; $('#pl-fg').value = pl.fg; savePairing(); renderPairing(); });
    const add = () => { const n = $('#pl-alt').value.trim(); if (BY_NAME.has(n) && !pl.alts.includes(n) && n !== pl.fg) { pl.alts.push(n); savePairing(); renderPairing(); } $('#pl-alt').value = ''; };
    $('#pl-add').addEventListener('click', add);
    $('#pl-alt').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    renderPairing();
  }
  function pairCell(bgVar, fgVar, ctxId) {
    const bgv = bgVar.resolvedByContext[ctxId] || valueIn(bgVar, ctxId);
    const fgv = fgVar.resolvedByContext[ctxId] || valueIn(fgVar, ctxId);
    if (!bgv || bgv.error || !fgv || fgv.error) return { error: true };
    const base = BY_NAME.get('color/background/base')?.resolvedByContext[ctxId];
    const baseRgb = base && !base.error ? base.rgba.slice(0, 3) : [255, 255, 255];
    const bgRgb = bgv.alpha < 1 ? over(bgv.rgba.slice(0, 3), bgv.alpha, baseRgb) : bgv.rgba.slice(0, 3);
    const fgRgb = fgv.alpha < 1 ? over(fgv.rgba.slice(0, 3), fgv.alpha, bgRgb) : fgv.rgba.slice(0, 3);
    const r = ratio(fgRgb, bgRgb);
    return { r, bgv, fgv, bgRgb, fgRgb, normal: r >= 4.5, large: r >= 3, ui: r >= 3, composited: bgv.alpha < 1 || fgv.alpha < 1 };
  }
  const badge = (ok, label) => `<span class="badge ${ok ? 'pass' : 'fail'}">${label} ${ok ? 'Pass' : 'Fail'}</span>`;
  function renderPairing() {
    $('#pl-alts').innerHTML = pl.alts.map((n, i) => `<span class="chip">${esc(n)}<button type="button" aria-label="Remove ${esc(n)}" data-i="${i}">×</button></span>`).join('');
    $$('#pl-alts button').forEach((b) => b.addEventListener('click', () => { pl.alts.splice(+b.dataset.i, 1); savePairing(); renderPairing(); }));
    const bgVar = BY_NAME.get(pl.bg);
    const fgs = [pl.fg, ...pl.alts].filter((n) => BY_NAME.has(n)).map((n) => BY_NAME.get(n));
    const out = $('#pl-results');
    if (!bgVar || !fgs.length) { out.innerHTML = '<p class="empty">Choose a background and at least one foreground token.</p>'; return; }
    const ctxs = [...MATRIX_ORDER, LOBBET];
    const summary = fgs.map((f) => {
      const cells = ctxs.map((c) => pairCell(bgVar, f, c)).filter((x) => !x.error);
      const min = Math.min(...cells.map((x) => x.r));
      return { f, min, fails: cells.filter((x) => !x.normal).length };
    });
    out.innerHTML = `<div class="pair-block">
      <h3>Background <span class="mono">${esc(bgVar.name)}</span></h3>
      <div class="table-wrap"><table class="pair-table">
        <thead><tr><th>Brand × theme</th><th>Background</th>${fgs.map((f, i) => `<th class="fg-head" colspan="2">${i === 0 ? 'Foreground' : 'Alternative'}<div class="tok" style="text-transform:none;letter-spacing:0">${esc(f.name)}</div>
          <div class="behaviour" style="text-transform:none;letter-spacing:0">Lowest ${summary[i].min.toFixed(2)}:1 · normal-text AA fails in ${summary[i].fails} of ${ctxs.length}</div>
          <button type="button" class="btn btn-small no-print" data-flag="${i}">Flag pair</button></th>`).join('')}</tr></thead>
        <tbody>${ctxs.map((c) => {
          const bgv = bgVar.resolvedByContext[c];
          return `<tr${c === LOBBET ? ' class="lob"' : ''}><td><strong>${esc(CTX.get(c).label)}</strong>${c === LOBBET ? '<div class="behaviour">with Theme Dark</div>' : ''}</td>
            <td>${swatch(bgv, 'md')} ${valText(bgv)}</td>
            ${fgs.map((f) => {
              const x = pairCell(bgVar, f, c);
              if (x.error) return '<td class="fg-head" colspan="2"><span class="err">Unresolved</span></td>';
              return `<td class="fg-head"><div class="sample" style="background:${rgbCss(x.bgRgb)};color:${rgbCss(x.fgRgb)}">
                  <span class="big">Aa 1.85</span><span class="small">Normal text sample</span><span class="ui" style="background:${rgbCss(x.fgRgb)}"></span></div>
                  <div class="muted" style="font-size:11px;margin-top:2px">${valText(x.fgv)}</div></td>
                <td><div class="ratio-row"><div class="ratio">${x.r.toFixed(2)}:1</div>${cmtButton(`data-cmt-pair="${esc(bgVar.id)}|${esc(f.id)}|${c}"`, D.forKey(`pair:${bgVar.id}|${f.id}@${c}`), `${f.name} on ${bgVar.name} in ${CTX.get(c).label}`)}</div>${badge(x.normal, 'Text AA')}<br>${badge(x.large, 'Large AA')}<br>${badge(x.ui, 'UI 3:1')}
                  ${x.composited ? '<div class="behaviour">alpha composited</div>' : ''}</td>`;
            }).join('')}</tr>`;
        }).join('')}</tbody>
      </table></div></div>`;
    $$('#pl-results [data-cmt-pair]').forEach((b) => b.addEventListener('click', () => {
      const [bgId, fgId, c] = b.dataset.cmtPair.split('|');
      openDiscussion(D.pairTarget(BY_ID.get(bgId), BY_ID.get(fgId), CTX.get(c)));
    }));
    $$('#pl-results [data-flag]').forEach((b) => b.addEventListener('click', () => {
      const f = fgs[+b.dataset.flag];
      const lines = ctxs.map((c) => { const x = pairCell(bgVar, f, c); return `${CTX.get(c).label} ${x.error ? 'unresolved' : x.r.toFixed(2) + ':1'}`; });
      const anyFail = ctxs.some((c) => { const x = pairCell(bgVar, f, c); return !x.error && !x.normal; });
      prefillAudit({ subject: `${f.name} on ${bgVar.name}`, collection: 'Pair', context: 'All', values: lines.join('; '), issueType: anyFail ? 'Poor colour contrast' : '' });
    }));
  }

  // ---------- View 4: Audit ----------
  const FIELDS = ['subject', 'collection', 'context', 'values', 'issueType', 'evidence', 'proposal', 'status', 'notes', 'finalAction'];
  const HEADERS = ['Token / Pair', 'Collection', 'Brand / Theme', 'Current values', 'Issue type', 'Evidence', 'Proposed solution', 'Decision status', 'Notes', 'Final agreed action'];
  const parseIds = (s) => String(s || '').split(/[;,\s]+/).map((x) => x.trim()).filter(Boolean);
  let audit = store.get(KEYS.audit, []);
  const au = { status: '', search: '' };
  const saveAudit = () => { if (!store.set(KEYS.audit, audit)) alert('Could not save to localStorage in this browser. Export your items to keep them.'); $('#audit-count').textContent = audit.length; };
  const uid = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function initAudit() {
    const form = $('#audit-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const item = Object.fromEntries(FIELDS.map((f) => [f, (fd.get(f) || '').toString().trim()]));
      item.relatedThreads = parseIds(fd.get('relatedThreads'));
      let id = fd.get('id');
      const now = new Date().toISOString();
      if (id) { const i = audit.findIndex((x) => x.id === id); if (i >= 0) audit[i] = { ...audit[i], ...item, updated: now }; }
      else { id = uid(); audit.unshift({ id, ...item, created: now, updated: now }); }
      saveAudit();
      // Link discussions back to the issue (history stays in the discussion store).
      item.relatedThreads.forEach((tid) => D.linkAudit(tid, id, getAuthor() || 'Unknown'));
      resetForm(); renderAudit();
    });
    $('#audit-cancel').addEventListener('click', resetForm);
    form.elements.subject.addEventListener('change', () => {
      const v = BY_NAME.get(form.elements.subject.value.trim());
      if (v) { if (!form.elements.collection.value) form.elements.collection.value = v.collection; if (!form.elements.values.value) form.elements.values.value = currentValues(v); }
    });
    $('#au-status').addEventListener('change', (e) => { au.status = e.target.value; renderAudit(); });
    $('#au-search').addEventListener('input', (e) => { au.search = e.target.value.trim().toLowerCase(); renderAudit(); });
    $('#au-export-json').addEventListener('click', () => download(`nds-colour-audit-${stamp()}.json`, 'application/json',
      JSON.stringify({ tool: 'NDS Colour Explorer', source: DATA.meta.source, dataExportedAt: DATA.meta.exportedAt, exportedAt: new Date().toISOString(), items: audit,
        // Snapshot of the linked discussion history, for context. The discussion store remains the source of the threads.
        discussions: [...new Set(audit.flatMap((x) => x.relatedThreads || []))].map((tid) => D.find(tid)).filter(Boolean) }, null, 2)));
    $('#au-export-csv').addEventListener('click', () => download(`nds-colour-audit-${stamp()}.csv`, 'text/csv', toCsv()));
    $('#au-import').addEventListener('change', importFile);
    $('#audit-count').textContent = audit.length;
    renderAudit();
  }
  function resetForm() {
    const form = $('#audit-form'); form.reset(); form.elements.id.value = ''; form.elements.relatedThreads.value = ''; renderAuditRelated([]);
    $('#audit-form-title').textContent = 'Add review item'; $('#audit-save').textContent = 'Add item'; $('#audit-cancel').hidden = true;
  }
  function prefillAudit(values) {
    showView('audit'); resetForm();
    const form = $('#audit-form');
    for (const [k, v] of Object.entries(values)) if (form.elements[k] && v != null && k !== 'relatedThreads') form.elements[k].value = v;
    if (values.relatedThreads) { form.elements.relatedThreads.value = values.relatedThreads.join(';'); renderAuditRelated(values.relatedThreads); }
    form.elements.issueType.focus();
  }
  function renderAudit() {
    const rows = audit.filter((x) => (!au.status || x.status === au.status) && (!au.search || FIELDS.some((f) => (x[f] || '').toLowerCase().includes(au.search))));
    $('#au-empty').hidden = audit.length > 0;
    $('#au-table tbody').innerHTML = rows.map((x) => `<tr data-id="${esc(x.id)}">
      <td class="tok">${esc(x.subject)}</td><td>${esc(x.collection)}</td><td>${esc(x.context)}</td><td class="mono" style="font-size:11px">${esc(x.values)}</td>
      <td>${esc(x.issueType)}</td><td class="desc">${esc(x.evidence)}</td><td class="desc">${esc(x.proposal)}</td><td class="desc">${esc(x.finalAction)}</td>
      <td class="status status-${esc((x.status || '').replace(/\s/g, ''))}">${esc(x.status)}</td>
      <td>${relatedThreadsHtml(x.relatedThreads || [])}</td><td class="desc">${esc(x.notes)}</td>
      <td class="no-print"><button type="button" class="btn btn-small" data-edit>Edit</button> <button type="button" class="btn btn-small" data-del>Delete</button></td></tr>`).join('');
    $$('#au-table [data-edit]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const x = audit.find((r) => r.id === b.closest('tr').dataset.id); if (!x) return;
      const form = $('#audit-form'); form.elements.id.value = x.id;
      FIELDS.forEach((f) => { form.elements[f].value = x[f] || ''; });
      form.elements.relatedThreads.value = (x.relatedThreads || []).join(';'); renderAuditRelated(x.relatedThreads || []);
      $('#audit-form-title').textContent = 'Edit review item'; $('#audit-save').textContent = 'Save changes'; $('#audit-cancel').hidden = false;
      form.elements.subject.focus();
    }));
    bindThreadLinks($('#au-table'));
    $$('#au-table [data-del]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = b.closest('tr').dataset.id;
      if (confirm('Delete this review item?')) { audit = audit.filter((r) => r.id !== id); saveAudit(); renderAudit(); }
    }));
  }
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  function download(name, type, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const csvCell = (s) => { s = String(s ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  function toCsv() {
    const head = ['ID', ...HEADERS, 'Related discussions', 'Created', 'Updated'];
    return [head, ...audit.map((x) => [x.id, ...FIELDS.map((f) => x[f]), (x.relatedThreads || []).join(';'), x.created, x.updated])].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }
  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x !== ''));
  }
  function importFile(e) {
    const file = e.target.files[0]; if (!file) return;
    file.text().then((text) => {
      let items = [];
      if (/\.json$/i.test(file.name) || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const j = JSON.parse(text); items = Array.isArray(j) ? j : j.items || [];
        if (Array.isArray(j.discussions) && j.discussions.length) D.importData(j.discussions);
      } else {
        const [head, ...rows] = parseCsv(text.replace(/^﻿/, ''));
        const map = head.map((h) => { const i = HEADERS.indexOf(h.trim()); return i >= 0 ? FIELDS[i] : { ID: 'id', Created: 'created', Updated: 'updated', 'Related discussions': 'relatedThreads' }[h.trim()]; });
        items = rows.map((r) => Object.fromEntries(map.map((k, i) => [k, r[i] ?? '']).filter(([k]) => k)));
      }
      let added = 0, updated = 0;
      for (const it of items) {
        const clean = { id: it.id || uid(), created: it.created || new Date().toISOString(), updated: it.updated || new Date().toISOString() };
        FIELDS.forEach((f) => { clean[f] = String(it[f] ?? ''); });
        clean.relatedThreads = Array.isArray(it.relatedThreads) ? it.relatedThreads : parseIds(it.relatedThreads);
        const i = audit.findIndex((x) => x.id === clean.id);
        if (i >= 0) { audit[i] = clean; updated++; } else { audit.push(clean); added++; }
      }
      saveAudit(); renderAudit();
      alert(`Imported ${items.length} item(s): ${added} added, ${updated} updated.`);
    }).catch((err) => alert('Import failed: ' + err.message)).finally(() => { e.target.value = ''; });
  }

  // ---------- Discussions (Figma-style comment panel) ----------
  const dp = { target: null, ctx: 'ftn-dark', scope: 'exact', filter: 'all', focus: null };
  const getAuthor = () => store.get(KEYS.author, '');
  const AVATAR_HUES = ['#0071E3', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA', '#5856D6', '#A2845E'];
  function avatar(name) {
    const n = String(name || '?');
    let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const initials = n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
    return `<span class="avatar" style="background:${AVATAR_HUES[h % AVATAR_HUES.length]}" aria-hidden="true">${esc(initials)}</span>`;
  }
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  function when(iso) {
    const d = new Date(iso); const s = (d - Date.now()) / 1000;
    const steps = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [604800, 'day'], [2629800, 'week'], [31557600, 'month'], [Infinity, 'year']];
    const div = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 };
    const [, unit] = steps.find(([lim]) => Math.abs(s) < lim);
    return `<time datetime="${esc(iso)}" title="${esc(d.toLocaleString())}">${esc(rtf.format(Math.round(s / div[unit]), unit))}</time>`;
  }
  const linkify = (text) => esc(text).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.length > 60 ? u.slice(0, 57) + '...' : u}</a>`).replace(/\n/g, '<br>');
  const linkLabel = (u) => (/figma\.com/.test(u) ? 'Figma' : 'Link');

  function initDiscussions() {
    const header = $('.app-header');
    const setH = () => document.documentElement.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
    setH(); new ResizeObserver(setH).observe(header);
    $('#comments-btn').addEventListener('click', () => ($('#discussion').hidden || dp.target ? openDiscussion(null) : closeDiscussion()));
    D.subscribe(refreshDiscussionViews);
    $('#discussion').addEventListener('click', onDiscussionClick);
    $('#discussion').addEventListener('change', onDiscussionChange);
    $('#discussion').addEventListener('submit', onDiscussionSubmit);
    updateCommentCount();
  }
  function updateCommentCount() {
    const c = D.counts(D.all());
    $('#comments-count').textContent = c.open;
    $('#comments-count').title = `${c.open} open, ${c.total - c.open} resolved`;
  }
  // Re-render indicators everywhere when the store changes (tables keep their scroll position).
  function refreshDiscussionViews() {
    updateCommentCount();
    renderExplorer(); renderMatrix(); renderPairing(); renderAudit();
    if (!$('#discussion').hidden) renderDiscussion();
  }
  function openDiscussion(target, opts = {}) {
    dp.target = target;
    dp.scope = opts.scope || (target?.type === 'token' ? 'related' : 'exact');
    dp.ctx = opts.ctx || target?.context || dp.ctx || 'ftn-dark';
    dp.filter = opts.filter || 'all';
    dp.focus = opts.focus || null;
    hidePopover();
    $('#discussion').hidden = false;
    renderDiscussion();
    const el = dp.focus ? $(`#discussion [data-thread="${dp.focus}"]`) : null;
    if (el) el.scrollIntoView({ block: 'nearest' });
    else $('#discussion textarea[name="body"]')?.focus();
  }
  function closeDiscussion() { $('#discussion').hidden = true; dp.focus = null; }

  // Threads shown for the current target and scope.
  function panelThreads() {
    let list;
    if (!dp.target) list = D.all();
    else if (dp.scope === 'related' && dp.target.type !== 'pair') list = D.involving(dp.target.tokenId);
    else list = D.forKey(dp.target.key);
    if (dp.filter !== 'all') list = list.filter((t) => t.status === dp.filter);
    return list.sort((a, b) => (a.status === b.status ? String(b.updatedAt).localeCompare(String(a.updatedAt)) : a.status === 'open' ? -1 : 1));
  }
  function targetSummary() {
    const t = dp.target;
    const ctxOptions = (sel) => CONTEXTS.map((c) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(c.label)}${c.note ? ' (Theme Dark)' : ''}</option>`).join('');
    if (t.type === 'pair') {
      const bg = BY_ID.get(t.background.id), fg = BY_ID.get(t.foreground.id);
      const x = bg && fg ? pairCell(bg, fg, t.context) : { error: true };
      return `<div class="dp-kind">Colour pair</div>
        <div class="dp-title"><span class="tok">${esc(t.foreground.name)}</span><span class="muted"> on </span><span class="tok">${esc(t.background.name)}</span></div>
        <div class="dp-meta"><span class="tag tag-${esc(t.foreground.collection)}">${esc(t.foreground.collection)}</span> <span class="tag tag-${esc(t.background.collection)}">${esc(t.background.collection)}</span></div>
        <label class="field dp-ctx"><span>Brand / Theme</span><select data-dp="retarget">${ctxOptions(t.context)}</select></label>
        ${x.error ? '<p class="err">Token not in the current export, or unresolved.</p>' : `<div class="dp-colour">
          <div class="sample dp-sample" style="background:${rgbCss(x.bgRgb)};color:${rgbCss(x.fgRgb)}"><span class="big">Aa</span><span class="small">${x.r.toFixed(2)}:1</span></div>
          <div><div>${swatch(x.bgv, 'sm')} ${valText(x.bgv)} <span class="muted">background</span></div><div>${swatch(x.fgv, 'sm')} ${valText(x.fgv)} <span class="muted">foreground</span></div>
          <div>${badge(x.normal, 'Text AA')} ${badge(x.ui, 'UI 3:1')}</div></div></div>`}`;
    }
    const v = BY_ID.get(t.tokenId);
    const ctxId = t.type === 'mode' ? t.context : dp.ctx;
    const val = v ? valueIn(v, ctxId) : null;
    return `<div class="dp-kind">${t.type === 'mode' ? 'Token in one brand / theme' : 'Token'}</div>
      <div class="dp-title tok">${esc(t.tokenName)}</div>
      <div class="dp-meta"><span class="tag tag-${esc(t.collection)}">${esc(t.collection)}</span>${v ? '' : ' <span class="err">Not in the current export</span>'}</div>
      ${t.collection === 'Base' ? '' : `<label class="field dp-ctx"><span>${t.type === 'mode' ? 'Brand / Theme' : 'Show colour for'}</span><select data-dp="${t.type === 'mode' ? 'retarget' : 'ctx'}">${ctxOptions(ctxId)}</select></label>`}
      ${v ? `<div class="dp-colour">${swatch(val, 'lg')}<div>${valText(val)}<div class="muted">${esc(t.collection === 'Base' ? 'Base' : `${CTX.get(ctxId).label} · ${v.collection} mode ${modeIn(v, ctxId)}`)}</div></div></div>` : ''}`;
  }
  function threadHtml(t, showTarget) {
    const audits = (t.auditIds || []).map((id) => audit.find((a) => a.id === id)).filter(Boolean);
    const evLabel = { opened: 'opened the discussion', resolved: 'resolved', reopened: 'reopened', 'link-added': 'added a link', 'audit-linked': 'linked an audit issue' };
    return `<article class="thread ${t.status}" data-thread="${esc(t.id)}">
      <header class="thread-head">
        ${avatar(t.author)}<div class="thread-who"><strong>${esc(t.author)}</strong> ${when(t.createdAt)}</div>
        <span class="pill ${t.status}">${t.status === 'open' ? 'Open' : 'Resolved'}</span>
      </header>
      ${showTarget ? `<button type="button" class="thread-target" data-dp="goto" data-key="${esc(t.target.key)}">${esc(t.target.type)} · ${esc(D.targetLabel(t.target))}</button>` : ''}
      <div class="thread-body">${linkify(t.body)}</div>
      ${t.figmaLinks?.length ? `<div class="thread-links">${t.figmaLinks.map((u) => `<a class="link-chip" href="${esc(u)}" target="_blank" rel="noopener" title="${esc(u)}">${linkLabel(u)} ↗</a>`).join('')}</div>` : ''}
      ${audits.length ? `<div class="thread-audit">${audits.map((a) => `<button type="button" class="btn btn-small btn-plain" data-dp="audit-open" data-audit="${esc(a.id)}">Audit issue · ${esc(a.status || 'Open')}${a.finalAction ? ' · final action set' : ''}</button>`).join('')}</div>` : ''}
      ${t.replies.map((r) => `<div class="reply">${avatar(r.author)}<div><div class="thread-who"><strong>${esc(r.author)}</strong> ${when(r.createdAt)}</div><div class="thread-body">${linkify(r.body)}</div></div></div>`).join('')}
      <form class="reply-form" data-dp="reply" data-thread="${esc(t.id)}">
        <textarea name="reply" rows="1" placeholder="Reply" aria-label="Reply"></textarea>
        <button type="submit" class="btn btn-small btn-primary">Reply</button>
      </form>
      <footer class="thread-actions">
        ${t.status === 'open' ? `<button type="button" class="btn btn-small" data-dp="resolve">✓ Resolve</button>` : `<button type="button" class="btn btn-small" data-dp="reopen">Reopen</button>`}
        <button type="button" class="btn btn-small" data-dp="to-audit">${audits.length ? 'New audit issue' : 'Create audit issue'}</button>
        <button type="button" class="btn btn-small btn-plain" data-dp="add-link">Add Figma link</button>
        <details class="history"><summary>History (${t.events.length + t.replies.length})</summary><ol>
          ${[...t.events.map((e) => ({ at: e.at, text: `${esc(e.by)} ${evLabel[e.type] || esc(e.type)}${e.note && e.type === 'link-added' ? `: ${esc(e.note)}` : ''}` })), ...t.replies.map((r) => ({ at: r.createdAt, text: `${esc(r.author)} replied` }))]
            .sort((a, b) => String(a.at).localeCompare(String(b.at))).map((e) => `<li>${e.text} · ${when(e.at)}</li>`).join('')}
        </ol></details>
      </footer>
    </article>`;
  }
  function renderDiscussion() {
    const panel = $('#discussion');
    const list = panelThreads();
    const t = dp.target;
    const scopeCtl = t && t.type !== 'pair' ? `<div class="seg" role="group" aria-label="Scope">
      <button type="button" data-dp="scope" data-v="exact" aria-pressed="${dp.scope === 'exact'}">${t.type === 'mode' ? 'This brand / theme' : 'Token only'}</button>
      <button type="button" data-dp="scope" data-v="related" aria-pressed="${dp.scope === 'related'}">All on this token</button></div>` : '';
    const filterCtl = `<div class="seg" role="group" aria-label="Status">${['all', 'open', 'resolved'].map((f) => `<button type="button" data-dp="filter" data-v="${f}" aria-pressed="${dp.filter === f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>`;
    panel.innerHTML = `
      <div class="dp-head">
        <h2>${t ? 'Discussion' : 'All discussions'}</h2>
        <button type="button" class="btn btn-small btn-plain" data-dp="close" aria-label="Close discussion panel">Close</button>
      </div>
      <div class="dp-scroll">
        ${t ? `<section class="dp-target">${targetSummary()}</section>` : `<p class="muted dp-intro">Every discussion in this browser. Choose one to jump to its token, mode or pair.</p>`}
        <div class="dp-controls">${scopeCtl}${filterCtl}</div>
        <label class="dp-author">Commenting as <input type="text" data-dp="author" value="${esc(getAuthor())}" placeholder="Your name" aria-label="Your name"></label>
        ${t ? `<form class="composer" data-dp="new">
          <textarea name="body" rows="3" placeholder="Start a new discussion on ${esc(D.targetLabel(t))}" aria-label="New discussion"></textarea>
          <input type="url" name="links" placeholder="Related Figma links (optional, comma separated)" aria-label="Related Figma links">
          <div class="composer-actions"><span class="muted">Comments never change Figma or token values.</span><button type="submit" class="btn btn-primary btn-small">Post</button></div>
        </form>` : ''}
        <div class="threads">${list.length ? list.map((x) => threadHtml(x, !t || dp.scope === 'related' || x.target.key !== t.key)).join('') : `<p class="empty">No ${dp.filter === 'all' ? '' : dp.filter + ' '}discussions${t ? ' here yet' : ''}.</p>`}</div>
      </div>
      <div class="dp-foot">
        <span class="muted">${D.counts(D.all()).total} discussion(s) stored in this browser</span>
        <button type="button" class="btn btn-small" data-dp="export">Export</button>
        <label class="btn btn-small file-btn">Import<input type="file" data-dp="import" accept=".json,application/json"></label>
      </div>`;
  }
  function needAuthor() {
    const input = $('#discussion [data-dp="author"]');
    if (input && input.value.trim()) store.set(KEYS.author, input.value.trim());
    const a = getAuthor();
    if (a) return a;
    input.focus(); input.classList.add('invalid');
    return '';
  }
  function threadToAudit(t) {
    const tg = t.target;
    const transcript = [`Discussion ${t.id} (${t.status}) opened by ${t.author} on ${t.createdAt.slice(0, 10)}: ${t.body}`,
      ...t.replies.map((r) => `${r.author} (${r.createdAt.slice(0, 10)}): ${r.body}`)].join('\n');
    let subject, collection, context, values;
    if (tg.type === 'pair') {
      const bg = BY_ID.get(tg.background.id), fg = BY_ID.get(tg.foreground.id);
      const x = bg && fg ? pairCell(bg, fg, tg.context) : { error: true };
      subject = `${tg.foreground.name} on ${tg.background.name}`; collection = 'Pair'; context = tg.contextLabel;
      values = x.error ? '' : `${plainVal(x.fgv)} on ${plainVal(x.bgv)} = ${x.r.toFixed(2)}:1`;
    } else {
      const v = BY_ID.get(tg.tokenId);
      subject = tg.tokenName; collection = tg.collection;
      context = tg.type === 'mode' ? tg.contextLabel : 'All';
      values = !v ? '' : tg.type === 'mode' ? plainVal(valueIn(v, tg.context)) : currentValues(v);
    }
    prefillAudit({ subject, collection, context, values, evidence: transcript, relatedThreads: [t.id], notes: (t.figmaLinks || []).join('\n') });
  }
  function onDiscussionClick(e) {
    const b = e.target.closest('[data-dp]'); if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT' || b.tagName === 'FORM') return;
    const act = b.dataset.dp;
    const tid = b.closest('[data-thread]')?.dataset.thread;
    const author = ['resolve', 'reopen', 'add-link'].includes(act) ? needAuthor() : getAuthor();
    if (act === 'close') closeDiscussion();
    if (act === 'scope') { dp.scope = b.dataset.v; renderDiscussion(); }
    if (act === 'filter') { dp.filter = b.dataset.v; renderDiscussion(); }
    if (act === 'resolve' || act === 'reopen') { if (!author) return; D.setStatus(tid, act === 'resolve' ? 'resolved' : 'open', author); }
    if (act === 'to-audit') { threadToAudit(D.find(tid)); }
    if (act === 'audit-open') { showView('audit'); const row = $(`#au-table tr[data-id="${b.dataset.audit}"] [data-edit]`); if (row) row.click(); }
    if (act === 'add-link') {
      if (!author) return;
      const url = prompt('Figma (or other) link for this discussion:');
      if (url && /^https?:\/\//.test(url.trim())) D.addFigmaLink(tid, url.trim(), author);
      else if (url) alert('Please paste a full link starting with https://');
    }
    if (act === 'goto') {
      const th = D.find(tid); if (th) openDiscussion(th.target, { focus: th.id, scope: 'exact' });
    }
    if (act === 'export') download(`nds-colour-discussions-${stamp()}.json`, 'application/json', JSON.stringify(D.exportData({ source: DATA.meta.source }), null, 2));
  }
  function onDiscussionChange(e) {
    const el = e.target; const act = el.dataset.dp;
    if (act === 'author') { store.set(KEYS.author, el.value.trim()); el.classList.remove('invalid'); }
    if (act === 'ctx') { dp.ctx = el.value; renderDiscussion(); }
    if (act === 'retarget') {
      const c = CTX.get(el.value); const t = dp.target;
      if (t.type === 'mode') { const v = BY_ID.get(t.tokenId); if (v) openDiscussion(D.modeTarget(v, c), { scope: dp.scope }); }
      if (t.type === 'pair') { const bg = BY_ID.get(t.background.id), fg = BY_ID.get(t.foreground.id); if (bg && fg) openDiscussion(D.pairTarget(bg, fg, c)); }
    }
    if (act === 'import') {
      const file = el.files[0]; if (!file) return;
      file.text().then((text) => { const r = D.importData(JSON.parse(text)); alert(`Imported discussions: ${r.added} added, ${r.merged} merged. Nothing was deleted.`); })
        .catch((err) => alert('Import failed: ' + err.message)).finally(() => { el.value = ''; });
    }
  }
  function onDiscussionSubmit(e) {
    e.preventDefault();
    const f = e.target; const author = needAuthor(); if (!author) return;
    try {
      if (f.dataset.dp === 'new') {
        const body = f.elements.body.value;
        if (!body.trim()) return f.elements.body.focus();
        const links = f.elements.links.value.split(/[\s,]+/).filter((u) => /^https?:\/\//.test(u));
        const th = D.create({ target: dp.target, author, body, figmaLinks: links });
        dp.focus = th.id;
      }
      if (f.dataset.dp === 'reply') {
        const body = f.elements.reply.value;
        if (!body.trim()) return f.elements.reply.focus();
        D.reply(f.dataset.thread, { author, body });
      }
    } catch (err) { alert(err.message); }
  }
  // Audit view: linked discussions
  function relatedThreadsHtml(ids) {
    const ths = ids.map((id) => D.find(id)).filter(Boolean);
    if (!ths.length) return ids.length ? `<span class="muted">${ids.length} not in this browser</span>` : '<span class="muted">None</span>';
    return ths.map((t) => `<button type="button" class="thread-link" data-thread-link="${esc(t.id)}"><span class="pill ${t.status}">${t.status === 'open' ? 'Open' : 'Resolved'}</span> ${esc(D.targetLabel(t.target))} · ${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}</button>`).join('');
  }
  function bindThreadLinks(root) {
    $$('[data-thread-link]', root).forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault();
      const t = D.find(b.dataset.threadLink); if (t) openDiscussion(t.target, { focus: t.id, scope: 'exact' });
    }));
  }
  function renderAuditRelated(ids) {
    const box = $('#audit-related'); if (!box) return;
    box.hidden = !ids.length;
    $('.related-list', box).innerHTML = relatedThreadsHtml(ids);
    bindThreadLinks(box);
  }

  // ---------- Print ----------
  function initPrint() {
    const setSize = () => { $('#page-size').textContent = `@page { size: ${$('#print-size').value}; margin: 10mm; }`; };
    $('#print-size').addEventListener('change', setSize);
    window.addEventListener('beforeprint', updatePrintMeta);
    $('#print-btn').addEventListener('click', () => { setSize(); updatePrintMeta(); hidePopover(); window.print(); });
    updatePrintMeta();
  }
  function updatePrintMeta() {
    {
      const m = DATA.meta;
      const view = $$('.view').find((v) => !v.hidden)?.id;
      const filters = view === 'view-explorer'
        ? `Collection: ${ex.collection === 'all' ? 'All' : ex.collection}${ex.group ? ` · Group: ${ex.group}` : ''}${ex.search ? ` · Search: "${ex.search}"` : ''} · Values shown for ${CTX.get(ex.ctx).label}`
        : view === 'view-matrix'
          ? `Collection: ${mx.collection === 'all' ? 'Theme + Brand' : mx.collection}${mx.group ? ` · Group: ${mx.group}` : ''}${mx.behaviour !== 'all' ? ` · ${BEHAVIOUR_LABEL[mx.behaviour]}` : ''}${mx.search ? ` · Search: "${mx.search}"` : ''}`
          : view === 'view-audit' ? `${audit.length} item(s)${au.status ? ` · Status: ${au.status}` : ''}` : '';
      const text = `Source: ${m.source.fileName} (${m.source.fileKey}) · data exported ${m.exportedAt.slice(0, 16).replace('T', ' ')} UTC · printed ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC${filters ? ' · ' + filters : ''}`;
      $$('[data-print-meta]').forEach((el) => { el.textContent = text; });
    }
  }
})();
