# Token discussions: data model and backend plan

Discussions are comments attached to colour tokens, to a token in one brand/theme, or to a colour pair in one brand/theme.

- **Storage:** they are kept **separate from the colour token data**, in their own browser storage key and export file.
- **Token refreshes:** refreshing the token export (`node tools/build-data.mjs`) never touches them.
- **Effect on Figma:** none. Resolving a discussion changes nothing in Figma or in token values.

Code: `discussions.js` holds the data model, persistence and merge logic. `app.js` holds the panel and the indicators.

## Targets

Every thread points at a stable identifier built from Figma **variable IDs**, not names:

| Type | Key | Example |
|---|---|---|
| Token | `token:<variableId>` | `token:VariableID:1:169` (`color/content/on-active`) |
| Mode | `mode:<variableId>@<contextId>` | `mode:VariableID:1:169@cp-dark` |
| Pair | `pair:<backgroundId>\|<foregroundId>@<contextId>` | `pair:VariableID:1:165\|VariableID:1:169@cp-dark` |

- **Context IDs:** `ftn-dark`, `ftn-light`, `cp-dark`, `cp-light`, `psk-dark`, `psk-light`, `lobbet`.
- **Name snapshots:** each target also stores the token name, collection and context label, so a thread stays readable if a token is later renamed or removed from the export.

## Thread

```json
{
  "id": "thr_lx3k9a1b2c3",
  "schema": "nds-discussions/1",
  "target": {
    "type": "mode",
    "key": "mode:VariableID:1:169@cp-dark",
    "tokenIds": ["VariableID:1:169"],
    "tokenId": "VariableID:1:169",
    "tokenName": "color/content/on-active",
    "collection": "Brand",
    "context": "cp-dark",
    "contextLabel": "CP Dark"
  },
  "author": "Yuanjie",
  "createdAt": "2026-10-15T14:02:11.000Z",
  "updatedAt": "2026-10-15T15:40:02.000Z",
  "body": "On CP Dark this resolves to white on Fortuna yellow. Intended?",
  "status": "open",
  "figmaLinks": ["https://www.figma.com/design/..."],
  "replies": [
    { "id": "rep_...", "author": "Dev", "createdAt": "2026-10-15T15:40:02.000Z", "body": "Looks like a copy from FTN." }
  ],
  "events": [
    { "id": "evt_...", "at": "2026-10-15T14:02:11.000Z", "by": "Yuanjie", "type": "opened" }
  ],
  "auditIds": ["r..."],
  "external": {}
}
```

**Pair targets** carry `background` and `foreground` objects (`id`, `name`, `collection`) in place of `tokenId`/`tokenName`. `tokenIds` always lists every token involved, which drives the per-token comment counts.

**Event types:**
- `opened`
- `resolved`
- `reopened`
- `link-added`
- `audit-linked`

Replies are kept in `replies`. History is `events` plus `replies`, and nothing is ever removed.

## Audit integration

Audit items (in the Audit & Decisions view) carry `relatedThreads` (thread IDs) and `finalAction`. A thread carries `auditIds`, so the link works in both directions.

- **JSON export:** an audit JSON export also includes a snapshot of the linked threads under `discussions`. Importing that file merges the snapshot back into the discussion store.
- **CSV export:** lists the thread IDs in a `Related discussions` column.

## Persistence today

- **Storage:** `localStorage`, under the key `nds-colour-explorer.discussions.v1`. The stored value is `{ schema, savedAt, threads }`.
- **Export and import:** the Discussion panel footer exports and imports the file.
- **Import merges by thread ID:**
  - replies and events are combined by ID
  - links and audit IDs are combined
  - status follows whichever copy was updated most recently
- **Nothing is deleted on import**, so files from several reviewers can be imported one after another to combine their discussions.

## Plan for a shared backend (not implemented)

The store talks to storage only through an adapter with two methods:

```js
window.NDSDiscussions.useAdapter({
  name: 'github',
  load() { /* return Thread[] */ },
  save(threads) { /* persist; return true/false */ },
});
```

The preferred shared backend is GitHub Issues on `shuihuyu885-debug/FEG_Design-Dev-hand-off`.

| Discussion | GitHub |
|---|---|
| Thread | Issue |
| `body`, `target` | Issue body: the comment text plus a fenced JSON block holding `target`, `figmaLinks` and `auditIds` |
| Title | `[NDS colour] <target label>`, for example `[NDS colour] color/content/on-active · CP Dark` |
| Reply | Issue comment |
| `status` open / resolved | Issue open / closed (reopen means reopen) |
| `target.type` | Label `nds:token`, `nds:mode` or `nds:pair` |
| Author / timestamps | GitHub user and timestamps |
| `external.github` | `{ issueNumber, url }`, stored after the first sync |

**Before any live connection is built, these must be confirmed:**
1. **Authentication:** for example a GitHub App or a fine-grained token entered by each user at run time. **Never hardcode credentials** in this repository.
2. **Access:** who may read and write issues on the repository.
3. **Repository visibility:** discussions may mention unreleased brand work.

Until then the tool stays local-only.
