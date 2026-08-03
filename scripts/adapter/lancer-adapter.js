/* scripts/adapter/lancer-adapter.js */
import { BaseSystemAdapter, configProps } from "../base.js";
import { getItemTags } from "./item-tags.js";
import { getStrikeData } from "./data-strike.js";
import { getActionsData } from "./data-actions.js";
import { getCoreData } from "./data-core.js";
import { getTechData } from "./data-tech.js";
import { getSystemData } from "./data-system.js";
import { getTalentData } from "./data-talent.js";
import { getCountersData } from "./data-counters.js";
import { getUtilityData } from "./data-utility.js";
import { getImplementosData } from "./data-implementos.js";
import { getStatusData } from "./data-status.js";
import { getStatsData } from "./data-stats.js";
import { useItem } from "./use-item.js";

/**
 * System Adapter for LANCER RPG in Foundry VTT
 */
export class LancerSystemAdapter extends BaseSystemAdapter {
    constructor() {
        super();
        this.systemId = "lancer";
    }

    /**
     * Default attributes to display on the HUD bars/badges
     */
    getDefaultAttributes() {
        return [
            { path: "system.hp", label: "HP", color: "#00ff66", icon: "material-symbols-outlined icon-google-hp" },
            { path: "system.heat", label: "HEAT", color: "#ffaa00", icon: "material-symbols-outlined icon-google-sp" },
            { path: "system.structure", label: "STRUCT", color: "#ff3333", style: "badge", icon: "material-symbols-outlined icon-google-ac" },
            { path: "system.stress", label: "STRESS", color: "#ff3333", style: "badge", icon: "material-symbols-outlined icon-google-rp" },
            { path: "system.overshield", label: "OS", color: "#3399ff", style: "badge", icon: "material-symbols-outlined icon-google-os" }
        ];
    }

    /**
     * Retrieves lists of trackable attributes based on actor type (Pilot vs Mech)
     */
    getTrackableAttributes(actor) {
        const stats = [];
        if (!actor) return stats;

        // Universal attributes
        stats.push({ path: "system.hp", label: "Hit Points (HP)" });
        stats.push({ path: "system.overshield", label: "Overshield" });

        // Mech & NPC specific attributes
        if (actor.type === "mech" || actor.type === "npc") {
            stats.push({ path: "system.heat", label: "Heat" });
            stats.push({ path: "system.structure", label: "Structure" });
            stats.push({ path: "system.stress", label: "Reactor Stress" });
            stats.push({ path: "system.repairs", label: "Repair Capacity" });
            stats.push({ path: "system.speed", label: "Speed" });
            stats.push({ path: "system.evasion", label: "Evasion" });
            stats.push({ path: "system.edef", label: "E-Defense" });
            stats.push({ path: "system.armor", label: "Armor" });
            stats.push({ path: "system.sensor_range", label: "Sensor Range" });
            stats.push({ path: "system.tech_attack", label: "Tech Attack" });
        } else if (actor.type === "pilot") {
            // Pilot specific attributes
            stats.push({ path: "system.speed", label: "Speed" });
            stats.push({ path: "system.evasion", label: "Evasion" });
            stats.push({ path: "system.edef", label: "E-Defense" });
            stats.push({ path: "system.armor", label: "Armor" });
        }

        // HASE Core Stats (Always present)
        stats.push({ path: "system.hull", label: "HULL" });
        stats.push({ path: "system.agi", label: "AGILITY" });
        stats.push({ path: "system.sys", label: "SYSTEMS" });
        stats.push({ path: "system.eng", label: "ENGINEERING" });

        return stats;
    }

    /**
     * Determines if a stat path is rollable via HASE system rolls
     */
    isStatRollable(path) {
        return [
            "system.hull",
            "system.agi",
            "system.sys",
            "system.eng"
        ].includes(path);
    }

    /**
     * Handles HASE rolls through Lancer native flows
     */
    async rollStat(actor, path, event) {
        if (this.isStatRollable(path)) {
            return actor.beginStatFlow(path);
        }
        return null;
    }

    /**
     * Default Action HUD Tab structure
     */
    getDefaultLayout() {
        return [
            {
                systemId: "strike",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Weapons")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            },
            {
                systemId: "actions",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Actions")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            },
            {
                systemId: "tech",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Tech")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            },
            {
                systemId: "system",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Systems")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: true,
            },
            {
                systemId: "core",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Core")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            },
            {
                systemId: "talent",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Talents")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: true,
            },
            {
                systemId: "dice",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Dice") || "Dados"}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            },
            {
                systemId: "implementos",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Implementos")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            },
            {
                systemId: "status",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Statuses")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            },
            {
                systemId: "stats",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Stats")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
                icon: "",
                type: "submenu",
                useSidebar: false,
            }
        ];
    }

    /**
     * Renders sub-menu lists dynamically based on system category
     */
    async _getSystemSubMenuData(actor, systemId, menuData) {
        switch (systemId) {
            case "strike":
                return { ...getStrikeData(actor), title: menuData.label };
            case "actions":
                return { ...getActionsData(actor), title: menuData.label };
            case "tech":
                return { ...getTechData(actor), title: menuData.label };
            case "system":
                return { ...getSystemData(actor), title: menuData.label };
            case "core":
                return { ...getCoreData(actor), title: menuData.label };
            case "talent":
                return { ...getTalentData(actor), title: menuData.label };
            case "dice":
            case "counters":
                return { ...getCountersData(actor), title: menuData.label };
            case "implementos":
                return { ...getImplementosData(actor), title: menuData.label };
            case "utility":
                return { ...getUtilityData(actor), title: menuData.label };
            case "status":
                return { ...getStatusData(actor), title: menuData.label };
            case "stats":
                return { ...getStatsData(actor), title: menuData.label };
            default:
                return { title: menuData.label, items: [] };
        }
    }

    /**
     * Extrai tags de um item. Mantido como método para compatibilidade com BaseSystemAdapter.
     */
    _getItemTags(w) {
        return getItemTags(w);
    }

    /**
     * Retorna dados de utilitários. Mantido como método para ser chamado pelo LancerActionHUD.getData().
     */
    _getUtilityData(actor) {
        return getUtilityData(actor);
    }

    /**
     * Executes actions triggered via the Action HUD submenu buttons
     */
    async useItem(actor, itemId, event = null) {
        // Tenta lógica própria do Lancer primeiro
        const result = await useItem(actor, itemId, event);
        // Se não tratado aqui, delega para o base adapter
        if (result === undefined && !_isHandledByLancer(itemId)) {
            return super.useItem(actor, itemId, event);
        }
        return result;
    }
}

/**
 * Verifica se o itemId é tratado localmente (evita chamada desnecessária ao super).
 * @param {string} itemId
 * @returns {boolean}
 */
function _isHandledByLancer(itemId) {
    const prefixes = [
        "tracker:", "attack:", "damage:", "tech:", "core-active:", "activate:",
        "deploy:", "util:", "basic:", "test:", "status:", "target-status:",
        "change-profile:", "system-action:", "talent-rank-action:", "destroy-toggle:", "stats-roll:",
        "counter-set:", "counter-delta:", "counter-reset:"
    ];
    return prefixes.some(p => itemId.startsWith(p));
}

