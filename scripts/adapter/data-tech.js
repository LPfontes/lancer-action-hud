/* scripts/adapter/data-tech.js */
import { getItemTags } from "./item-tags.js";

/**
 * Retorna dados de ações de tech para o HUD.
 * @param {Actor} actor
 * @returns {{ items: Array }}
 */
export function getTechData(actor) {
    const items = [];
    if (!actor) return { items };

    // In Lancer, tech actions can be triggered by systems with tech properties or standard tech options
    const techSystems = actor.items.filter(i => {
        if (i.type === "npc_feature" && i.system?.type === "Tech") return true;
        if (i.type === "mech_system") {
            if (i.system?.type === "Tech" || i.system?.type === "AI") return true;
            if (i.system?.actions?.some(a => a.activation?.includes("Tech") || a.name?.toLowerCase().includes("invade"))) return true;
            if (i.system?.tags?.some(t => t.id === "tg_invade" || t.id === "tg_tech")) return true;
        }
        return false;
    });

    techSystems.forEach(s => {
        const actionButtons = `
            <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('tech:${s.id}', event)">
                ${game.i18n.localize('STYLISH_HUD.Stats.TechAttack')}
            </button>
        `;
        items.push({
            id: s.id,
            name: s.name,
            img: s.img || "systems/lancer/assets/icons/generic_item.svg",
            cost: actionButtons,
            tags: getItemTags(s),
            description: s.system?.effect || s.system?.description || ""
        });
    });

    // Add basic Tech Actions
    items.unshift(
        {
            id: "basic-invade",
            name: game.i18n.localize("STYLISH_HUD.Basic.Invade.Name"),
            img: "systems/lancer/assets/icons/skills/hacker.svg",
            cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('tech:invade')">
                ${game.i18n.localize('STYLISH_HUD.Stats.TechAttack')}
            </button>`,
            tags: [
                { label: "2 Heat", class: "tag-damage" },
                { label: game.i18n.localize("STYLISH_HUD.Stats.Sensors") || "Sensors", class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Invade.Desc"),
            isAction: true
        },
        {
            id: "basic-lockon",
            name: game.i18n.localize("STYLISH_HUD.Basic.LockOn.Name"),
            img: "systems/lancer/assets/icons/skills/spotter.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88, 180, 52, 0.05); border-color:rgba(88, 180, 52, 0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:lockon')">
                ${game.i18n.localize('STYLISH_HUD.Checks.QuickTech')}
            </button>`,
            tags: [
                { label: game.i18n.localize("STYLISH_HUD.Stats.Sensors") || "Sensors", class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.LockOn.Desc"),
            isAction: true
        },
        {
            id: "basic-bolster",
            name: game.i18n.localize("STYLISH_HUD.Basic.Bolster.Name"),
            img: "systems/lancer/assets/icons/skills/leader.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88, 180, 52, 0.05); border-color:rgba(88, 180, 52, 0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:bolster')">
                ${game.i18n.localize('STYLISH_HUD.Checks.QuickTech')}
            </button>`,
            tags: [
                { label: game.i18n.localize("STYLISH_HUD.Stats.Sensors") || "Sensors", class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Bolster.Desc"),
            isAction: true
        }
    );

    return { items };
}
