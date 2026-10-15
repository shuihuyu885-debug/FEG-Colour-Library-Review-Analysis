# NDS Colour Explorer

A read-only, browser-based dashboard for reviewing the NDS Foundation colour tokens. Use it to explore the colour architecture, compare brands and themes, check contrast, and record review decisions.

It does not edit tokens. Nothing in this folder writes to Figma.

## Opening it

Double-click `index.html`. The page opens straight from disk in any modern browser, with no server and no install, because the data is also shipped as a script (`data/nds-colour-tokens.js`).

The interface follows Apple's Human Interface Guidelines:
- system font
- system colours
- segmented control navigation
- a translucent header

It switches between light and dark automatically with your system appearance. Printouts are always light.

If your browser blocks local files, or you prefer a server:

```sh
cd NDS_Colour_Explorer
python3 -m http.server 8000
# then open http://localhost:8000
```

## Source of truth

| | |
|---|---|
| Figma file | NDS / Tokens / Variables library (`RKduL8UHSJyIMVyotTzSZS`) |
| Collections | Base (1 mode), Theme (Dark, Light), Brand (FTN Dark, FTN Light, CP Light, CP Dark, PSK Light, PSK Dark, LobBet) |
| Exported | 213 colour variables: Base 105, Theme 56, Brand 52 |

The export date and time appear in the dashboard header and in every printout.

No legacy Sportsbook tokens and no GitHub snapshots are used.

## Files

| Path | What it is |
|---|---|
| `index.html`, `styles.css`, `app.js` | The dashboard: plain HTML, CSS and JavaScript, with no frameworks or dependencies. |
| `discussions.js` | Discussion data model, local persistence and import/merge logic, kept separate from the UI. |
| `docs/discussions.md` | Discussion data structure and the plan for a shared backend. |
| `data/semantic-pairs.json` | Pairings audited by the Semantic Pairing Audit (editable). |
| `tools/build-audit.mjs` | Builds `data/semantic-audit.json`/`.js` and `reports/NDS_Semantic_Pairing_Audit.md`. |
| `data/figma-variables-raw.json` | Raw export from Figma: collections, modes, variable IDs and keys, names, descriptions, scopes, and the value per mode (alias or colour). |
| `data/nds-colour-tokens.json` | **Complete exported token data**: the raw export plus resolved values, alias chains, "aliased by" lists and resolution rules. |
| `data/nds-colour-tokens.js` | The same data as a script, so `index.html` works from disk. |
| `tools/figma-plugin/` | Read-only Figma development plugin that produces the raw export. |
| `tools/build-data.mjs` | Resolves aliases and writes the two data files (Node 18+, no dependencies). |

## The four views

### 1. Token Explorer

- **Sidebar:** filter by collection (Base, Theme, Brand) and by semantic group (for example `color/content` or `palette/grey`).
- **Table:** swatch, token name, collection, group, description, resolved HEX or RGBA, direct alias and available modes.
- **Show values for:** chooses the brand × theme context. The mode strip under each swatch shows every mode at once.
- **Detail panel:** click a row to open it. It shows:
  - the variable ID and key
  - scopes
  - the full alias chain for every mode
  - the resolved value in every brand × theme context
  - which variables alias this one

### 2. Brand × Theme Matrix

- **Columns:** FTN Dark, FTN Light, CP Dark, CP Light, PSK Dark, PSK Light, with LobBet in a separate column.
- **Rows:** every Theme and Brand token, grouped by semantic group.
- **Filters:** search, collection, group, and behaviour:
  - Same in all six
  - Varies by theme only
  - Varies by brand
- **Clicking a value** highlights every cell with the same resolved value and shows the alias chain. A shared value is only a pointer. It is not evidence that tokens are redundant.

### 3. Colour Pairing Lab

- **Choosing a pair:** pick a background token and a foreground token, then add alternative foregrounds to compare them side by side.
- **Each context shows:**
  - a live sample
  - the WCAG contrast ratio
  - normal text AA (4.5:1)
  - large text AA (3:1)
  - UI and non-text (3:1)
- **Translucent colours:**
  - Foregrounds are composited over the background.
  - Backgrounds are composited over `color/background/base` of the same context.
- A passing ratio does not mean a pairing is semantically correct.

### 4. Audit & Decisions

- **Flagging:** use "Flag for review" in the Explorer, Matrix or Pairing Lab, or add an item by hand.
- **Fields:** token or pair, collection, brand/theme, current values, issue type, evidence, proposed solution, decision status and notes.
- **Storage:** items are stored in this browser only (localStorage). Use **Export JSON** or **Export CSV** to share them.
- **Import:** **Import** accepts either format and merges by ID, so re-importing an export updates items instead of duplicating them.

### 5. Semantic Pairing Audit

This is a read-only audit of foreground/background combinations across FTN, CP and PSK (Dark and Light) and LobBet.

**Pairings**
- **Where they are defined:** `data/semantic-pairs.json`, which the design team can edit.
- **What each pairing records:** a classification and the evidence for it.
- **Classifications:**
  - **Confirmed pairing**, for example the explicit `on-*` naming.
  - **Strong candidate**, from names, descriptions or audited component usage.
  - **Needs design review**.
- Not every surface is paired with every content token.

**Contrast check**
- WCAG 2.x contrast for every pairing in all seven contexts:
  - Text: AA 4.5:1, AA large 3:1 and AAA.
  - Non-text: 3:1.
- Ratios are compared unrounded and shown truncated, so 2.996:1 shows as 2.99 and fails.
- Translucent backgrounds are marked context-dependent rather than passed.

