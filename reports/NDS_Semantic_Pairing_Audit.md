# NDS Semantic Colour Pairing Audit

Source: NDS / Tokens / Variables library (`RKduL8UHSJyIMVyotTzSZS`), variables exported 2026-10-15 13:46 UTC. Report built 2026-10-15 14:36 UTC.
Read-only audit. Nothing in Figma was changed. Findings are inputs for a design workshop, not decisions.

## Summary

- Pairings audited: 62 (Confirmed pairing: 17, Strong candidate: 37, Needs design review: 8)
- Outcome: Passes everywhere: 33; Context-dependent (estimates pass): 4; Context-dependent (estimates fail in some): 4; Fails in every brand/theme: 7; Fails in Dark only: 1; Fails in Light only: 1; Fails in specific brands: 12
- Findings: 27 (High 13, Medium 10, Low 4)
- By category: B. Wrong token value / alias: 4; C. Invalid colour pairing: 3; D. Cross-brand / theme inconsistency: 13; E. Requires design decision: 7

## Method

- Values resolved from the current Figma variables (Base, Theme, Brand) per brand/theme context.
- WCAG 2.x relative luminance. Text: AA 4.5:1, AA large 3:1, AAA 7:1, AAA large 4.5:1. Non-text: 3:1.
- Translucent foregrounds are composited over the background (exact).
- Translucent backgrounds are context-dependent: estimated over color/background/base and color/surface/primary, never treated as an absolute pass.
- Identical Dark/Light values are recorded but not treated as errors on their own.

## Prioritised findings

