// Builds the Semantic Pairing Audit from the resolved token data and the pairing list.
//
//   node tools/build-audit.mjs
//
// Input:  data/nds-colour-tokens.json   (from tools/build-data.mjs; Figma is the source)
//         data/semantic-pairs.json      (pairings to audit, with classification and evidence)
// Output: data/semantic-audit.json, data/semantic-audit.js, reports/NDS_Semantic_Pairing_Audit.md
//
// Read-only. Never talks to Figma. Node 18+, no dependencies.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(ROOT, 'data/nds-colour-tokens.json'), 'utf8'));
const pairsDef = JSON.parse(readFileSync(join(ROOT, 'data/semantic-pairs.json'), 'utf8'));
const BY_NAME = new Map(tokens.variables.map((v) => [v.name, v]));
const CONTEXTS = tokens.meta.contexts;
const CTX = new Map(CONTEXTS.map((c) => [c.id, c]));
const BRAND_PREFIX = { FTN: 'ftn', CP: 'casa', PSK: 'psk', LobBet: 'lob' };
const brandOf = (ctx) => ctx.label.split(' ')[0];

// ---------- Colour maths (WCAG 2.x) ----------
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (top, a, under) => top.map((c, i) => c * a + under[i] * (1 - a));
// Display value is truncated, never rounded up: 2.996:1 shows as 2.99 and fails 3:1 (WCAG does not allow rounding).
const r2 = (x) => Math.floor(x * 100) / 100;

const valueIn = (v, ctxId) => (v.collection === 'Base' ? v.resolvedByMode[v.modes[0]] : v.resolvedByContext[ctxId]);
const plain = (val) => (!val || val.error ? 'UNRESOLVED' : val.alpha < 1 ? `${val.hex} @ ${Math.round(val.alpha * 1000) / 10}%` : val.hex);
const finalPalette = (val) => (val?.chain?.length ? val.chain[val.chain.length - 1] : null);

// Evaluate one pair in one context.
function evaluate(pair, ctxId) {
  const bgV = BY_NAME.get(pair.background), fgV = BY_NAME.get(pair.foreground);
  const bg = valueIn(bgV, ctxId), fg = valueIn(fgV, ctxId);
  if (!bg || bg.error || !fg || fg.error) return { ctx: ctxId, status: 'unresolved', bg: plain(bg), fg: plain(fg) };
  const base = { ctx: ctxId, bg: plain(bg), fg: plain(fg), bgChain: bg.chain, fgChain: fg.chain };
  // Background translucent: the colour behind it is unknown, so the result depends on context.
  if (bg.alpha < 1) {
    const parents = ['color/background/base', 'color/surface/primary'].map((n) => ({ name: n, val: valueIn(BY_NAME.get(n), ctxId) }));
    const est = parents.map((p) => {
      const b = over(bg.rgba.slice(0, 3), bg.alpha, p.val.rgba.slice(0, 3));
      const f = fg.alpha < 1 ? over(fg.rgba.slice(0, 3), fg.alpha, b) : fg.rgba.slice(0, 3);
      const raw = ratio(f, b);
      return { over: p.name, raw, ratio: r2(raw), preview: { bg: b.map(Math.round), fg: f.map(Math.round) } };
    });
    const lo = Math.min(...est.map((e) => e.raw));
    est.forEach((e) => delete e.raw);
    return { ...base, status: 'context', ratio: r2(lo), estimates: est, preview: est[0].preview, ...thresholds(pair, lo), contextDependent: true };
  }
  const b = bg.rgba.slice(0, 3);
  const f = fg.alpha < 1 ? over(fg.rgba.slice(0, 3), fg.alpha, b) : fg.rgba.slice(0, 3);
  const raw = ratio(f, b);
  const t = thresholds(pair, raw);
  return { ...base, ratio: r2(raw), preview: { bg: b, fg: f.map(Math.round) }, composited: fg.alpha < 1, ...t, status: t.pass ? 'pass' : 'fail' };
}
function thresholds(pair, r) {
  if (pair.kind === 'non-text') return { ui: r >= 3, pass: r >= 3 };
  return { aa: r >= 4.5, aaLarge: r >= 3, aaa: r >= 7, aaaLarge: r >= 4.5, pass: r >= 4.5 };
}

