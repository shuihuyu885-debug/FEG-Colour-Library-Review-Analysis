/* NDS Colour Explorer: discussion store.
   Data model and persistence for token / mode / pair discussions.
   Kept separate from the colour token data and from the UI so the storage
   adapter can later be swapped for a shared backend (see docs/discussions.md).
   Vanilla JS, no dependencies. Exposes window.NDSDiscussions. */
(function () {
  'use strict';

  const SCHEMA = 'nds-discussions/1';
  const STORAGE_KEY = 'nds-colour-explorer.discussions.v1';

  // ---------- Storage adapter (local) ----------
  // A shared backend only needs to implement load() and save(threads).
  const localAdapter = {
    name: 'localStorage',
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        return Array.isArray(data?.threads) ? data.threads : [];
      } catch { return []; }
    },
    save(threads) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: SCHEMA, savedAt: now(), threads })); return true; } catch { return false; }
    },
  };

  // ---------- Helpers ----------
  function now() { return new Date().toISOString(); }
  function newId(prefix) { return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }
  const clean = (s) => String(s ?? '').trim();
  const later = (a, b) => (String(a || '') >= String(b || '') ? a : b);

  // ---------- Targets ----------
  // Every thread points at a stable identifier built from Figma variable IDs
  // (not names), plus a brand/theme context id for mode and pair targets.
  //   token: token:<variableId>
  //   mode:  mode:<variableId>@<contextId>
  //   pair:  pair:<backgroundVariableId>|<foregroundVariableId>@<contextId>
  // Names and labels are stored as a snapshot so a thread stays readable even
  // if the token is renamed or removed in a later export.
  function tokenTarget(v) {
    return { type: 'token', key: `token:${v.id}`, tokenIds: [v.id], tokenId: v.id, tokenName: v.name, collection: v.collection, context: null };
  }
  function modeTarget(v, ctx) {
    return { type: 'mode', key: `mode:${v.id}@${ctx.id}`, tokenIds: [v.id], tokenId: v.id, tokenName: v.name, collection: v.collection, context: ctx.id, contextLabel: ctx.label };
  }
  function pairTarget(bg, fg, ctx) {
    return {
      type: 'pair', key: `pair:${bg.id}|${fg.id}@${ctx.id}`, tokenIds: [bg.id, fg.id],
      background: { id: bg.id, name: bg.name, collection: bg.collection },
      foreground: { id: fg.id, name: fg.name, collection: fg.collection },
      context: ctx.id, contextLabel: ctx.label,
    };
  }
  function targetLabel(t) {
    if (t.type === 'token') return t.tokenName;
    if (t.type === 'mode') return `${t.tokenName} · ${t.contextLabel}`;
    return `${t.foreground.name} on ${t.background.name} · ${t.contextLabel}`;
  }

  // ---------- Store ----------
  let adapter = localAdapter;
  let threads = adapter.load();
  const listeners = new Set();
  function persist() {
    const ok = adapter.save(threads);
    listeners.forEach((fn) => fn());
    return ok;
  }
  const find = (id) => threads.find((t) => t.id === id);

  function create({ target, author, body, figmaLinks = [] }) {
    if (!clean(body)) throw new Error('A comment cannot be empty.');
    if (!clean(author)) throw new Error('Add your name before commenting.');
    const at = now();
    const thread = {
      id: newId('thr'),
      schema: SCHEMA,
      target,
      author: clean(author),
      createdAt: at,
      updatedAt: at,
      body: clean(body),
      status: 'open',
      figmaLinks: figmaLinks.map(clean).filter(Boolean),
      replies: [],
      events: [{ id: newId('evt'), at, by: clean(author), type: 'opened' }],
      auditIds: [],
      external: {}, // reserved for a shared backend, e.g. { github: { issueNumber, url } }
    };
    threads.unshift(thread);
    persist();
    return thread;
  }
  function reply(threadId, { author, body }) {
    const t = find(threadId); if (!t) throw new Error('Discussion not found.');
    if (!clean(body)) throw new Error('A reply cannot be empty.');
    if (!clean(author)) throw new Error('Add your name before replying.');
    const at = now();
    const r = { id: newId('rep'), author: clean(author), createdAt: at, body: clean(body) };
    t.replies.push(r);
    t.updatedAt = at;
    persist();
    return r;
  }
  // Status changes are recorded as events and never touch token data.
  function setStatus(threadId, status, author) {
    const t = find(threadId); if (!t || t.status === status) return t;
    const at = now();
    t.status = status;
    t.updatedAt = at;
    t.events.push({ id: newId('evt'), at, by: clean(author) || 'Unknown', type: status === 'resolved' ? 'resolved' : 'reopened' });
    persist();
    return t;
  }
  function addFigmaLink(threadId, url, author) {
    const t = find(threadId); if (!t || !clean(url)) return t;
    if (!t.figmaLinks.includes(clean(url))) t.figmaLinks.push(clean(url));
    const at = now();
    t.updatedAt = at;
    t.events.push({ id: newId('evt'), at, by: clean(author) || 'Unknown', type: 'link-added', note: clean(url) });
    persist();
    return t;
  }
  function linkAudit(threadId, auditId, author) {
    const t = find(threadId); if (!t || t.auditIds.includes(auditId)) return t;
    const at = now();
    t.auditIds.push(auditId);
    t.updatedAt = at;
    t.events.push({ id: newId('evt'), at, by: clean(author) || 'Unknown', type: 'audit-linked', note: auditId });
    persist();
    return t;
  }

  // ---------- Queries ----------
  const all = () => threads.slice();
  const forKey = (key) => threads.filter((t) => t.target.key === key);
  const involving = (tokenId) => threads.filter((t) => (t.target.tokenIds || []).includes(tokenId));
  const counts = (list) => ({ open: list.filter((t) => t.status === 'open').length, total: list.length });

  // ---------- Import / export ----------
  function exportData(meta = {}) {
    return { schema: SCHEMA, tool: 'NDS Colour Explorer', exportedAt: now(), ...meta, threads };
  }
  // Merge by thread id. Nothing is ever deleted: replies and events are unioned by id,
  // and status follows whichever copy was updated most recently.
  function importData(data) {
    const incoming = Array.isArray(data) ? data : data?.threads;
    if (!Array.isArray(incoming)) throw new Error('No discussions found in this file.');
    let added = 0, merged = 0;
    for (const t of incoming) {
      if (!t?.id || !t?.target?.key) continue;
      const mine = find(t.id);
      if (!mine) {
        threads.push({ replies: [], events: [], figmaLinks: [], auditIds: [], external: {}, ...t });
        added++;
        continue;
      }
      const union = (a = [], b = []) => { const m = new Map(a.map((x) => [x.id, x])); b.forEach((x) => { if (!m.has(x.id)) m.set(x.id, x); }); return [...m.values()].sort((x, y) => String(x.createdAt || x.at).localeCompare(String(y.createdAt || y.at))); };
      mine.replies = union(mine.replies, t.replies);
      mine.events = union(mine.events, t.events);
      mine.figmaLinks = [...new Set([...(mine.figmaLinks || []), ...(t.figmaLinks || [])])];
      mine.auditIds = [...new Set([...(mine.auditIds || []), ...(t.auditIds || [])])];
      if (String(t.updatedAt) > String(mine.updatedAt)) { mine.status = t.status; }
      mine.updatedAt = later(mine.updatedAt, t.updatedAt);
      merged++;
    }
    threads.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    persist();
    return { added, merged };
  }

  window.NDSDiscussions = {
    SCHEMA, STORAGE_KEY,
    tokenTarget, modeTarget, pairTarget, targetLabel,
    create, reply, setStatus, addFigmaLink, linkAudit,
    all, find, forKey, involving, counts,
    exportData, importData,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    useAdapter(a) { adapter = a; threads = adapter.load(); listeners.forEach((fn) => fn()); },
    get adapterName() { return adapter.name; },
  };
})();
