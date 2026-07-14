# Design QA

- Source visual truth: `/var/folders/pw/4kph5jfs6bjbcg9fc1hb_m8m0000gn/T/TemporaryItems/NSIRD_screencaptureui_vNdS9e/スクリーンショット 2026-07-15 7.46.34.png`
- Current ally-card composite: `/private/tmp/keito-transparent-ally-card-preview.png`
- Previous browser-rendered layout baseline: `/private/tmp/keito-restart-hud-desktop.png`
- Current verification: PNG alpha inspection, focused card composite, contract tests, and runtime tests

## Full-view Comparison Evidence

The current change keeps the existing HUD, canvas, five-column summon deck, message, and privacy note structure. It changes only ally sprite files and the summon-card surface colors.

## Focused Region Comparison Evidence

The focused ally-card composite uses the actual four RGBA assets over the updated navy card surface. No baked checkerboard or white image rectangle remains behind the characters.

## Required Fidelity Surfaces

- Fonts and typography: Existing game font stack, weight, letter spacing, and HUD hierarchy are unchanged. Restart uses the existing bold UI type at 11px.
- Spacing and layout rhythm: Restart and audience are separated by a 6px gap and fit within the existing 256px HUD board. The summon deck remains a five-column, two-row-ready area.
- Colors and visual tokens: Restart uses the existing dark panel, white foreground, and subdued border colors. The audience status colors are unchanged.
- Image quality and asset fidelity: all four ally sprites use real alpha transparency. The supplied character art is preserved without baked checkerboard backgrounds, and the same local assets render through the summon-card and canvas sprite paths.
- Summon-card contrast: the ally deck uses a restrained dark navy surface with a thin gold accent so white transparent characters remain readable without adding image backplates.
- Copy and content: `↻ リスタート`, `参戦中`, money, defeat count, stage copy, and privacy copy remain clear and unchanged in meaning.

## Findings

- No actionable P0, P1, or P2 findings in the asset, contrast, or contract checks.

## Interaction Verification

- Stage 1 opens from the stage map.
- Restart is exposed as one accessible button named `ステージをリスタート`.
- Clicking restart resets the selected stage and keeps the latest live audience count.
- Automated contract and runtime tests cover restart reset, audience-count retention, summon controls, analytics dedupe, and Worker boundaries.

## Comparison History

- Previous restart-layout browser comparison: passed without actionable layout findings.
- Current transparent-ally composite: passed without baked backgrounds or low-contrast characters.

## Follow-up Polish

- Confirm the merged change on GitHub Pages at desktop and mobile widths; local file navigation was unavailable in the browser safety boundary during this check.

final result: passed