// ---------- Patterns ----------
const ALL = CONTEXTS.map((c) => c.id);
const DARK = CONTEXTS.filter((c) => c.theme === 'Dark').map((c) => c.id);
const LIGHT = CONTEXTS.filter((c) => c.theme === 'Light').map((c) => c.id);
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
function pattern(results) {
  const fails = results.filter((x) => x.status === 'fail').map((x) => x.ctx);
  const ctxDep = results.some((x) => x.status === 'context');
  const ctxFails = results.filter((x) => x.status === 'context' && !x.pass).map((x) => x.ctx);
  if (!fails.length) return ctxDep ? (ctxFails.length ? 'context-risk' : 'context-pass') : 'pass';
  if (same(fails, ALL)) return 'fails-everywhere';
  if (same(fails, DARK)) return 'fails-dark';
  if (same(fails, LIGHT)) return 'fails-light';
  return 'fails-some-brands';
}
const PATTERN_LABEL = {
  pass: 'Passes everywhere', 'context-pass': 'Context-dependent (estimates pass)', 'context-risk': 'Context-dependent (estimates fail in some)',
  'fails-everywhere': 'Fails in every brand/theme', 'fails-dark': 'Fails in Dark only', 'fails-light': 'Fails in Light only', 'fails-some-brands': 'Fails in specific brands',
};

// ---------- Root-cause analysis ----------
const CATEGORY = { A: 'Wrong semantic usage', B: 'Wrong token value / alias', C: 'Invalid colour pairing', D: 'Cross-brand / theme inconsistency', E: 'Requires design decision' };

// A Brand-mode alias that ends in another brand's palette.
function crossBrandAlias(v, ctxId) {
  if (v.collection !== 'Brand') return null;
  const ctx = CTX.get(ctxId); const mine = BRAND_PREFIX[brandOf(ctx)];
  const pal = finalPalette(v.resolvedByContext[ctxId]);
  const m = pal && pal.match(/^palette\/brand\/(ftn|casa|psk|lob)-/);
  if (!m || m[1] === mine) return null;
  // Only suspicious if other brands use their own palette for this token.
  const others = CONTEXTS.filter((c) => brandOf(c) !== brandOf(ctx)).map((c) => finalPalette(v.resolvedByContext[c.id]) || '');
  const brandSpecificElsewhere = others.some((p) => { const mm = p.match(/^palette\/brand\/(ftn|casa|psk|lob)-/); return mm && mm[1] !== m[1]; });
  return brandSpecificElsewhere ? { token: v.name, ctx: ctx.label, resolvesTo: pal, expectedPrefix: mine } : null;
}

const pairs = pairsDef.pairs.map((p) => {
  const results = ALL.map((c) => evaluate(p, c));
  const pat = pattern(results);
  const bgV = BY_NAME.get(p.background), fgV = BY_NAME.get(p.foreground);
  const identicalDarkLight = [bgV, fgV].filter((v) => v.collection === 'Theme' && plain(v.resolvedByMode.Dark) === plain(v.resolvedByMode.Light)).map((v) => v.name);
  return {
    ...p, results, pattern: pat, patternLabel: PATTERN_LABEL[pat],
    minRatio: Math.min(...results.filter((x) => x.ratio != null).map((x) => x.ratio)),
    collections: { background: bgV.collection, foreground: fgV.collection },
    identicalDarkLight,
  };
});

