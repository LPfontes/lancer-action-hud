/* scripts/adapter/data-status.js */

/**
 * Retorna dados de status/condições para o HUD.
 * @param {Actor} actor
 * @returns {{ items: Array }}
 */
export function getStatusData(actor) {
    const items = [];
    if (!actor) return { items };

    let conditions = [];
    if (CONFIG.statusEffects && CONFIG.statusEffects.length > 0) {
        conditions = CONFIG.statusEffects.map(effect => {
            const nameStr = effect.name || effect.label || effect.id;
            return {
                id: effect.id,
                name: game.i18n.has(nameStr) ? game.i18n.localize(nameStr) : nameStr,
                img: effect.icon || effect.img || "icons/svg/aura.svg",
                sysDesc: effect.description || ""
            };
        });
    } else {
        conditions = [
            { id: "lockon", name: "Lock On", img: "systems/lancer/assets/icons/white/condition_lockon.svg" },
            { id: "exposed", name: "Exposed", img: "systems/lancer/assets/icons/white/status_exposed.svg" },
            { id: "impaired", name: "Impaired", img: "systems/lancer/assets/icons/white/condition_impaired.svg" },
            { id: "jammed", name: "Jammed", img: "systems/lancer/assets/icons/white/condition_jammed.svg" },
            { id: "shredded", name: "Shredded", img: "systems/lancer/assets/icons/white/condition_shredded.svg" },
            { id: "slowed", name: "Slowed", img: "systems/lancer/assets/icons/white/condition_slow.svg" },
            { id: "stunned", name: "Stunned", img: "systems/lancer/assets/icons/white/condition_stunned.svg" },
            { id: "prone", name: "Prone", img: "systems/lancer/assets/icons/white/status_prone.svg" },
            { id: "shutdown", name: "Shut Down", img: "systems/lancer/assets/icons/white/status_shutdown.svg" },
            { id: "invisible", name: "Invisible", img: "systems/lancer/assets/icons/white/status_invisible.svg" },
            { id: "hidden", name: "Hidden", img: "systems/lancer/assets/icons/white/status_hidden.svg" }
        ];
    }

    conditions.forEach(cond => {
        const isActive = (actor.statuses && actor.statuses.has(cond.id)) || actor.system?.statuses?.[cond.id] || false;
        const toggleLabel = isActive ? game.i18n.localize('STYLISH_HUD.Label.Active') : game.i18n.localize('STYLISH_HUD.Label.ApplySelf');
        const toggleBtn = `<button type="button" class="pf2e-map-btn ${isActive ? 'active' : ''}" style="${isActive ? 'background:#802932 !important; color:#fff !important;' : ''}" onclick="event.stopPropagation(); StylishAction.useItem('status:${cond.id}')">${toggleLabel}</button>`;

        const targetBtn = `<button type="button" class="pf2e-dmg-btn" onclick="event.stopPropagation(); StylishAction.useItem('target-status:${cond.id}')">${game.i18n.localize('STYLISH_HUD.Label.ApplyTarget')}</button>`;
        const costHtml = `<div style="display:grid; gap:4px; align-items:center;"> ${toggleBtn}${targetBtn}</div>`;

        const capId = cond.id === "lockon" ? "Lockon" :
            cond.id === "shutdown" ? "Shutdown" :
                (cond.id.charAt(0).toUpperCase() + cond.id.slice(1));

        const nameKey = `LANCER.Status${capId}`;
        const descKey = `LANCER.Status${capId}Desc`;

        let displayName = cond.name;
        if (game.i18n.has(nameKey)) {
            displayName = game.i18n.localize(nameKey);
        }

        let description = "";
        if (cond.sysDesc) {
            description = game.i18n.has(cond.sysDesc) ? game.i18n.localize(cond.sysDesc) : cond.sysDesc;
        } else if (game.i18n.has(descKey)) {
            description = game.i18n.localize(descKey);
        } else {
            description = game.i18n.format("STYLISH_HUD.Tags.StatusToggleTooltip", { cond: displayName });
        }

        items.push({
            id: `status-${cond.id}`,
            name: displayName,
            img: cond.img,
            cost: costHtml,
            description: description
        });
    });

    return { items };
}
