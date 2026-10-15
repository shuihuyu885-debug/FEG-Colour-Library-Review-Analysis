// Builds the dashboard data from the raw Figma export.
//
//   node tools/build-data.mjs
//
// Input:  data/figma-variables-raw.json   (written by tools/figma-plugin)
// Output: data/nds-colour-tokens.json     (complete exported token data, resolved)
//         data/nds-colour-tokens.js       (same data as a script, so index.html opens without a server)
//
// Read-only: this never talks to Figma. Node 18+, no dependencies.
// Exits with code 1 if any value cannot be resolved (the data is still written, with the problem flagged).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(ROOT, 'data/figma-variables-raw.json'), 'utf8'));

const byId = new Map(raw.variables.map((v) => [v.id, v]));
const colById = new Map(raw.collections.map((c) => [c.id, c]));
const colByName = new Map(raw.collections.map((c) => [c.name, c]));
const modeName = (colId, modeId) => colById.get(colId)?.modes.find((m) => m.modeId === modeId)?.name ?? modeId;
const modeIdByName = (colName, name) => colByName.get(colName)?.modes.find((m) => m.name === name)?.modeId;

// Brand/theme combinations shown in the matrix. Each pins one mode per collection.
// LobBet has no Light/Dark split in the Brand collection; it is paired with Theme Dark.
const CONTEXTS = [
  { id: 'ftn-dark', label: 'FTN Dark', brand: 'FTN Dark', theme: 'Dark' },
  { id: 'ftn-light', label: 'FTN Light', brand: 'FTN Light', theme: 'Light' },
  { id: 'cp-dark', label: 'CP Dark', brand: 'CP Dark', theme: 'Dark' },
  { id: 'cp-light', label: 'CP Light', brand: 'CP Light', theme: 'Light' },
  { id: 'psk-dark', label: 'PSK Dark', brand: 'PSK Dark', theme: 'Dark' },
  { id: 'psk-light', label: 'PSK Light', brand: 'PSK Light', theme: 'Light' },
  { id: 'lobbet', label: 'LobBet', brand: 'LobBet', theme: 'Dark', note: 'LobBet Brand mode paired with Theme Dark' },
];
const contextModes = (ctx) => ({
  [colByName.get('Base').id]: colByName.get('Base').defaultModeId,
  [colByName.get('Theme').id]: modeIdByName('Theme', ctx.theme),
  [colByName.get('Brand').id]: modeIdByName('Brand', ctx.brand),
});
// Theme mode to use when a Brand mode needs one (only matters if Brand ever aliases Theme).
const themeForBrandMode = (brandModeName) => (/Light$/.test(brandModeName) ? 'Light' : 'Dark');

const to255 = (x) => Math.round(x * 255);
const hex = ({ r, g, b }) => '#' + [r, g, b].map((x) => to255(x).toString(16).padStart(2, '0')).join('').toUpperCase();
function colour(c) {
  const a = Math.round(c.a * 1000) / 1000;
  const rgb = [to255(c.r), to255(c.g), to255(c.b)];
  return { hex: hex(c), alpha: a, rgba: [...rgb, a], css: a === 1 ? hex(c) : `rgba(${rgb.join(', ')}, ${a})` };
}

const problems = [];

// Resolve one variable under a set of pinned modes. Returns { value, chain } or { error, chain }.
function resolve(varId, modes, seen = new Set()) {
  const v = byId.get(varId);
  if (!v) return { error: `missing variable ${varId}`, chain: [{ id: varId, name: '(not found in this file)' }] };
  if (seen.has(varId)) return { error: `alias cycle at ${v.name}`, chain: [] };
  seen.add(varId);
  const col = colById.get(v.collectionId);
  const modeId = modes[v.collectionId] ?? col.defaultModeId;
  const step = { id: v.id, name: v.name, collection: col.name, mode: modeName(v.collectionId, modeId) };
  const val = v.valuesByMode[modeId];
  if (!val) return { error: `${v.name} has no value for mode ${step.mode}`, chain: [step] };
  if (val.type === 'VARIABLE_ALIAS') {
    const next = resolve(val.id, modes, seen);
    return { ...next, chain: [step, ...next.chain] };
  }
  if (typeof val.r !== 'number') return { error: `${v.name} has a non-colour value`, chain: [step] };
  return { value: colour(val), chain: [step] };
}

function entry(result, where) {
  if (result.error) problems.push(`${where}: ${result.error}`);
  return result.error
    ? { error: result.error, chain: result.chain.map((s) => s.name) , chainDetail: result.chain }
    : { ...result.value, chain: result.chain.map((s) => s.name), chainDetail: result.chain };
}