const L0 = (c) => CTX.get(c)?.label ?? c;
const L = L0;
const byBrand = (x, list) => [...list].sort((a, b) => (brandOf(CTX.get(b.ctx)) === brandOf(CTX.get(x.ctx))) - (brandOf(CTX.get(a.ctx)) === brandOf(CTX.get(x.ctx))));
const sameBgDiffFg = (failing, passing) => { for (const x of failing) { const y = byBrand(x, passing).find((q) => q.bg === x.bg && q.fg !== x.fg); if (y) return { x, y }; } return null; };
const sameFgDiffBg = (failing, passing) => { for (const x of failing) { const y = byBrand(x, passing).find((q) => q.fg === x.fg && q.bg !== x.bg); if (y) return { x, y }; } return null; };
const findings = [];
function addFinding(f) { findings.push(f); }
for (const p of pairs) {
  if (p.note === 'exempt') continue;
  const failing = p.results.filter((x) => x.status === 'fail');
  const passing = p.results.filter((x) => x.status === 'pass');
  const ctxRisk = p.results.filter((x) => x.status === 'context' && !x.pass);
  if (!failing.length && !ctxRisk.length) continue;
  const bgV = BY_NAME.get(p.background), fgV = BY_NAME.get(p.foreground);
  const evidence = [];
  let category, confidence, hypothesis, next;
  const anomalies = failing.flatMap((x) => [crossBrandAlias(bgV, x.ctx), crossBrandAlias(fgV, x.ctx)]).filter(Boolean);
  const sameValue = failing.filter((x) => x.bg === x.fg);
  const mixed = p.collections.background !== p.collections.foreground;
  const brandVarying = (v) => v.collection === 'Brand' && new Set(ALL.map((c) => plain(v.resolvedByContext[c]))).size > 1;

  if (failing.length) {
    failing.forEach((x) => evidence.push(`${CTX.get(x.ctx).label}: ${p.foreground} ${x.fg} on ${p.background} ${x.bg} = ${x.ratio}:1 (${(x.fgChain || []).join(' > ')} on ${(x.bgChain || []).join(' > ')})`));
    if (passing.length) evidence.push(`Works in ${passing.map((x) => `${CTX.get(x.ctx).label} (${x.ratio}:1)`).join(', ')}`);
  }
  if (anomalies.length) {
    category = 'B'; confidence = 'High';
    hypothesis = `Brand-mode alias points at another brand's palette: ${[...new Set(anomalies.map((a) => `${a.token} in ${a.ctx} resolves to ${a.resolvesTo}`))].join('; ')}.`;
    anomalies.forEach((a) => evidence.push(`${a.token} [${a.ctx}] ends in ${a.resolvesTo}; other brands use their own palette for this token.`));
    next = 'Confirm the intended alias for the affected brand mode with design; check where the token is used before changing it.';
  } else if (sameValue.length && sameValue.length === failing.length) {
    category = p.classification === 'Confirmed pairing' ? 'B' : 'C'; confidence = 'High';
    hypothesis = `Foreground and background resolve to the same colour (${sameValue.map((x) => `${CTX.get(x.ctx).label} ${x.bg}`).join(', ')}).`;
    next = p.classification === 'Confirmed pairing'
      ? 'Either the foreground value is wrong for this pairing or the token is not meant for this surface; decide with design.'
      : 'Likely not a valid pairing; confirm the intended foreground for this surface.';
  } else if (!mixed && failing.length && sameBgDiffFg(failing, passing)) {
    const { x, y } = sameBgDiffFg(failing, passing);
    category = 'B'; confidence = 'Medium';
    hypothesis = `Same background, different foreground: in ${L(x.ctx)} ${p.foreground} resolves to ${x.fg} (${x.fgChain.join(' > ')}), but in ${L(y.ctx)} it resolves to ${y.fg} (${y.fgChain.join(' > ')}) on the same ${x.bg} background. The failing mode's foreground alias is the likely cause.`;
    next = `Check the ${p.foreground} alias for ${failing.map((f) => L(f.ctx)).join(', ')} against the working mode; review usages before changing it.`;
  } else if (!mixed && failing.length && sameFgDiffBg(failing, passing)) {
    const { x, y } = sameFgDiffBg(failing, passing);
    category = 'D'; confidence = 'Medium';
    hypothesis = `Same foreground, different background: in ${L(x.ctx)} ${p.background} resolves to ${x.bg} (${x.bgChain.join(' > ')}), much closer to the ${x.fg} foreground than in ${L(y.ctx)} (${y.bg}, ${y.bgChain.join(' > ')}).`;
    next = `Decide whether ${p.background} in ${failing.map((f) => L(f.ctx)).join(', ')} should use a different value, or whether the foreground needs a brand-specific value there.`;
  } else if (p.pattern === 'fails-everywhere') {
    category = p.classification === 'Needs design review' ? 'C' : 'E'; confidence = p.classification === 'Needs design review' ? 'Medium' : 'Medium';
    hypothesis = p.classification === 'Needs design review' ? 'The combination fails in every brand and theme; it is probably not an intended pairing.' : 'The pairing fails in every brand and theme; values may be intentionally decorative or the pairing needs redefining.';
    next = 'Decide whether this pairing should exist; if yes, choose a foreground that meets the threshold.';
  } else if (mixed && (brandVarying(bgV) || brandVarying(fgV))) {
    category = 'D'; confidence = 'Medium';
    const brandTok = brandVarying(fgV) ? fgV : bgV, themeTok = brandTok === fgV ? bgV : fgV;
    hypothesis = `${brandTok.name} (Brand) changes per brand while ${themeTok.name} (${themeTok.collection}) does not; the combination only fails where the brand colour lands too close to the neutral.`;
    next = 'Design decision: either add brand-aware variants for this use, restrict where the brand token can be used, or accept a brand-specific exception.';
  } else if (p.pattern === 'fails-dark' || p.pattern === 'fails-light') {
    category = 'D'; confidence = 'Medium';
    hypothesis = `Theme-specific failure: the pairing only fails in ${p.pattern === 'fails-dark' ? 'Dark' : 'Light'}.`;
    next = 'Check the failing-theme value of each token against the working theme.';
  } else if (failing.length) {
    category = p.kind === 'non-text' ? 'E' : 'D'; confidence = 'Medium';
    hypothesis = 'Brand-specific failure; values differ between brands for at least one token.';
    next = 'Compare the failing and working brand values with design.';
  } else {
    category = 'E'; confidence = 'Low';
    hypothesis = 'Translucent background: the real contrast depends on what sits behind it. Estimates over background/base and surface/primary fall below the threshold in some contexts.';
    ctxRisk.forEach((x) => evidence.push(`${CTX.get(x.ctx).label}: ${x.estimates.map((e) => `${e.ratio}:1 over ${e.over}`).join(', ')}`));
    next = 'Check the component in its real context; document the surfaces this fill may sit on.';
  }
  if (p.kind === 'text' && failing.length && failing.every((x) => x.aaLarge)) hypothesis += ` All failing contexts still pass large-text AA (3:1), so the pairing is only acceptable for large or bold text.`;
  if (failing.length && failing.every((x) => x.ratio >= 4.3 && x.ratio < 4.5)) hypothesis += ' Near miss: within 0.2 of the 4.5:1 threshold.';
  if (p.note) evidence.push(`Note: ${p.note}`);
  const confirmedFailure = failing.length > 0;
  let severity = 'Low';
  if (confirmedFailure && p.kind === 'text' && p.classification === 'Confirmed pairing') severity = 'High';
  else if (confirmedFailure && (category === 'B' || (p.classification === 'Strong candidate' && p.kind === 'text'))) severity = 'High';
  else if (confirmedFailure) severity = 'Medium';
  addFinding({
    pairId: p.id, background: p.background, foreground: p.foreground, kind: p.kind, classification: p.classification,
    pattern: p.pattern, patternLabel: p.patternLabel,
    failing: failing.map((x) => x.ctx), passing: passing.map((x) => x.ctx), contextRisk: ctxRisk.map((x) => x.ctx),
    values: (failing.length ? failing : ctxRisk).map((x) => ({ ctx: x.ctx, bg: x.bg, fg: x.fg, ratio: x.ratio })),
    minRatio: p.minRatio, category, categoryLabel: CATEGORY[category], severity, confidence,
    type: confirmedFailure ? 'Confirmed failure' : 'Hypothesis (context-dependent)',
    hypothesis, evidence, next,
  });
}