| ID | Severity | Type | Token pair | Brand / Theme failing | Values | Lowest ratio | Category | Confidence |
|---|---|---|---|---|---|---|---|---|
| SPA-001 | High | Confirmed failure | `color/content/on-content-primary` on `color/content/primary` | FTN Dark, FTN Light, CP Dark, CP Light, PSK Dark, PSK Light, LobBet | FTN Dark: #FFFFFF on #FFFFFF (1:1)<br>FTN Light: #000000 on #000000 (1:1)<br>CP Dark: #FFFFFF on #FFFFFF (1:1)<br>+4 more | 1 | B. Wrong token value / alias | High |
| SPA-002 | High | Confirmed failure | `color/content/primary-inverted` on `color/surface/inverted-bw` | FTN Dark, FTN Light, CP Dark, CP Light, PSK Dark, PSK Light, LobBet | FTN Dark: #000000 on #000000 (1:1)<br>FTN Light: #FFFFFF on #FFFFFF (1:1)<br>CP Dark: #000000 on #000000 (1:1)<br>+4 more | 1 | C. Invalid colour pairing | High |
| SPA-003 | High | Confirmed failure | `color/content/on-active` on `color/surface/active` | FTN Light | FTN Light: #FFFFFF on #FFDB01 (1.36:1) | 1.36 | B. Wrong token value / alias | Medium |
| SPA-004 | High | Confirmed failure | `color/content/selected` on `color/surface/primary` | FTN Light | FTN Light: #FFDB01 on #FFFFFF (1.36:1) | 1.36 | D. Cross-brand / theme inconsistency | Medium |
| SPA-005 | High | Confirmed failure | `color/content/offer-badge` on `color/surface/primary` | FTN Light, CP Dark, PSK Dark | FTN Light: #C8E651 on #FFFFFF (1.41:1)<br>CP Dark: #256FD2 on #22222A (3.21:1)<br>PSK Dark: #DD3107 on #22222A (3.39:1) | 1.41 | D. Cross-brand / theme inconsistency | Medium |
| SPA-006 | High | Confirmed failure | `color/content/on-active` on `color/surface-hover/active` | FTN Light, LobBet | FTN Light: #FFFFFF on #F1CF00 (1.53:1)<br>LobBet: #FFFFFF on #2AD47F (1.94:1) | 1.53 | D. Cross-brand / theme inconsistency | Medium |
| SPA-007 | High | Confirmed failure | `color/content/on-brand` on `color/surface-hover/brand` | LobBet | LobBet: #FFFFFF on #2AD47F (1.94:1) | 1.94 | D. Cross-brand / theme inconsistency | Medium |
| SPA-008 | High | Confirmed failure | `color-perma/content/on-active` on `color-perma/surface/active-hover` | LobBet | LobBet: #FFFFFF on #2AD47F (1.94:1) | 1.94 | D. Cross-brand / theme inconsistency | Medium |
| SPA-009 | High | Confirmed failure | `color/content/on-selected` on `color/surface-hover/selected` | LobBet | LobBet: #FFFFFF on #2AD47F (1.94:1) | 1.94 | D. Cross-brand / theme inconsistency | Medium |
| SPA-010 | High | Confirmed failure | `color/content/on-money` on `color/meaning/money` | FTN Dark, FTN Light, CP Dark, CP Light, PSK Dark, PSK Light, LobBet | FTN Dark: #000000 on #0E7C1D (3.91:1)<br>FTN Light: #000000 on #0E7C1D (3.91:1)<br>CP Dark: #000000 on #0E7C1D (3.91:1)<br>+4 more | 3.91 | E. Requires design decision | Medium |
| SPA-011 | High | Confirmed failure | `color/content/on-positive` on `color/meaning-hover/positive` | FTN Dark, CP Dark, PSK Dark, LobBet | FTN Dark: #FFFFFF on #119522 (3.92:1)<br>CP Dark: #FFFFFF on #119522 (3.92:1)<br>PSK Dark: #FFFFFF on #119522 (3.92:1)<br>+1 more | 3.92 | D. Cross-brand / theme inconsistency | Medium |
| SPA-012 | High | Confirmed failure | `color/content/placeholder` on `color/surface/input` | FTN Light, CP Light, PSK Light | FTN Light: #64647D on #E3E3E9 (4.48:1)<br>CP Light: #64647D on #E3E3E9 (4.48:1)<br>PSK Light: #64647D on #E3E3E9 (4.48:1) | 4.48 | D. Cross-brand / theme inconsistency | Medium |
| SPA-013 | High | Hypothesis requiring design review | `color/content/primary` on `color/surface/inverted-bw` | None (see hypothesis) | See evidence | 21 | E. Requires design decision | Medium |
| SPA-014 | Medium | Confirmed failure | `color/content/on-sub-header` on `color/surface/brand` | CP Dark, CP Light, LobBet | CP Dark: #DFDFE6 on #D2252A (3.92:1)<br>CP Light: #DFDFE6 on #D2252A (3.92:1)<br>LobBet: #DFDFE6 on #1B8751 (3.41:1) | 3.41 | D. Cross-brand / theme inconsistency | Medium |
| SPA-015 | Medium | Confirmed failure | `color/surface/selected` on `color/surface/brand` | FTN Dark, FTN Light, CP Dark, CP Light, PSK Dark, PSK Light, LobBet | FTN Dark: #FFDB01 on #FFDB01 (1:1)<br>FTN Light: #FFDB01 on #FFDB01 (1:1)<br>CP Dark: #D2252A on #D2252A (1:1)<br>+4 more | 1 | C. Invalid colour pairing | High |
| SPA-016 | Medium | Confirmed failure | `color/surface/inverted-bw` on `color/surface/primary` | FTN Dark, FTN Light, CP Dark, CP Light, PSK Dark, PSK Light, LobBet | FTN Dark: #000000 on #22222A (1.33:1)<br>FTN Light: #FFFFFF on #FFFFFF (1:1)<br>CP Dark: #000000 on #22222A (1.33:1)<br>+4 more | 1 | C. Invalid colour pairing | Medium |
| SPA-017 | Medium | Confirmed failure | `color/border/input` on `color/surface/primary` | FTN Dark, FTN Light, CP Dark, CP Light, PSK Dark, PSK Light, LobBet | FTN Dark: #363644 on #22222A (1.32:1)<br>FTN Light: #B0B0C0 on #FFFFFF (2.13:1)<br>CP Dark: #363644 on #22222A (1.32:1)<br>+4 more | 1.32 | E. Requires design decision | Medium |
| SPA-018 | Medium | Confirmed failure | `color/border/brand` on `color/surface/primary` | FTN Light, PSK Dark | FTN Light: #FFDB01 on #FFFFFF (1.36:1)<br>PSK Dark: #1752BF on #22222A (2.25:1) | 1.36 | D. Cross-brand / theme inconsistency | Medium |
| SPA-019 | Medium | Confirmed failure | `color/meaning/live` on `color/surface/primary` | FTN Light, CP Dark, PSK Dark, LobBet | FTN Light: #FFDB01 on #FFFFFF (1.36:1)<br>CP Dark: #0E7C1D on #22222A (2.94:1)<br>PSK Dark: #0E7C1D on #22222A (2.94:1)<br>+1 more | 1.36 | D. Cross-brand / theme inconsistency | Medium |
| SPA-020 | Medium | Confirmed failure | `color/surface/inverted-bw` on `color/surface/brand` | FTN Light, PSK Dark | FTN Light: #FFFFFF on #FFDB01 (1.36:1)<br>PSK Dark: #000000 on #1752BF (2.99:1) | 1.36 | D. Cross-brand / theme inconsistency | Medium |
| SPA-021 | Medium | Confirmed failure | `color/border/selected` on `color/surface/primary` | PSK Dark | PSK Dark: #1752BF on #22222A (2.25:1) | 2.25 | D. Cross-brand / theme inconsistency | Medium |
| SPA-022 | Medium | Confirmed alias anomaly | `color/content/selected` | CP Dark | CP Dark: #FFDB01 | n/a | B. Wrong token value / alias | High |
| SPA-023 | Medium | Confirmed alias anomaly | `color/content/active` | CP Dark | CP Dark: #FFDB01 | n/a | B. Wrong token value / alias | High |
| SPA-024 | Low | Hypothesis (context-dependent) | `color/content/primary` on `color/overlay/tooltip-default` | FTN Light, CP Light, PSK Light | FTN Light: #000000 on #141419 @ 80% (2:1)<br>CP Light: #000000 on #141419 @ 80% (2:1)<br>PSK Light: #000000 on #141419 @ 80% (2:1) | 2 | E. Requires design decision | Low |
| SPA-025 | Low | Hypothesis (context-dependent) | `color/content/on-positive` on `color/overlay/positive` | FTN Light, CP Light, PSK Light | FTN Light: #FFFFFF on #0E7C1D @ 80% (3.69:1)<br>CP Light: #FFFFFF on #0E7C1D @ 80% (3.69:1)<br>PSK Light: #FFFFFF on #0E7C1D @ 80% (3.69:1) | 3.69 | E. Requires design decision | Low |
| SPA-026 | Low | Hypothesis (context-dependent) | `color/content/on-info` on `color/overlay/info` | FTN Light, CP Light, PSK Light | FTN Light: #FFFFFF on #1661C4 @ 80% (3.97:1)<br>CP Light: #FFFFFF on #1661C4 @ 80% (3.97:1)<br>PSK Light: #FFFFFF on #1661C4 @ 80% (3.97:1) | 3.97 | E. Requires design decision | Low |
| SPA-027 | Low | Hypothesis (context-dependent) | `color/content/on-negative` on `color/overlay/error` | FTN Light, CP Light, PSK Light | FTN Light: #FFFFFF on #C42D16 @ 80% (4.09:1)<br>CP Light: #FFFFFF on #C42D16 @ 80% (4.09:1)<br>PSK Light: #FFFFFF on #C42D16 @ 80% (4.09:1) | 4.09 | E. Requires design decision | Low |

## Finding details

### SPA-001: color/content/on-content-primary on color/content/primary