**Contrast matrix**
- Each cell shows a live preview, the ratio and the status. Failing cells are highlighted.
- Click a cell to see:
  - the alias chains for both tokens
  - a side-by-side comparison with a working mode (same brand first)
  - the findings
  - comment buttons at pair, mode and token level

**Findings report**
- A prioritised list (`SPA-001`...). Each finding records:
  - severity
  - type: confirmed failure, alias anomaly, or hypothesis
  - category: A. wrong semantic usage, B. wrong value or alias, C. invalid pairing, D. cross-brand/theme inconsistency, or E. requires design decision
  - values
  - lowest ratio
  - root-cause hypothesis
  - evidence
  - confidence
  - next step
  - review status
- **Add to Audit** pre-fills an audit item tagged with the finding ID. Once it exists, the button opens that item instead, so existing decisions are never overwritten.

**Report and rebuild**
- `reports/NDS_Semantic_Pairing_Audit.md` is a printable report of the same findings.
- To rebuild after a data update, or after editing the pairings:

```sh
node tools/build-data.mjs     # token data from the Figma export
node tools/build-audit.mjs    # audit, dashboard data and report
```

## Comments and discussions

Leave comments on tokens and colour pairs, and keep the discussion next to the colour, in the same way as Figma comments.

**Three levels of comment:**
- **Token:** for example `color/content/on-active`. Use the comment icon next to the token in the Explorer or the Matrix.
- **Token in one brand / theme:** for example `color/content/on-active` in CP Dark. Click a Matrix cell, then choose **Comment on this mode**.
- **Colour pair in one brand / theme:** a background, a foreground and a brand/theme, for example `color/content/on-active` on `color/content/active` in CP Dark. Use the comment icon beside the contrast ratio in the Pairing Lab.

**The Discussion panel** opens on the right. It shows:
- the token or pair
- its collection
- the selected brand / theme
- the current colour and HEX (or the contrast, for a pair)
- every thread, with authors, timestamps, replies and history

From the panel you can:
- add Figma links
- **Resolve** or **Reopen** a thread
- turn a thread into an **audit issue**

Several discussions can exist on the same target. For token-level threads, **All on this token** shows the complete history, including mode and pair threads.

**Indicators and filters:**
- A blue count shows open discussions. A grey count means all discussions there are resolved.
- In the Matrix, a small dot on a cell marks a mode-level discussion, so the matrix stays uncluttered.
- **Unresolved comments** in the Explorer and the Matrix filters to tokens with open discussions.
- **Comments** in the header lists every discussion.

**Your name** is asked for once, and recorded with each comment.

**Storage:**
- Discussions are stored in this browser, separately from the token data, and survive data refreshes.
- Use **Export** and **Import** in the panel footer to share them. Import merges by thread ID and never deletes.

**Audit link:**
- **Create audit issue** pre-fills an audit item with the discussion transcript.
- The audit item lists its related discussions and the **Final agreed action**, and the thread shows its audit status.

Resolving a discussion never changes Figma or any token value.

The data model and a plan for a future GitHub Issues backend are in `docs/discussions.md`. That backend is not connected: authentication, access and repository visibility must be confirmed first.

## Printing

1. Choose **A3 landscape** or **A2 landscape** in the header.
2. Click **Print this view**.

The printout:
- hides navigation and controls
- uses a white background
- repeats table headers on each page
- prints swatches in colour
- carries a line with the source file, data export time, print time and active filters

What each view prints:

| View | Printout |
|---|---|
| Token Explorer | Full Token Overview, with the current filters (choose "All collections" for everything) |
| Matrix | Filtered Brand × Theme Matrix |
| Pairing Lab | Colour Pairing Comparison |
| Audit | Audit & Decision List |

## How values are resolved

- **Base:** has one mode.
- **Theme tokens:** resolve in the context's Theme mode (Dark or Light).
- **Brand tokens:** resolve in the context's Brand mode.
- **Aliases into another collection:** resolve in the mode that the context pins for that collection.
- **Aliases within the same collection:** keep the same mode.
- **LobBet:** exists only as a Brand mode, so it is paired with Theme Dark.

`tools/build-data.mjs` never guesses. If a value cannot be resolved (a missing variable, a missing mode or an alias cycle), it is flagged:
- in a banner at the top of the dashboard
- as "Unresolved" in the tables

The build also exits with an error.

In the current export, all 1,337 resolved values resolved.

## Updating the data when Figma changes

1. **Export from Figma.** Open the canonical NDS / Tokens / Variables library in the Figma desktop app.
   - Go to Plugins > Development > Import plugin from manifest, and pick `tools/figma-plugin/manifest.json`.
   - Run **NDS Colour Export**.
   - Copy the JSON from the window into `data/figma-variables-raw.json`.
   - The plugin only reads variables. It has no network access.
2. **Build.**
   ```sh
   node tools/build-data.mjs
   ```
   This must end with `All values resolved.`
3. **Reload** `index.html`.

Audit notes are kept in the browser, so they survive data updates.

## Validation done for this export

- **Counts:** 213 colour variables exported, which matches the Figma collections (105 / 56 / 52). 1,337 values resolved, 0 unresolved.
- **Cross-check against Figma:**
  - 474 of 474 brand/theme values match the resolved values recorded from Figma during the 2026-10-11 Sportsbook migration.
  - That check covers every canonical Theme and Brand destination in all six brand/theme combinations.
- **Browser test (headless Chrome):**
  - All four views render with no console errors.
  - Filters, the detail panel and matrix highlighting work.
  - Contrast was checked against a reference pair: white on black gives 21.00:1.
  - The audit add, export and import round trip works for both CSV and JSON, including quotes, commas and line breaks.
  - The print layout was checked.