// Token-level alias anomalies that do not (yet) show up in a failing pair.
const seen = new Set(findings.flatMap((f) => [f.background, f.foreground]));
for (const v of tokens.variables.filter((x) => x.collection === 'Brand')) {
  const an = ALL.map((c) => crossBrandAlias(v, c)).filter(Boolean);
  if (!an.length) continue;
  addFinding({
    pairId: null, background: null, foreground: v.name, token: v.name, kind: 'token', classification: 'Token check',
    pattern: 'alias', patternLabel: 'Cross-brand alias',
    failing: an.map((a) => CONTEXTS.find((c) => c.label === a.ctx).id), passing: [], contextRisk: [],
    values: an.map((a) => ({ ctx: CONTEXTS.find((c) => c.label === a.ctx).id, fg: plain(v.resolvedByContext[CONTEXTS.find((c) => c.label === a.ctx).id]), resolvesTo: a.resolvesTo })),
    minRatio: null, category: 'B', categoryLabel: CATEGORY.B, severity: seen.has(v.name) ? 'Medium' : 'Medium', confidence: 'High',
    type: 'Confirmed alias anomaly',
    hypothesis: `${v.name} resolves to another brand's palette in ${an.map((a) => a.ctx).join(', ')}.`,
    evidence: an.map((a) => `${a.ctx}: ${v.name} > ${a.resolvesTo}; other brands resolve this token to their own palette.`),
    next: 'Confirm the intended value for these brand modes; review usages before changing the alias.',
  });
}

