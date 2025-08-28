# Area Screenshot + Vision AI Feature

This document describes the architecture and usage of the stealth area screenshot + AI answer workflow implemented for Windows.

## Overview Flow
1. User presses the global hotkey (default `CTRL+H`, configurable via `PLUELY_HOTKEY`).
2. A fully transparent, click‑through, layered overlay window spans the virtual screen.
3. User drag‑selects a rectangle (no visible adorners are painted to keep the overlay visually and capture‑stealth).
4. Mouse up finalizes selection; the selected region of the real desktop is captured via GDI BitBlt into a 32‑bit DIB, converted to RGBA, PNG‑encoded, Base64.
5. Backend emits Tauri event `pluely://screenshot-captured` with `base64` PNG payload.
6. Frontend listener (`App.tsx`) dispatches a DOM custom event `pluely-screenshot` which the Completion module subscribes to.
7. `screenshot-ai.ts` builds a system prompt (future: integrate OCR classification) and streams the model response including the image (data URL) to the selected AI provider.

## Key Files
| File | Purpose |
|------|---------|
| `src-tauri/src/screenshot.rs` | Windows implementation (overlay + capture + PNG + base64). Exposes `invoke_area_screenshot` Tauri command. |
| `src-tauri/src/lib.rs` | Registers hotkey, wires event emission, exposes command. |
| `src/App.tsx` | Listens for backend event and re‑emits DOM event. |
| `src/lib/screenshot-ai.ts` | Prompt generation + streaming vision request helper. |
| `src/components/completion/index.tsx` | Subscribes to screenshot event, initiates streaming answer. |

## Hotkey Configuration
Set environment variable before launching app:
```
PLUELY_HOTKEY=CTRL+H
```
Supported modifiers: `CTRL`, `ALT`, `SHIFT` (case‑insensitive). If no modifier supplied, `CTRL` is assumed.

## Stealth & Capture Exclusion Techniques
Applied window styles / flags:
* `WS_POPUP`, `WS_EX_LAYERED`, `WS_EX_TRANSPARENT`, `WS_EX_TOOLWINDOW`, `WS_EX_TOPMOST`, `WS_EX_NOREDIRECTIONBITMAP`.
* 1 alpha (nearly fully transparent) + no on‑screen adorners to minimize recorder pickup.

Further hardening ideas (not yet implemented):
* Draw a subtle in‑memory selection rectangle (NOT shown) or use hardware cursor shape changes only.
* Add optional `SetWindowDisplayAffinity` (beware: hides from local *screen capture APIs* but also user might see black window in some cases).
* DirectComposition / DXGI desktop duplication for higher performance multi‑monitor capture.

## AI Prompting
Current implementation supplies a generic instruction plus the image. Planned enhancements:
* OCR pass (e.g., Tesseract WASM or rust `leptess`) to classify as MCQ, code, or theory using keyword heuristics.
* Custom structured extraction pipeline to map response into existing structured message schema.

## Privacy & Security
* Image stays in memory; only base64 string is transmitted to the configured provider over HTTPS.
* Not persisted to disk; add explicit user toggle if future caching is desired.
* Recommend users rotate API keys and ensure provider side data retention settings.

## Limitations / Next Steps
* Windows‑only overlay right now (guarded by `#[cfg(target_os = "windows")]`).
* No multi‑monitor union handling yet (only primary screen metrics). Extend via `EnumDisplayMonitors` or `GetSystemMetrics(SM_XVIRTUALSCREEN, ...)`.
* No visual feedback rectangle—could add optional border drawn via GDI on a second layered child window while still excluding it from capture.
* Does not debounce rapid hotkey presses; a global `IS_ACTIVE` guard prevents re‑entry but queueing could be added.

## Minimal Error Handling
Warnings from ignored Win32 return values are intentionally suppressed (`let _ = ...`) in future tidy pass.

## Frontend Integration Hooks
Listen for ready‑made DOM event if building additional UI:
```ts
window.addEventListener('pluely-screenshot', e => {
  const base64 = (e as CustomEvent).detail.base64;
  // custom behavior
});
```

## Testing Checklist
Manual validation steps:
1. Launch app; confirm no errors in dev tools console.
2. Press hotkey, drag small region; ensure answer stream begins.
3. Attempt screen recording (OBS / Teams) and verify overlay is not visible.
4. Press ESC during selection—capture should abort silently.
5. Change `PLUELY_HOTKEY` to another key, relaunch, confirm new binding.

---
Revision: initial implementation.