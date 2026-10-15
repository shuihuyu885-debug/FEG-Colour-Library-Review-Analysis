// NDS Colour Explorer: Figma export (read-only).
//
// Exports every local COLOR variable of the open Figma file (the canonical
// NDS / Tokens / Variables library) with its collection, modes, description,
// scopes and raw values (alias or colour). It never writes to the file.
//
// Two ways to run it:
// 1. As a Figma development plugin: Plugins > Development > Import plugin from
//    manifest, pick tools/figma-plugin/manifest.json, run "NDS Colour Export".
//    Copy the JSON from the window into data/figma-variables-raw.json.
// 2. Through an agent with Figma Plugin API access: run everything above the
//    "Plugin UI" line, then `return await exportColourVariables();`
//    (split the result per collection if the agent has a size limit).

const SOURCE = {
  fileKey: 'RKduL8UHSJyIMVyotTzSZS',
  fileName: 'NDS / Tokens / Variables library',
  url: 'https://www.figma.com/design/RKduL8UHSJyIMVyotTzSZS/NDS---Tokens---Variables-library',
};

async function exportColourVariables() {
  const round = (x) => Math.round(x * 1e6) / 1e6;
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = (await figma.variables.getLocalVariablesAsync()).filter((v) => v.resolvedType === 'COLOR');
  return {
    source: SOURCE,
    exportedAt: new Date().toISOString(),
    exporter: 'tools/figma-plugin (Figma Plugin API, read-only)',
    collections: collections.map((c) => ({ id: c.id, key: c.key, name: c.name, defaultModeId: c.defaultModeId, modes: c.modes })),
    variables: variables.map((v) => ({
      id: v.id,
      key: v.key,
      name: v.name,
      collectionId: v.variableCollectionId,
      resolvedType: v.resolvedType,
      description: v.description,
      scopes: v.scopes,
      hiddenFromPublishing: v.hiddenFromPublishing,
      codeSyntax: v.codeSyntax || {},
      valuesByMode: Object.fromEntries(
        Object.entries(v.valuesByMode).map(([modeId, val]) => [
          modeId,
          val && val.type === 'VARIABLE_ALIAS'
            ? { type: 'VARIABLE_ALIAS', id: val.id }
            : { r: round(val.r), g: round(val.g), b: round(val.b), a: round(val.a) },
        ])
      ),
    })),
  };
}

// ---- Plugin UI (only used when run as a development plugin) ----
exportColourVariables().then((data) => {
  const json = JSON.stringify(data, null, 1).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  figma.showUI(
    `<p style="font:12px sans-serif">${data.variables.length} colour variables. ` +
      `Copy into <b>data/figma-variables-raw.json</b>, then run <code>node tools/build-data.mjs</code>.</p>` +
      `<textarea style="width:100%;height:400px;font:11px monospace">${json}</textarea>`,
    { width: 560, height: 470 }
  );
});