// Evidence-based findings that cannot be computed from token values alone.
const manual = [
  {
    pairId: pairs.find((p) => p.background === 'color/surface/inverted-bw' && p.foreground === 'color/content/primary')?.id,
    background: 'color/surface/inverted-bw', foreground: 'color/content/primary', kind: 'text', classification: 'Needs design review',
    pattern: 'investigation', patternLabel: 'Reported issue investigation',
    failing: [], passing: ALL, contextRisk: [], values: [], minRatio: 21,
    category: 'E', categoryLabel: CATEGORY.E, severity: 'High', confidence: 'Medium', type: 'Hypothesis requiring design review',
    hypothesis: 'The text pairing itself is not the failure: both tokens are Theme tokens, so they cannot differ by brand, and they resolve to black/white at 21:1 in all seven contexts. The reported FTN-works / PSK-fails behaviour most likely comes from (1) the inverted-bw fill sitting on a brand surface, where it fails 3:1 against the PSK Dark and FTN Light headers, or (2) PSK files binding the same-named variables from the separate "PSK New color - VL (Brand version)" library rather than canonical NDS.',
    evidence: [
      'Current Figma: color/surface/inverted-bw (Theme) Dark > palette/base/black, Light > palette/base/white; color/content/primary (Theme) Dark > palette/base/white, Light > palette/base/black. 21:1 in every context.',
      'Name check: inverted-bw follows the theme (black in Dark, white in Light) rather than inverting it; content/primary-inverted resolves to the same values as inverted-bw (1:1 if paired by name).',
      '2026-10-14 Register Button audit: inverted-bw fill vs brand header fails 3:1 in FTN Light (1.36:1) and PSK Dark (2.99:1).',
      'Library search: a separate library "PSK New color - VL (Brand version)" publishes variables with the same names (color/surface/inverted-bw key e16b7078..., color/content/primary key 6135029b...). Their values could not be read without importing them, which this read-only audit does not do.',
      'Published vs current: the published NDS library still lists color-perma/content/primary (key 186e19cb...), which no longer exists in the current file; consumers may be using a stale published version.',
    ],
    next: 'In the reported PSK screen, inspect which library the two variables come from and which Brand/Theme modes the frame sets. If canonical NDS: treat as a fill-on-brand-header problem (non-text 3:1) and decide on a brand-aware inverted fill. If the PSK library: align or retire the parallel variables.',
  },
];
manual.forEach(addFinding);

// Prioritise: confirmed text failures first, then alias anomalies, cross-brand, non-text, hypotheses.
const SEV = { High: 0, Medium: 1, Low: 2 };
const TYPE = { 'Confirmed failure': 0, 'Confirmed alias anomaly': 1, 'Hypothesis requiring design review': 2, 'Hypothesis (context-dependent)': 3 };
findings.sort((a, b) => SEV[a.severity] - SEV[b.severity] || TYPE[a.type] - TYPE[b.type] || (a.kind === 'text' ? 0 : 1) - (b.kind === 'text' ? 0 : 1) || (a.minRatio ?? 99) - (b.minRatio ?? 99));
findings.forEach((f, i) => { f.id = `SPA-${String(i + 1).padStart(3, '0')}`; });

const summary = {
  pairs: pairs.length,
  byClassification: Object.fromEntries(Object.keys(pairsDef.classifications).map((k) => [k, pairs.filter((p) => p.classification === k).length])),
  byPattern: Object.fromEntries(Object.keys(PATTERN_LABEL).map((k) => [k, pairs.filter((p) => p.pattern === k).length])),
  findings: findings.length,
  bySeverity: Object.fromEntries(['High', 'Medium', 'Low'].map((s) => [s, findings.filter((f) => f.severity === s).length])),
  byCategory: Object.fromEntries(Object.keys(CATEGORY).map((c) => [c, findings.filter((f) => f.category === c).length])),
};
const audit = {
  meta: { builtAt: new Date().toISOString(), source: tokens.meta.source, tokensExportedAt: tokens.meta.exportedAt, contexts: CONTEXTS.map(({ id, label, theme, brand }) => ({ id, label, theme, brand })),
    categories: CATEGORY, patterns: PATTERN_LABEL, classifications: pairsDef.classifications,
    method: [
      'Values resolved from the current Figma variables (Base, Theme, Brand) per brand/theme context.',
      'WCAG 2.x relative luminance. Text: AA 4.5:1, AA large 3:1, AAA 7:1, AAA large 4.5:1. Non-text: 3:1.',
      'Translucent foregrounds are composited over the background (exact).',
      'Translucent backgrounds are context-dependent: estimated over color/background/base and color/surface/primary, never treated as an absolute pass.',
      'Identical Dark/Light values are recorded but not treated as errors on their own.',
    ] },
  summary, pairs, findings,
};
writeFileSync(join(ROOT, 'data/semantic-audit.json'), JSON.stringify(audit, null, 1) + '\n');
writeFileSync(join(ROOT, 'data/semantic-audit.js'), '// Generated by tools/build-audit.mjs. Do not edit.\nwindow.NDS_AUDIT = ' + JSON.stringify(audit) + ';\n');