- Severity: High · Type: Confirmed failure · Category: B. Wrong token value / alias · Confidence: High
- Pairing: Confirmed pairing · text · Fails in every brand/theme
- Root cause hypothesis: Foreground and background resolve to the same colour (FTN Dark #FFFFFF, FTN Light #000000, CP Dark #FFFFFF, CP Light #000000, PSK Dark #FFFFFF, PSK Light #000000, LobBet #FFFFFF).
- Evidence:
  - FTN Dark: color/content/on-content-primary #FFFFFF on color/content/primary #FFFFFF = 1:1 (color/content/on-content-primary > palette/base/white on color/content/primary > palette/base/white)
  - FTN Light: color/content/on-content-primary #000000 on color/content/primary #000000 = 1:1 (color/content/on-content-primary > palette/base/black on color/content/primary > palette/base/black)
  - CP Dark: color/content/on-content-primary #FFFFFF on color/content/primary #FFFFFF = 1:1 (color/content/on-content-primary > palette/base/white on color/content/primary > palette/base/white)
  - CP Light: color/content/on-content-primary #000000 on color/content/primary #000000 = 1:1 (color/content/on-content-primary > palette/base/black on color/content/primary > palette/base/black)
  - PSK Dark: color/content/on-content-primary #FFFFFF on color/content/primary #FFFFFF = 1:1 (color/content/on-content-primary > palette/base/white on color/content/primary > palette/base/white)
  - PSK Light: color/content/on-content-primary #000000 on color/content/primary #000000 = 1:1 (color/content/on-content-primary > palette/base/black on color/content/primary > palette/base/black)
  - LobBet: color/content/on-content-primary #FFFFFF on color/content/primary #FFFFFF = 1:1 (color/content/on-content-primary > palette/base/white on color/content/primary > palette/base/white)
- Recommended next step: Either the foreground value is wrong for this pairing or the token is not meant for this surface; decide with design.
- Review status: Not reviewed

### SPA-002: color/content/primary-inverted on color/surface/inverted-bw

- Severity: High · Type: Confirmed failure · Category: C. Invalid colour pairing · Confidence: High
- Pairing: Strong candidate · text · Fails in every brand/theme
- Root cause hypothesis: Foreground and background resolve to the same colour (FTN Dark #000000, FTN Light #FFFFFF, CP Dark #000000, CP Light #FFFFFF, PSK Dark #000000, PSK Light #FFFFFF, LobBet #000000).
- Evidence:
  - FTN Dark: color/content/primary-inverted #000000 on color/surface/inverted-bw #000000 = 1:1 (color/content/primary-inverted > palette/base/black on color/surface/inverted-bw > palette/base/black)
  - FTN Light: color/content/primary-inverted #FFFFFF on color/surface/inverted-bw #FFFFFF = 1:1 (color/content/primary-inverted > palette/base/white on color/surface/inverted-bw > palette/base/white)
  - CP Dark: color/content/primary-inverted #000000 on color/surface/inverted-bw #000000 = 1:1 (color/content/primary-inverted > palette/base/black on color/surface/inverted-bw > palette/base/black)
  - CP Light: color/content/primary-inverted #FFFFFF on color/surface/inverted-bw #FFFFFF = 1:1 (color/content/primary-inverted > palette/base/white on color/surface/inverted-bw > palette/base/white)
  - PSK Dark: color/content/primary-inverted #000000 on color/surface/inverted-bw #000000 = 1:1 (color/content/primary-inverted > palette/base/black on color/surface/inverted-bw > palette/base/black)
  - PSK Light: color/content/primary-inverted #FFFFFF on color/surface/inverted-bw #FFFFFF = 1:1 (color/content/primary-inverted > palette/base/white on color/surface/inverted-bw > palette/base/white)
  - LobBet: color/content/primary-inverted #000000 on color/surface/inverted-bw #000000 = 1:1 (color/content/primary-inverted > palette/base/black on color/surface/inverted-bw > palette/base/black)
- Recommended next step: Likely not a valid pairing; confirm the intended foreground for this surface.
- Review status: Not reviewed

### SPA-003: color/content/on-active on color/surface/active

- Severity: High · Type: Confirmed failure · Category: B. Wrong token value / alias · Confidence: Medium
- Pairing: Confirmed pairing · text · Fails in specific brands
- Root cause hypothesis: Same background, different foreground: in FTN Light color/content/on-active resolves to #FFFFFF (color/content/on-active > palette/base/white), but in FTN Dark it resolves to #000000 (color/content/on-active > palette/base/black) on the same #FFDB01 background. The failing mode's foreground alias is the likely cause.
- Evidence:
  - FTN Light: color/content/on-active #FFFFFF on color/surface/active #FFDB01 = 1.36:1 (color/content/on-active > palette/base/white on color/surface/active > palette/brand/ftn-primary)
  - Works in FTN Dark (15.38:1), CP Dark (5.2:1), CP Light (5.2:1), PSK Dark (7.01:1), PSK Light (7.01:1), LobBet (4.53:1)
- Recommended next step: Check the color/content/on-active alias for FTN Light against the working mode; review usages before changing it.
- Review status: Not reviewed

### SPA-004: color/content/selected on color/surface/primary

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in specific brands
- Root cause hypothesis: color/content/selected (Brand) changes per brand while color/surface/primary (Theme) does not; the combination only fails where the brand colour lands too close to the neutral.
- Evidence:
  - FTN Light: color/content/selected #FFDB01 on color/surface/primary #FFFFFF = 1.36:1 (color/content/selected > palette/brand/ftn-primary on color/surface/primary > palette/base/white)
  - Works in FTN Dark (11.56:1), CP Dark (11.56:1), CP Light (5.2:1), PSK Dark (6.5:1), PSK Light (7.01:1), LobBet (8.13:1)
- Recommended next step: Design decision: either add brand-aware variants for this use, restrict where the brand token can be used, or accept a brand-specific exception.
- Review status: Not reviewed

### SPA-005: color/content/offer-badge on color/surface/primary

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in specific brands
- Root cause hypothesis: color/content/offer-badge (Brand) changes per brand while color/surface/primary (Theme) does not; the combination only fails where the brand colour lands too close to the neutral.
- Evidence:
  - FTN Light: color/content/offer-badge #C8E651 on color/surface/primary #FFFFFF = 1.41:1 (color/content/offer-badge > palette/badge/green on color/surface/primary > palette/base/white)
  - CP Dark: color/content/offer-badge #256FD2 on color/surface/primary #22222A = 3.21:1 (color/content/offer-badge > palette/badge/blue on color/surface/primary > palette/grey/40)
  - PSK Dark: color/content/offer-badge #DD3107 on color/surface/primary #22222A = 3.39:1 (color/content/offer-badge > palette/badge/red on color/surface/primary > palette/grey/40)
  - Works in FTN Dark (11.19:1), CP Light (4.9:1), PSK Light (4.64:1), LobBet (9.67:1)
- Recommended next step: Design decision: either add brand-aware variants for this use, restrict where the brand token can be used, or accept a brand-specific exception.
- Review status: Not reviewed

### SPA-006: color/content/on-active on color/surface-hover/active

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in specific brands
- Root cause hypothesis: Same foreground, different background: in FTN Light color/surface-hover/active resolves to #F1CF00 (color/surface-hover/active), much closer to the #FFFFFF foreground than in CP Dark (#DB3036, color/surface-hover/active).
- Evidence:
  - FTN Light: color/content/on-active #FFFFFF on color/surface-hover/active #F1CF00 = 1.53:1 (color/content/on-active > palette/base/white on color/surface-hover/active)
  - LobBet: color/content/on-active #FFFFFF on color/surface-hover/active #2AD47F = 1.94:1 (color/content/on-active > palette/base/white on color/surface-hover/active > palette/brand/lob-primary-light)
  - Works in FTN Dark (15.71:1), CP Dark (4.67:1), CP Light (5.76:1), PSK Dark (5.19:1), PSK Light (8.46:1)
- Recommended next step: Decide whether color/surface-hover/active in FTN Light, LobBet should use a different value, or whether the foreground needs a brand-specific value there.
- Review status: Not reviewed

### SPA-007: color/content/on-brand on color/surface-hover/brand

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in specific brands
- Root cause hypothesis: Same foreground, different background: in LobBet color/surface-hover/brand resolves to #2AD47F (color/surface-hover/brand > palette/brand/lob-primary-light), much closer to the #FFFFFF foreground than in CP Dark (#DB3036, color/surface-hover/brand).
- Evidence:
  - LobBet: color/content/on-brand #FFFFFF on color/surface-hover/brand #2AD47F = 1.94:1 (color/content/on-brand > palette/base/white on color/surface-hover/brand > palette/brand/lob-primary-light)
  - Works in FTN Dark (15.71:1), FTN Light (13.66:1), CP Dark (4.67:1), CP Light (5.76:1), PSK Dark (5.19:1), PSK Light (8.46:1)
- Recommended next step: Decide whether color/surface-hover/brand in LobBet should use a different value, or whether the foreground needs a brand-specific value there.
- Review status: Not reviewed

### SPA-008: color-perma/content/on-active on color-perma/surface/active-hover

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in specific brands
- Root cause hypothesis: Same foreground, different background: in LobBet color-perma/surface/active-hover resolves to #2AD47F (color-perma/surface/active-hover > palette/brand/lob-primary-light), much closer to the #FFFFFF foreground than in CP Dark (#DB3036, color-perma/surface/active-hover).
- Evidence:
  - LobBet: color-perma/content/on-active #FFFFFF on color-perma/surface/active-hover #2AD47F = 1.94:1 (color-perma/content/on-active > palette/base/white on color-perma/surface/active-hover > palette/brand/lob-primary-light)
  - Works in FTN Dark (15.71:1), FTN Light (15.71:1), CP Dark (4.67:1), CP Light (4.67:1), PSK Dark (5.19:1), PSK Light (8.46:1)
- Recommended next step: Decide whether color-perma/surface/active-hover in LobBet should use a different value, or whether the foreground needs a brand-specific value there.
- Review status: Not reviewed

### SPA-009: color/content/on-selected on color/surface-hover/selected

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in specific brands
- Root cause hypothesis: Same foreground, different background: in LobBet color/surface-hover/selected resolves to #2AD47F (color/surface-hover/selected > palette/brand/lob-primary-light), much closer to the #FFFFFF foreground than in CP Dark (#DB3036, color/surface-hover/selected).
- Evidence:
  - LobBet: color/content/on-selected #FFFFFF on color/surface-hover/selected #2AD47F = 1.94:1 (color/content/on-selected > palette/base/white on color/surface-hover/selected > palette/brand/lob-primary-light)
  - Works in FTN Dark (15.71:1), FTN Light (13.66:1), CP Dark (4.67:1), CP Light (5.76:1), PSK Dark (5.19:1), PSK Light (8.46:1)
- Recommended next step: Decide whether color/surface-hover/selected in LobBet should use a different value, or whether the foreground needs a brand-specific value there.
- Review status: Not reviewed

### SPA-010: color/content/on-money on color/meaning/money

- Severity: High · Type: Confirmed failure · Category: E. Requires design decision · Confidence: Medium
- Pairing: Confirmed pairing · text · Fails in every brand/theme
- Root cause hypothesis: The pairing fails in every brand and theme; values may be intentionally decorative or the pairing needs redefining. All failing contexts still pass large-text AA (3:1), so the pairing is only acceptable for large or bold text.
- Evidence:
  - FTN Dark: color/content/on-money #000000 on color/meaning/money #0E7C1D = 3.91:1 (color/content/on-money > palette/base/black on color/meaning/money > palette/green/20)
  - FTN Light: color/content/on-money #000000 on color/meaning/money #0E7C1D = 3.91:1 (color/content/on-money > palette/base/black on color/meaning/money > palette/green/20)
  - CP Dark: color/content/on-money #000000 on color/meaning/money #0E7C1D = 3.91:1 (color/content/on-money > palette/base/black on color/meaning/money > palette/green/20)
  - CP Light: color/content/on-money #000000 on color/meaning/money #0E7C1D = 3.91:1 (color/content/on-money > palette/base/black on color/meaning/money > palette/green/20)
  - PSK Dark: color/content/on-money #000000 on color/meaning/money #0E7C1D = 3.91:1 (color/content/on-money > palette/base/black on color/meaning/money > palette/green/20)
  - PSK Light: color/content/on-money #000000 on color/meaning/money #0E7C1D = 3.91:1 (color/content/on-money > palette/base/black on color/meaning/money > palette/green/20)
  - LobBet: color/content/on-money #000000 on color/meaning/money #0E7C1D = 3.91:1 (color/content/on-money > palette/base/black on color/meaning/money > palette/green/20)
- Recommended next step: Decide whether this pairing should exist; if yes, choose a foreground that meets the threshold.
- Review status: Not reviewed

### SPA-011: color/content/on-positive on color/meaning-hover/positive

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in Dark only
- Root cause hypothesis: Same foreground, different background: in FTN Dark color/meaning-hover/positive resolves to #119522 (color/meaning-hover/positive), much closer to the #FFFFFF foreground than in FTN Light (#0D741B, color/meaning-hover/positive). All failing contexts still pass large-text AA (3:1), so the pairing is only acceptable for large or bold text.
- Evidence:
  - FTN Dark: color/content/on-positive #FFFFFF on color/meaning-hover/positive #119522 = 3.92:1 (color/content/on-positive > palette/base/white on color/meaning-hover/positive)
  - CP Dark: color/content/on-positive #FFFFFF on color/meaning-hover/positive #119522 = 3.92:1 (color/content/on-positive > palette/base/white on color/meaning-hover/positive)
  - PSK Dark: color/content/on-positive #FFFFFF on color/meaning-hover/positive #119522 = 3.92:1 (color/content/on-positive > palette/base/white on color/meaning-hover/positive)
  - LobBet: color/content/on-positive #FFFFFF on color/meaning-hover/positive #119522 = 3.92:1 (color/content/on-positive > palette/base/white on color/meaning-hover/positive)
  - Works in FTN Light (5.94:1), CP Light (5.94:1), PSK Light (5.94:1)
- Recommended next step: Decide whether color/meaning-hover/positive in FTN Dark, CP Dark, PSK Dark, LobBet should use a different value, or whether the foreground needs a brand-specific value there.
- Review status: Not reviewed

### SPA-012: color/content/placeholder on color/surface/input

- Severity: High · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · text · Fails in Light only
- Root cause hypothesis: Theme-specific failure: the pairing only fails in Light. All failing contexts still pass large-text AA (3:1), so the pairing is only acceptable for large or bold text. Near miss: within 0.2 of the 4.5:1 threshold.
- Evidence:
  - FTN Light: color/content/placeholder #64647D on color/surface/input #E3E3E9 = 4.48:1 (color/content/placeholder > palette/grey/70 on color/surface/input > palette/grey/110)
  - CP Light: color/content/placeholder #64647D on color/surface/input #E3E3E9 = 4.48:1 (color/content/placeholder > palette/grey/70 on color/surface/input > palette/grey/110)
  - PSK Light: color/content/placeholder #64647D on color/surface/input #E3E3E9 = 4.48:1 (color/content/placeholder > palette/grey/70 on color/surface/input > palette/grey/110)
  - Works in FTN Dark (5.31:1), CP Dark (5.31:1), PSK Dark (5.31:1), LobBet (5.31:1)
- Recommended next step: Check the failing-theme value of each token against the working theme.
- Review status: Not reviewed

### SPA-013: color/content/primary on color/surface/inverted-bw

- Severity: High · Type: Hypothesis requiring design review · Category: E. Requires design decision · Confidence: Medium
- Pairing: Needs design review · text · Reported issue investigation
- Root cause hypothesis: The text pairing itself is not the failure: both tokens are Theme tokens, so they cannot differ by brand, and they resolve to black/white at 21:1 in all seven contexts. The reported FTN-works / PSK-fails behaviour most likely comes from (1) the inverted-bw fill sitting on a brand surface, where it fails 3:1 against the PSK Dark and FTN Light headers, or (2) PSK files binding the same-named variables from the separate "PSK New color - VL (Brand version)" library rather than canonical NDS.
- Evidence:
  - Current Figma: color/surface/inverted-bw (Theme) Dark > palette/base/black, Light > palette/base/white; color/content/primary (Theme) Dark > palette/base/white, Light > palette/base/black. 21:1 in every context.
  - Name check: inverted-bw follows the theme (black in Dark, white in Light) rather than inverting it; content/primary-inverted resolves to the same values as inverted-bw (1:1 if paired by name).
  - 2026-10-14 Register Button audit: inverted-bw fill vs brand header fails 3:1 in FTN Light (1.36:1) and PSK Dark (2.99:1).
  - Library search: a separate library "PSK New color - VL (Brand version)" publishes variables with the same names (color/surface/inverted-bw key e16b7078..., color/content/primary key 6135029b...). Their values could not be read without importing them, which this read-only audit does not do.
  - Published vs current: the published NDS library still lists color-perma/content/primary (key 186e19cb...), which no longer exists in the current file; consumers may be using a stale published version.
- Recommended next step: In the reported PSK screen, inspect which library the two variables come from and which Brand/Theme modes the frame sets. If canonical NDS: treat as a fill-on-brand-header problem (non-text 3:1) and decide on a brand-aware inverted fill. If the PSK library: align or retire the parallel variables.
- Review status: Not reviewed

### SPA-014: color/content/on-sub-header on color/surface/brand

- Severity: Medium · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Needs design review · text · Fails in specific brands
- Root cause hypothesis: Same foreground, different background: in CP Dark color/surface/brand resolves to #D2252A (color/surface/brand > palette/brand/casa-primary), much closer to the #DFDFE6 foreground than in PSK Dark (#1752BF, color/surface/brand > palette/brand/psk-primary). All failing contexts still pass large-text AA (3:1), so the pairing is only acceptable for large or bold text.
- Evidence:
  - CP Dark: color/content/on-sub-header #DFDFE6 on color/surface/brand #D2252A = 3.92:1 (color/content/on-sub-header > palette/grey/100 on color/surface/brand > palette/brand/casa-primary)
  - CP Light: color/content/on-sub-header #DFDFE6 on color/surface/brand #D2252A = 3.92:1 (color/content/on-sub-header > palette/grey/100 on color/surface/brand > palette/brand/casa-primary)
  - LobBet: color/content/on-sub-header #DFDFE6 on color/surface/brand #1B8751 = 3.41:1 (color/content/on-sub-header > palette/grey/100 on color/surface/brand > palette/brand/lob-primary)
  - Works in FTN Dark (10.54:1), FTN Light (10.54:1), PSK Dark (5.28:1), PSK Light (5.28:1)
- Recommended next step: Decide whether color/surface/brand in CP Dark, CP Light, LobBet should use a different value, or whether the foreground needs a brand-specific value there.
- Review status: Not reviewed

### SPA-015: color/surface/selected on color/surface/brand

- Severity: Medium · Type: Confirmed failure · Category: C. Invalid colour pairing · Confidence: High
- Pairing: Needs design review · non-text · Fails in every brand/theme
- Root cause hypothesis: Foreground and background resolve to the same colour (FTN Dark #FFDB01, FTN Light #FFDB01, CP Dark #D2252A, CP Light #D2252A, PSK Dark #1752BF, PSK Light #1752BF, LobBet #1B8751).
- Evidence:
  - FTN Dark: color/surface/selected #FFDB01 on color/surface/brand #FFDB01 = 1:1 (color/surface/selected > palette/brand/ftn-primary on color/surface/brand > palette/brand/ftn-primary)
  - FTN Light: color/surface/selected #FFDB01 on color/surface/brand #FFDB01 = 1:1 (color/surface/selected > palette/brand/ftn-primary on color/surface/brand > palette/brand/ftn-primary)
  - CP Dark: color/surface/selected #D2252A on color/surface/brand #D2252A = 1:1 (color/surface/selected > palette/brand/casa-primary on color/surface/brand > palette/brand/casa-primary)
  - CP Light: color/surface/selected #D2252A on color/surface/brand #D2252A = 1:1 (color/surface/selected > palette/brand/casa-primary on color/surface/brand > palette/brand/casa-primary)
  - PSK Dark: color/surface/selected #1752BF on color/surface/brand #1752BF = 1:1 (color/surface/selected > palette/brand/psk-primary on color/surface/brand > palette/brand/psk-primary)
  - PSK Light: color/surface/selected #1752BF on color/surface/brand #1752BF = 1:1 (color/surface/selected > palette/brand/psk-primary on color/surface/brand > palette/brand/psk-primary)
  - LobBet: color/surface/selected #1B8751 on color/surface/brand #1B8751 = 1:1 (color/surface/selected > palette/brand/lob-primary on color/surface/brand > palette/brand/lob-primary)
- Recommended next step: Likely not a valid pairing; confirm the intended foreground for this surface.
- Review status: Not reviewed

### SPA-016: color/surface/inverted-bw on color/surface/primary

- Severity: Medium · Type: Confirmed failure · Category: C. Invalid colour pairing · Confidence: Medium
- Pairing: Needs design review · non-text · Fails in every brand/theme
- Root cause hypothesis: The combination fails in every brand and theme; it is probably not an intended pairing.
- Evidence:
  - FTN Dark: color/surface/inverted-bw #000000 on color/surface/primary #22222A = 1.33:1 (color/surface/inverted-bw > palette/base/black on color/surface/primary > palette/grey/40)
  - FTN Light: color/surface/inverted-bw #FFFFFF on color/surface/primary #FFFFFF = 1:1 (color/surface/inverted-bw > palette/base/white on color/surface/primary > palette/base/white)
  - CP Dark: color/surface/inverted-bw #000000 on color/surface/primary #22222A = 1.33:1 (color/surface/inverted-bw > palette/base/black on color/surface/primary > palette/grey/40)
  - CP Light: color/surface/inverted-bw #FFFFFF on color/surface/primary #FFFFFF = 1:1 (color/surface/inverted-bw > palette/base/white on color/surface/primary > palette/base/white)
  - PSK Dark: color/surface/inverted-bw #000000 on color/surface/primary #22222A = 1.33:1 (color/surface/inverted-bw > palette/base/black on color/surface/primary > palette/grey/40)
  - PSK Light: color/surface/inverted-bw #FFFFFF on color/surface/primary #FFFFFF = 1:1 (color/surface/inverted-bw > palette/base/white on color/surface/primary > palette/base/white)
  - LobBet: color/surface/inverted-bw #000000 on color/surface/primary #22222A = 1.33:1 (color/surface/inverted-bw > palette/base/black on color/surface/primary > palette/grey/40)
- Recommended next step: Decide whether this pairing should exist; if yes, choose a foreground that meets the threshold.
- Review status: Not reviewed

### SPA-017: color/border/input on color/surface/primary

- Severity: Medium · Type: Confirmed failure · Category: E. Requires design decision · Confidence: Medium
- Pairing: Strong candidate · non-text · Fails in every brand/theme
- Root cause hypothesis: The pairing fails in every brand and theme; values may be intentionally decorative or the pairing needs redefining.
- Evidence:
  - FTN Dark: color/border/input #363644 on color/surface/primary #22222A = 1.32:1 (color/border/input > palette/grey/60 on color/surface/primary > palette/grey/40)
  - FTN Light: color/border/input #B0B0C0 on color/surface/primary #FFFFFF = 2.13:1 (color/border/input > palette/grey/90 on color/surface/primary > palette/base/white)
  - CP Dark: color/border/input #363644 on color/surface/primary #22222A = 1.32:1 (color/border/input > palette/grey/60 on color/surface/primary > palette/grey/40)
  - CP Light: color/border/input #B0B0C0 on color/surface/primary #FFFFFF = 2.13:1 (color/border/input > palette/grey/90 on color/surface/primary > palette/base/white)
  - PSK Dark: color/border/input #363644 on color/surface/primary #22222A = 1.32:1 (color/border/input > palette/grey/60 on color/surface/primary > palette/grey/40)
  - PSK Light: color/border/input #B0B0C0 on color/surface/primary #FFFFFF = 2.13:1 (color/border/input > palette/grey/90 on color/surface/primary > palette/base/white)
  - LobBet: color/border/input #363644 on color/surface/primary #22222A = 1.32:1 (color/border/input > palette/grey/60 on color/surface/primary > palette/grey/40)
- Recommended next step: Decide whether this pairing should exist; if yes, choose a foreground that meets the threshold.
- Review status: Not reviewed

### SPA-018: color/border/brand on color/surface/primary

- Severity: Medium · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · non-text · Fails in specific brands
- Root cause hypothesis: color/border/brand (Brand) changes per brand while color/surface/primary (Theme) does not; the combination only fails where the brand colour lands too close to the neutral.
- Evidence:
  - FTN Light: color/border/brand #FFDB01 on color/surface/primary #FFFFFF = 1.36:1 (color/border/brand > palette/brand/ftn-primary on color/surface/primary > palette/base/white)
  - PSK Dark: color/border/brand #1752BF on color/surface/primary #22222A = 2.25:1 (color/border/brand > palette/brand/psk-primary on color/surface/primary > palette/grey/40)
  - Works in FTN Dark (11.56:1), CP Dark (3.03:1), CP Light (5.2:1), PSK Light (7.01:1), LobBet (3.48:1)
- Recommended next step: Design decision: either add brand-aware variants for this use, restrict where the brand token can be used, or accept a brand-specific exception.
- Review status: Not reviewed

### SPA-019: color/meaning/live on color/surface/primary

- Severity: Medium · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · non-text · Fails in specific brands
- Root cause hypothesis: color/meaning/live (Brand) changes per brand while color/surface/primary (Theme) does not; the combination only fails where the brand colour lands too close to the neutral.
- Evidence:
  - FTN Light: color/meaning/live #FFDB01 on color/surface/primary #FFFFFF = 1.36:1 (color/meaning/live > palette/brand/ftn-primary on color/surface/primary > palette/base/white)
  - CP Dark: color/meaning/live #0E7C1D on color/surface/primary #22222A = 2.94:1 (color/meaning/live > palette/green/20 on color/surface/primary > palette/grey/40)
  - PSK Dark: color/meaning/live #0E7C1D on color/surface/primary #22222A = 2.94:1 (color/meaning/live > palette/green/20 on color/surface/primary > palette/grey/40)
  - LobBet: color/meaning/live #0E7C1D on color/surface/primary #22222A = 2.94:1 (color/meaning/live > palette/green/20 on color/surface/primary > palette/grey/40)
  - Works in FTN Dark (11.56:1), CP Light (5.35:1), PSK Light (5.35:1)
- Recommended next step: Design decision: either add brand-aware variants for this use, restrict where the brand token can be used, or accept a brand-specific exception.
- Review status: Not reviewed

### SPA-020: color/surface/inverted-bw on color/surface/brand

- Severity: Medium · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Needs design review · non-text · Fails in specific brands
- Root cause hypothesis: color/surface/brand (Brand) changes per brand while color/surface/inverted-bw (Theme) does not; the combination only fails where the brand colour lands too close to the neutral.
- Evidence:
  - FTN Light: color/surface/inverted-bw #FFFFFF on color/surface/brand #FFDB01 = 1.36:1 (color/surface/inverted-bw > palette/base/white on color/surface/brand > palette/brand/ftn-primary)
  - PSK Dark: color/surface/inverted-bw #000000 on color/surface/brand #1752BF = 2.99:1 (color/surface/inverted-bw > palette/base/black on color/surface/brand > palette/brand/psk-primary)
  - Works in FTN Dark (15.38:1), CP Dark (4.03:1), CP Light (5.2:1), PSK Light (7.01:1), LobBet (4.63:1)
- Recommended next step: Design decision: either add brand-aware variants for this use, restrict where the brand token can be used, or accept a brand-specific exception.
- Review status: Not reviewed

### SPA-021: color/border/selected on color/surface/primary

- Severity: Medium · Type: Confirmed failure · Category: D. Cross-brand / theme inconsistency · Confidence: Medium
- Pairing: Strong candidate · non-text · Fails in specific brands
- Root cause hypothesis: color/border/selected (Brand) changes per brand while color/surface/primary (Theme) does not; the combination only fails where the brand colour lands too close to the neutral.
- Evidence:
  - PSK Dark: color/border/selected #1752BF on color/surface/primary #22222A = 2.25:1 (color/border/selected > palette/brand/psk-primary on color/surface/primary > palette/grey/40)
  - Works in FTN Dark (11.56:1), FTN Light (7.74:1), CP Dark (3.03:1), CP Light (5.2:1), PSK Light (7.01:1), LobBet (3.48:1)
- Recommended next step: Design decision: either add brand-aware variants for this use, restrict where the brand token can be used, or accept a brand-specific exception.
- Review status: Not reviewed

### SPA-022: color/content/selected

- Severity: Medium · Type: Confirmed alias anomaly · Category: B. Wrong token value / alias · Confidence: High
- Pairing: Token check · Cross-brand alias
- Root cause hypothesis: color/content/selected resolves to another brand's palette in CP Dark.
- Evidence:
  - CP Dark: color/content/selected > palette/brand/ftn-primary; other brands resolve this token to their own palette.
- Recommended next step: Confirm the intended value for these brand modes; review usages before changing the alias.
- Review status: Not reviewed

### SPA-023: color/content/active

- Severity: Medium · Type: Confirmed alias anomaly · Category: B. Wrong token value / alias · Confidence: High
- Pairing: Token check · Cross-brand alias
- Root cause hypothesis: color/content/active resolves to another brand's palette in CP Dark.
- Evidence:
  - CP Dark: color/content/active > palette/brand/ftn-primary; other brands resolve this token to their own palette.
- Recommended next step: Confirm the intended value for these brand modes; review usages before changing the alias.
- Review status: Not reviewed

### SPA-024: color/content/primary on color/overlay/tooltip-default

- Severity: Low · Type: Hypothesis (context-dependent) · Category: E. Requires design decision · Confidence: Low
- Pairing: Needs design review · text · Context-dependent (estimates fail in some)
- Root cause hypothesis: Translucent background: the real contrast depends on what sits behind it. Estimates over background/base and surface/primary fall below the threshold in some contexts.
- Evidence:
  - FTN Light: 2:1 over color/background/base, 2.13:1 over color/surface/primary
  - CP Light: 2:1 over color/background/base, 2.13:1 over color/surface/primary
  - PSK Light: 2:1 over color/background/base, 2.13:1 over color/surface/primary
- Recommended next step: Check the component in its real context; document the surfaces this fill may sit on.
- Review status: Not reviewed

### SPA-025: color/content/on-positive on color/overlay/positive

- Severity: Low · Type: Hypothesis (context-dependent) · Category: E. Requires design decision · Confidence: Low
- Pairing: Strong candidate · text · Context-dependent (estimates fail in some)
- Root cause hypothesis: Translucent background: the real contrast depends on what sits behind it. Estimates over background/base and surface/primary fall below the threshold in some contexts.
- Evidence:
  - FTN Light: 3.89:1 over color/background/base, 3.69:1 over color/surface/primary
  - CP Light: 3.89:1 over color/background/base, 3.69:1 over color/surface/primary
  - PSK Light: 3.89:1 over color/background/base, 3.69:1 over color/surface/primary
- Recommended next step: Check the component in its real context; document the surfaces this fill may sit on.
- Review status: Not reviewed

### SPA-026: color/content/on-info on color/overlay/info

- Severity: Low · Type: Hypothesis (context-dependent) · Category: E. Requires design decision · Confidence: Low
- Pairing: Strong candidate · text · Context-dependent (estimates fail in some)
- Root cause hypothesis: Translucent background: the real contrast depends on what sits behind it. Estimates over background/base and surface/primary fall below the threshold in some contexts.
- Evidence:
  - FTN Light: 4.18:1 over color/background/base, 3.97:1 over color/surface/primary
  - CP Light: 4.18:1 over color/background/base, 3.97:1 over color/surface/primary
  - PSK Light: 4.18:1 over color/background/base, 3.97:1 over color/surface/primary
- Recommended next step: Check the component in its real context; document the surfaces this fill may sit on.
- Review status: Not reviewed

### SPA-027: color/content/on-negative on color/overlay/error

- Severity: Low · Type: Hypothesis (context-dependent) · Category: E. Requires design decision · Confidence: Low
- Pairing: Strong candidate · text · Context-dependent (estimates fail in some)
- Root cause hypothesis: Translucent background: the real contrast depends on what sits behind it. Estimates over background/base and surface/primary fall below the threshold in some contexts.
- Evidence:
  - FTN Light: 4.3:1 over color/background/base, 4.09:1 over color/surface/primary
  - CP Light: 4.3:1 over color/background/base, 4.09:1 over color/surface/primary
  - PSK Light: 4.3:1 over color/background/base, 4.09:1 over color/surface/primary
- Recommended next step: Check the component in its real context; document the surfaces this fill may sit on.
- Review status: Not reviewed

## Pairings that pass in every brand and theme

- `color/content/on-brand` on `color/surface/brand` (text, lowest 4.53:1, Confirmed pairing)
- `color/content/on-brand` on `color/surface/brand-dark` (text, lowest 6.11:1, Strong candidate)
- `color/content/on-sub-header-active` on `color/surface/sub-header-item` (text, lowest 6.11:1, Strong candidate)
- `color-perma/content/on-active` on `color-perma/surface/active` (text, lowest 4.53:1, Confirmed pairing)
- `color/content/active` on `color/surface/primary` (text, lowest 5.2:1, Strong candidate)
- `color/content/on-selected` on `color/surface/selected` (text, lowest 4.53:1, Confirmed pairing)
- `color/content/on-highlighted` on `color/surface/highlighted` (text, lowest 5.35:1, Confirmed pairing)
- `color/content/on-betslip-badge` on `color/surface/betslip-badge` (text, lowest 21:1, Confirmed pairing)
- `color/content/on-notification-badge` on `color/surface/notification-badge` (text, lowest 5.62:1, Confirmed pairing)
- `color/content/on-offer-badge` on `color/surface/offer-badge` (text, lowest 4.64:1, Confirmed pairing)
- `color/content/on-positive` on `color/meaning/positive` (text, lowest 5.35:1, Confirmed pairing)
- `color/content/on-negative` on `color/meaning/negative` (text, lowest 5.62:1, Confirmed pairing)
- `color/content/on-warning` on `color/meaning/warning` (text, lowest 5.5:1, Confirmed pairing)
- `color/content/on-info` on `color/meaning/info` (text, lowest 5.93:1, Confirmed pairing)
- `color/content/on-win` on `color/meaning/win` (text, lowest 15.38:1, Confirmed pairing)
- `color/content/on-live` on `color/meaning/live` (text, lowest 5.35:1, Confirmed pairing)
- `color/content/on-negative` on `color/meaning-hover/negative` (text, lowest 4.83:1, Strong candidate)
- `color/content/primary` on `color/surface/primary` (text, lowest 15.78:1, Confirmed pairing)
- `color/content/primary` on `color/background/base` (text, lowest 17.66:1, Strong candidate)
- `color/content/primary` on `color/surface/secondary` (text, lowest 17.67:1, Strong candidate)
- `color/content/primary` on `color/surface/panel` (text, lowest 14.39:1, Strong candidate)
- `color/content/primary` on `color/surface/action` (text, lowest 11.87:1, Strong candidate)
- `color/content/primary` on `color/surface/navigation` (text, lowest 19.27:1, Strong candidate)
- `color/content/primary` on `color/surface/input` (text, lowest 16.43:1, Strong candidate)
- `color/content/secondary` on `color/surface/primary` (text, lowest 9.03:1, Strong candidate)
- `color/content/secondary` on `color/background/base` (text, lowest 7.6:1, Strong candidate)
- `color/content/tertiary` on `color/surface/primary` (text, lowest 5.73:1, Strong candidate)
- `color/content/error` on `color/surface/input-error` (text, lowest 5.22:1, Strong candidate)
- `color/content/error` on `color/surface/primary` (text, lowest 6.12:1, Strong candidate)
- `color/content/money` on `color/surface/primary` (text, lowest 5.35:1, Strong candidate)
- `color/content/primary` on `color/surface/inverted-bw` (text, lowest 21:1, Needs design review)
- `color/content/primary-inverted` on `color/content/primary` (text, lowest 21:1, Strong candidate)
- `color/border/active` on `color/surface/primary` (non-text, lowest 15.78:1, Strong candidate)
