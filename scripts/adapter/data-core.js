/* scripts/adapter/data-core.js */

/**
 * Retorna dados do Core Power da frame equipada.
 * @param {Actor} actor
 * @returns {{ items: Array }}
 */
export function getCoreData(actor) {
    const items = [];
    if (!actor || actor.type !== "mech") return { items };

    const frame = actor.items.find(i => i.type === "frame" || i.system?.type === "Frame" || (typeof i.is_frame === "function" && i.is_frame()));
    if (frame && frame.system?.core_system) {
        const core = frame.system.core_system;
        const coreActiveName = core.active_name || "Core Power";
        const corePassiveName = core.passive_name || "Passive";
        const isCoreActive = actor.system?.core_active;

        const activateBtnText = (game.i18n.localize("STYLISH_HUD.Button.Activate") || "ATIVAR").toUpperCase();
        const activeLabel = game.i18n.localize("STYLISH_HUD.Button.Active") || "ATIVO";
        const passiveLabel = game.i18n.localize("STYLISH_HUD.Button.Passive") || "PASSIVO";

        // Active Power
        items.push({
            id: `core-active-${frame.id}`,
            name: `<span style="font-weight:bold; vertical-align:middle; ${isCoreActive ? 'color: var(--l-accent); text-shadow: 0 0 5px var(--l-accent);' : ''}">[${activeLabel}] ${coreActiveName}</span>`,
            img: frame.img || "systems/lancer/assets/icons/skills/nuclear_fire.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('core-active:${frame.id}')">${activateBtnText}</button>`,
            description: core.active_effect || ""
        });

        // Passive Power
        if (core.passive_name) {
            items.push({
                id: `core-passive-${frame.id}`,
                name: `<span style="font-weight:bold; vertical-align:middle;">[${passiveLabel}] ${corePassiveName}</span>`,
                img: "systems/lancer/assets/icons/skills/tactics.svg",
                cost: "",
                description: core.passive_effect || ""
            });
        }
    }

    return { items };
}