// ---------- Markdown report ----------
const md = [];
md.push('# NDS Semantic Colour Pairing Audit', '',
  `Source: ${tokens.meta.source.fileName} (\`${tokens.meta.source.fileKey}\`), variables exported ${tokens.meta.exportedAt.slice(0, 16).replace('T', ' ')} UTC. Report built ${audit.meta.builtAt.slice(0, 16).replace('T', ' ')} UTC.`,
  'Read-only audit. Nothing in Figma was changed. Findings are inputs for a design workshop, not decisions.', '',
  '## Summary', '',
  `- Pairings audited: ${summary.pairs} (${Object.entries(summary.byClassification).map(([k, n]) => `${k}: ${n}`).join(', ')})`,
  `- Outcome: ${Object.entries(summary.byPattern).filter(([, n]) => n).map(([k, n]) => `${PATTERN_LABEL[k]}: ${n}`).join('; ')}`,
  `- Findings: ${summary.findings} (High ${summary.bySeverity.High}, Medium ${summary.bySeverity.Medium}, Low ${summary.bySeverity.Low})`,
  `- By category: ${Object.entries(summary.byCategory).filter(([, n]) => n).map(([k, n]) => `${k}. ${CATEGORY[k]}: ${n}`).join('; ')}`, '',
  '## Method', '', ...audit.meta.method.map((m) => `- ${m}`), '',
  '## Prioritised findings', '',
  '| ID | Severity | Type | Token pair | Brand / Theme failing | Values | Lowest ratio | Category | Confidence |',
  '|---|---|---|---|---|---|---|---|---|');
for (const f of findings) {
  const pair = f.background ? `\`${f.foreground}\` on \`${f.background}\`` : `\`${f.token}\``;
  const vals = f.values.slice(0, 3).map((v) => `${L(v.ctx)}: ${v.fg}${v.bg ? ` on ${v.bg}` : ''}${v.ratio != null ? ` (${v.ratio}:1)` : ''}`).join('<br>') + (f.values.length > 3 ? `<br>+${f.values.length - 3} more` : '');
  md.push(`| ${f.id} | ${f.severity} | ${f.type} | ${pair} | ${(f.failing.length ? f.failing : f.contextRisk).map(L).join(', ') || 'None (see hypothesis)'} | ${vals || 'See evidence'} | ${f.minRatio ?? 'n/a'} | ${f.category}. ${f.categoryLabel} | ${f.confidence} |`);
}
md.push('', '## Finding details', '');
for (const f of findings) {
  md.push(`### ${f.id}: ${f.background ? `${f.foreground} on ${f.background}` : f.token}`, '',
    `- Severity: ${f.severity} · Type: ${f.type} · Category: ${f.category}. ${f.categoryLabel} · Confidence: ${f.confidence}`,
    `- Pairing: ${f.classification}${f.kind !== 'token' ? ` · ${f.kind}` : ''} · ${f.patternLabel}`,
    `- Root cause hypothesis: ${f.hypothesis}`,
    '- Evidence:', ...f.evidence.map((e) => `  - ${e}`),
    `- Recommended next step: ${f.next}`, '- Review status: Not reviewed', '');
}
md.push('## Pairings that pass in every brand and theme', '', ...pairs.filter((p) => p.pattern === 'pass').map((p) => `- \`${p.foreground}\` on \`${p.background}\` (${p.kind}, lowest ${p.minRatio}:1, ${p.classification})`), '');
mkdirSync(join(ROOT, 'reports'), { recursive: true });
writeFileSync(join(ROOT, 'reports/NDS_Semantic_Pairing_Audit.md'), md.join('\n'));

console.log(`Pairs: ${summary.pairs}; findings: ${summary.findings} (High ${summary.bySeverity.High}, Medium ${summary.bySeverity.Medium}, Low ${summary.bySeverity.Low})`);
console.log('Patterns:', JSON.stringify(summary.byPattern));
console.log('Categories:', JSON.stringify(summary.byCategory));
