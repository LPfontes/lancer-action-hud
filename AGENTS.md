# Lancer Action HUD — Agent Notes

## Module Overview
FoundryVTT module providing a HUD for the LANCER RPG system. Main entry point: `scripts/main.js`.

## Key Classes
- `LancerSystemAdapter` — adapts Lancer system data for the HUD (extends `BaseSystemAdapter`)
- `LancerActionHUD` — the main HUD application (`Application` subclass)
- `LancerItemPopup` — popup showing item details (extends `Application`)
- `LancerDeployableHUD` — HUD for deployable tokens (extends `Application`)

## Template Files
All templates live in `templates/`:
- `hud.html` — main HUD layout
- `structstress-dialog.html` — stress/structure damage dialog (used as fallback when Lancer sliding HUD is unavailable)
- `popup.html` — item detail popup
- `deployable-hud.html` — deployable entity HUD

Localization keys used in `structstress-dialog.html`:
- `STYLISH_HUD.Dialog.StructureDamage.Title`
- `STYLISH_HUD.Dialog.StructureDamage.Description`
- `STYLISH_HUD.Dialog.Submit`
- `STYLISH_HUD.Dialog.Cancel`
- `STYLISH_HUD.Dialog.StressDamage.Title`

## Flow API (Lancer System)
The Lancer system provides a Flow API. See `flow_api.md` in the module root.

Key flows relevant to this module:
- `StatRollFlow` — used for stress/structure damage saves (`source.rollSave()`)
- `StructureFlow` — structure checks
- Overheat, Burn, Cascade, Stabilize flows for various system actions

Flows can be extended via:
- `lancer.preFlow.${flowName}` / `lancer.postFlow.${flowName}` hooks
- `lancer.registerFlows` hook for custom steps/flows

## Development Notes
- Template files must be committed to git (not just present on disk) for distribution
- `module.json` does NOT require a `templates` field — FoundryVTT auto-discovers them
- PowerShell is the shell on this system; `&&` and `||` are not valid statement separators (use semicolons or separate commands)