const groupOf = (name) => name.split('/').slice(0, -1).join('/');
const familyOf = (name) => {
  const p = name.split('/');
  return p[0] === 'palette' ? `palette/${p[1]}` : `${p[0]}/${p[1]}`;
};

const variables = raw.variables
  .filter((v) => v.resolvedType === 'COLOR')
  .map((v) => {
    const col = colById.get(v.collectionId);
    // Raw value per own mode (alias target or literal colour)
    const values = {};
    const resolvedByMode = {};
    for (const m of col.modes) {
      const val = v.valuesByMode[m.modeId];
      values[m.name] = !val
        ? { type: 'missing' }
        : val.type === 'VARIABLE_ALIAS'
          ? { type: 'alias', id: val.id, name: byId.get(val.id)?.name ?? '(not found)', collection: colById.get(byId.get(val.id)?.collectionId)?.name ?? '?' }
          : { type: 'colour', ...colour(val) };
      const modes = { [colByName.get('Base').id]: colByName.get('Base').defaultModeId };
      modes[v.collectionId] = m.modeId;
      if (col.name === 'Brand') modes[colByName.get('Theme').id] = modeIdByName('Theme', themeForBrandMode(m.name));
      if (col.name === 'Theme') modes[colByName.get('Brand').id] = colByName.get('Brand').defaultModeId;
      resolvedByMode[m.name] = entry(resolve(v.id, modes), `${v.name} [${m.name}]`);
    }
    const resolvedByContext = {};
    if (col.name !== 'Base') {
      for (const ctx of CONTEXTS) resolvedByContext[ctx.id] = entry(resolve(v.id, contextModes(ctx)), `${v.name} [${ctx.label}]`);
    }
    return {
      id: v.id,
      key: v.key,
      name: v.name,
      collection: col.name,
      collectionId: col.id,
      group: groupOf(v.name),
      family: familyOf(v.name),
      description: v.description || '',
      scopes: v.scopes,
      hiddenFromPublishing: v.hiddenFromPublishing,
      codeSyntax: v.codeSyntax,
      modes: col.modes.map((m) => m.name),
      values,
      resolvedByMode,
      resolvedByContext,
    };
  });

// Reverse references: which variables alias each variable directly
const usedBy = new Map();
for (const v of raw.variables) {
  for (const val of Object.values(v.valuesByMode)) {
    if (val?.type === 'VARIABLE_ALIAS') {
      if (!usedBy.has(val.id)) usedBy.set(val.id, new Set());
      usedBy.get(val.id).add(v.name);
    }
  }
}
for (const v of variables) v.aliasedBy = [...(usedBy.get(v.id) ?? [])].sort();

const counts = Object.fromEntries(raw.collections.map((c) => [c.name, variables.filter((v) => v.collectionId === c.id).length]));
const data = {
  meta: {
    title: 'NDS Foundation Colour Tokens',
    source: raw.source,
    exportedAt: raw.exportedAt,
    exporter: raw.exporter,
    builtAt: new Date().toISOString(),
    collections: raw.collections,
    counts: { total: variables.length, ...counts },
    contexts: CONTEXTS.map((c) => ({ ...c, themeModeId: modeIdByName('Theme', c.theme), brandModeId: modeIdByName('Brand', c.brand) })),
    resolution: [
      'Base has one mode and is always resolved in that mode.',
      'Theme tokens resolve in the context Theme mode (Dark or Light).',
      'Brand tokens resolve in the context Brand mode.',
      'An alias into another collection resolves in the mode that the context pins for that collection.',
      'An alias within the same collection keeps the same mode.',
      'LobBet is a Brand mode only; it is paired with Theme Dark.',
    ],
    problems,
  },
  variables,
};

writeFileSync(join(ROOT, 'data/nds-colour-tokens.json'), JSON.stringify(data, null, 1) + '\n');
writeFileSync(join(ROOT, 'data/nds-colour-tokens.js'), '// Generated by tools/build-data.mjs. Do not edit.\nwindow.NDS_TOKENS = ' + JSON.stringify(data) + ';\n');
console.log(`Variables: ${variables.length} (${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ')})`);
console.log(`Resolved values: ${variables.reduce((n, v) => n + Object.keys(v.resolvedByMode).length + Object.keys(v.resolvedByContext).length, 0)}`);
if (problems.length) {
  console.error(`UNRESOLVED: ${problems.length}`);
  problems.forEach((p) => console.error(' - ' + p));
  process.exit(1);
}
console.log('All values resolved.');
