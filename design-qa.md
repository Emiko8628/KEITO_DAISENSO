# Design QA

- Source visual truth: `/var/folders/pw/4kph5jfs6bjbcg9fc1hb_m8m0000gn/T/TemporaryItems/NSIRD_screencaptureui_rx1KVl/スクリーンショット 2026-07-14 22.29.56.png`
- Replacement character source: `/Users/akinoemiko/Desktop/ChatGPT Image 2026年7月14日 22_39_53.png`
- Browser-rendered implementation: `/private/tmp/keito-restart-hud-desktop.png`
- Focused comparison: `/private/tmp/keito-hud-comparison.png`
- Viewport: 1280 x 759
- State: Stage 1 battle running with live audience count visible

## Full-view Comparison Evidence

The browser-rendered battle view keeps the existing HUD, canvas, five-column summon deck, message, and privacy note layout. The restart action no longer consumes space below the ally deck and is visible inside the HUD immediately left of the live audience display.

## Focused Region Comparison Evidence

The focused side-by-side comparison uses the original HUD crop and a same-size crop from the implementation. The money and defeat hierarchy is unchanged. The new compact restart action and audience indicator share one row without overlap, clipping, or crowding.

## Required Fidelity Surfaces

- Fonts and typography: Existing game font stack, weight, letter spacing, and HUD hierarchy are unchanged. Restart uses the existing bold UI type at 11px.
- Spacing and layout rhythm: Restart and audience are separated by a 6px gap and fit within the existing 256px HUD board. The summon deck remains a five-column, two-row-ready area.
- Colors and visual tokens: Restart uses the existing dark panel, white foreground, and subdued border colors. The audience status colors are unchanged.
- Image quality and asset fidelity: `assets/ally-ashinaga-umi-neko-v3.png` preserves the supplied character while using real alpha transparency around and between the legs. It renders in the existing summon-card and canvas sprite paths.
- Copy and content: `↻ リスタート`, `参戦中`, money, defeat count, stage copy, and privacy copy remain clear and unchanged in meaning.

## Findings

- No actionable P0, P1, or P2 findings.

## Interaction Verification

- Stage 1 opens from the stage map.
- Restart is exposed as one accessible button named `ステージをリスタート`.
- Clicking restart resets the selected stage and keeps the latest live audience count.
- Browser console warnings and errors: none.
- Automated contract and runtime tests cover restart reset, audience-count retention, summon controls, analytics dedupe, and Worker boundaries.

## Comparison History

- Initial implementation comparison: passed without actionable layout findings; no visual fixes were required after the first browser capture.

## Follow-up Polish

- No blocking follow-up. A dedicated mobile screenshot can be added later if the browser viewport capture becomes available; the current responsive rules leave more than enough horizontal space for the 85px restart action and 77px audience indicator.

final result: passed
