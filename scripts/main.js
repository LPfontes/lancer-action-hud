/* scripts/main.js */
console.log("Lancer Standalone HUD | main.js loaded");

import { BaseSystemAdapter, configProps } from "./base.js";
import { getIconHtml } from "./icon-config.js";

/**
 * System Adapter for LANCER RPG in Foundry VTT
 */
class LancerSystemAdapter extends BaseSystemAdapter {
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
                systemId: "utility",
                label: `${game.i18n.localize("STYLISH_HUD.Tabs.Utilities")}<span class="material-symbols-outlined" style="margin-left: 15px;"></span>`,
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
                return { ...this._getStrikeData(actor), title: menuData.label };
            case "tech":
                return { ...this._getTechData(actor), title: menuData.label };
            case "system":
                return { ...this._getSystemData(actor), title: menuData.label };
            case "core":
                return { ...this._getCoreData(actor), title: menuData.label };
            case "talent":
                return { ...this._getTalentData(actor), title: menuData.label };
            case "utility":
                return { ...this._getUtilityData(actor), title: menuData.label };
            case "status":
                return { ...this._getStatusData(actor), title: menuData.label };
            case "stats":
                return { ...this._getStatsData(actor), title: menuData.label };
            default:
                return { title: menuData.label, items: [] };
        }
    }

    _getItemTags(w) {
        const tags = [];
        if (!w || !w.system) return tags;

        const extractFromSource = (source) => {
            if (!source) return;

            // 1. System tags
            const tagsField = source.all_tags || source.tags;
            if (tagsField) {
                const wTags = Array.isArray(tagsField) ? tagsField : [tagsField];
                wTags.forEach(t => {
                    if (!t) return;
                    let id = "";
                    let val = null;
                    let customTooltip = "";
                    if (typeof t === "string") {
                        id = t;
                    } else if (typeof t === "object") {
                        id = t.id || t.name || "";
                        val = t.val !== undefined ? t.val : t.value;
                        customTooltip = t.description || t.desc || "";
                    }
                    if (id) {
                        const capId = typeof id.capitalize === "function" ? id.capitalize() : (id.charAt(0).toUpperCase() + id.slice(1));
                        const nameKey = `LANCER.Tag${capId}`;
                        const descKey = `LANCER.Tag${capId}Desc`;

                        let label = game.i18n.has(nameKey) ? game.i18n.localize(nameKey) : id;
                        if (val !== undefined && val !== null) {
                            label = `${label} ${val}`;
                        }

                        let tooltip = customTooltip;
                        if (!tooltip && game.i18n.has(descKey)) {
                            tooltip = game.i18n.localize(descKey);
                        }

                        if (!tags.some(existing => existing.label === label)) {
                            tags.push({
                                label: label,
                                class: "tag-system",
                                tooltip: tooltip
                            });
                        }
                    }
                });
            }
        };

        // Extract from main system object
        extractFromSource(w.system);

        // Also extract from profiles if they exist (standard for Lancer weapons)
        if (w.system.profiles && Array.isArray(w.system.profiles)) {
            w.system.profiles.forEach(profile => {
                extractFromSource(profile);
            });
        }

        return tags;
    }

    _getStrikeData(actor) {
        const items = [];
        if (!actor) return { items };

        // Build map of weapons to their mounts
        const weaponMountMap = {};
        if (actor.system.loadout?.weapon_mounts) {
            actor.system.loadout.weapon_mounts.forEach((mount, mountIdx) => {
                const mountType = mount.type || `Mount ${mountIdx + 1}`;
                if (mount.slots) {
                    mount.slots.forEach(slot => {
                        const weaponId = slot.weapon?.id || slot.weapon?._id || slot.weapon?.value?.id;
                        if (weaponId) {
                            weaponMountMap[weaponId] = mountType;
                        }
                    });
                }
            });
        }

        // Fetch Lancer weapons (mech_weapon, pilot_weapon, or npc feature weapons)
        const weapons = actor.items.filter(i =>
            i.type === "mech_weapon" ||
            i.type === "pilot_weapon" ||
            (i.type === "npc_feature" && i.system?.type === "Weapon")
        );

        // Group weapons by mount
        const groups = new Map();

        weapons.forEach(w => {
            const hasUses = w.system?.uses && w.system.uses.max > 0;
            const usesLabel = hasUses ? `<span style="font-family:'Orbitron'; font-size:0.85em; color:#802932; margin-left:8px;">[Uses: ${w.system.uses.value}/${w.system.uses.max}]</span>` : "";

            // Determine active profile or fallback to system object
            const profileIndex = w.system.selected_profile_index ?? 0;
            const activeProfile = w.system.profiles?.[profileIndex] || w.system;

            // Extract Damage info
            const rawDmg = activeProfile.damage || w.system.damage || [];
            const dmgArray = Array.isArray(rawDmg) ? rawDmg : [rawDmg];
            const dmgObj = dmgArray[0];
            let dmgVal = "";
            let dmgType = "";
            if (dmgObj) {
                if (typeof dmgObj === "object") {
                    const rawVal = dmgObj.val !== undefined ? dmgObj.val : dmgObj.value;
                    dmgVal = (rawVal !== undefined && rawVal !== null) ? rawVal : "";
                    dmgType = (dmgObj.type || "").toLowerCase();
                } else {
                    dmgVal = dmgObj;
                }
            }
            if (dmgArray.length > 1) {
                const extraDmgList = [];
                for (let i = 0; i < dmgArray.length; i++) {
                    const d = dmgArray[i];
                    if (d) {
                        if (typeof d === "object") {
                            const rawVal = d.val !== undefined ? d.val : d.value;
                            if (rawVal !== undefined && rawVal !== null) extraDmgList.push(rawVal);
                        } else {
                            extraDmgList.push(d);
                        }
                    }
                }
                if (extraDmgList.length > 0) dmgVal = extraDmgList.join(" + ");
            }

            let dmgIcon = "cci cci-kinetic";
            if (dmgType.includes("explosive") || dmgType.includes("explosivo")) dmgIcon = "cci cci-explosive -glow-explosive";
            else if (dmgType.includes("energy") || dmgType.includes("energia")) dmgIcon = "cci cci-energy";
            else if (dmgType.includes("burn") || dmgType.includes("queimadura")) dmgIcon = "cci cci-burn";

            // Extract Range info
            const rawRange = activeProfile.range || w.system.range || [];
            const rangeArray = Array.isArray(rawRange) ? rawRange : [rawRange];
            const rangeObj = rangeArray[0];
            let rangeVal = "";
            let rangeType = "";
            if (rangeObj) {
                if (typeof rangeObj === "object") {
                    const rawVal = rangeObj.val !== undefined ? rangeObj.val : rangeObj.value;
                    rangeVal = (rawVal !== undefined && rawVal !== null) ? rawVal : "";
                    rangeType = (rangeObj.type || "").toLowerCase();
                } else {
                    rangeVal = rangeObj;
                }
            }
            if (rangeArray.length > 1) {
                const extraRangeList = [];
                for (let i = 0; i < rangeArray.length; i++) {
                    const r = rangeArray[i];
                    if (r) {
                        if (typeof r === "object") {
                            const rawVal = r.val !== undefined ? r.val : r.value;
                            if (rawVal !== undefined && rawVal !== null) extraRangeList.push(rawVal);
                        } else {
                            extraRangeList.push(r);
                        }
                    }
                }
                if (extraRangeList.length > 0) rangeVal = extraRangeList.join(" / ");
            }

            let rangeIcon = "cci cci-range";
            if (rangeType.includes("threat") || rangeType.includes("ameaça") || rangeType.includes("corpo a corpo") || rangeType.includes("melee")) rangeIcon = "cci cci-melee";
            else if (rangeType.includes("line") || rangeType.includes("linha")) rangeIcon = "cci cci-line";
            else if (rangeType.includes("cone")) rangeIcon = "cci cci-cone";
            else if (rangeType.includes("blast") || rangeType.includes("explosão")) rangeIcon = "cci cci-blast";

            const tooltipText = `
                <div class="la-tooltip__content">
                    Clique Esquerdo: Rolar Ataque<br>
                    Clique Direito: Rolar Dano
                </div>
            `;

            const actionButtons = `
                <button type="button" class= "roll-damage" 
                    data-tooltip="${tooltipText.replace(/"/g, '&quot;')}" 
                    data-tooltip-class="clipped-bot la-tooltip la-gmsdark" 
                    data-tooltip-direction="UP" 
                    aria-label="Rolar" 
                    onclick="event.stopPropagation(); StylishAction.useItem('attack:${w.id}', event)" 
                    oncontextmenu="event.preventDefault(); event.stopPropagation(); StylishAction.useItem('damage:${w.id}', event)">
                    <span class="range">
                        <span class="la-number-weapon__span">${rangeVal || "-"}</span> 
                        <i class="${rangeIcon}"></i>
                    </span>
                    <span class="damage">
                        <span class="la-number-weapon__span">${dmgVal || "-"}</span>
                        <i class="${dmgIcon}"></i>
                    </span>
                    <i style=""></i>
                </button>
            `;

            let descParts = [];
            const mainDesc = activeProfile.effect || w.system?.effect || "";
            if (mainDesc) descParts.push(`<div>${mainDesc}</div>`);

            // Profile Switcher for weapons with multiple profiles
            if (w.system.profiles && w.system.profiles.length > 1) {
                let switcherHtml = `<div class="la-limited la-flexrow -widthfull la-bckg-header-anti la-text-header clipped-alt" style="display:flex; gap:4px; margin-top:8px; margin-bottom:8px; flex-wrap:wrap; width:100%;">`;
                w.system.profiles.forEach((prof, idx) => {
                    const isActiveProfile = idx === profileIndex;
                    const activeClass = isActiveProfile ? "selected-profile la-bckg-secondary -pulse-glow-prmy -pointerdisable la-prmy-header -bold" : "";
                    const profStyles = "font-family:'Orbitron'; font-size:0.72em; padding:4px 8px; cursor:pointer; border:1px solid rgba(128,41,50,0.2); background:rgba(128,41,50,0.05); color:#802932; border-radius:0px; display:inline-flex; align-items:center;" + 
                                       (isActiveProfile ? " background:var(--l-accent) !important; color:#ffffff !important; border-color:var(--l-accent) !important; text-shadow:none !important; box-shadow:0 0 6px var(--l-accent) !important;" : "");
                    const profName = prof.name || `${w.name} (Profile ${idx + 1})`;
                    switcherHtml += `
                        <button type="button" class="la-prmy-primary -glow-prmy-hover gen-control ${activeClass}" 
                            style="${profStyles}"
                            onclick="event.stopPropagation(); StylishAction.useItem('change-profile:${w.id}:${idx}')">
                            <span class="-padding1-lr -fontsizemedium -upper">${profName}</span>
                        </button>
                    `;
                });
                switcherHtml += `</div>`;
                descParts.push(switcherHtml);
            }

            if (activeProfile.on_attack || w.system?.on_attack) {
                descParts.push(`<div style="margin-top: 5px;"><strong>${game.i18n.localize('STYLISH_HUD.Weapon.OnAttack')}:</strong> ${activeProfile.on_attack || w.system.on_attack}</div>`);
            }
            if (activeProfile.on_hit || w.system?.on_hit) {
                descParts.push(`<div style="margin-top: 5px;"><strong>${game.i18n.localize('STYLISH_HUD.Weapon.OnHit')}:</strong> ${activeProfile.on_hit || w.system.on_hit}</div>`);
            }
            if (activeProfile.on_crit || w.system?.on_crit) {
                descParts.push(`<div style="margin-top: 5px;"><strong>${game.i18n.localize('STYLISH_HUD.Weapon.OnCrit')}:</strong> ${activeProfile.on_crit || w.system.on_crit}</div>`);
            }
            const fullDescription = descParts.join("");

            const isDestroyed = w.system?.destroyed;
            const destroyedLabel = isDestroyed ? `<span style="font-family:'Orbitron'; font-size:0.85em; color:#ff3333; margin-left:8px; font-weight:bold;">[DESTRUÍDO]</span>` : "";
            const nameStyle = isDestroyed ? "font-weight:bold; vertical-align:middle; text-decoration:line-through; opacity:0.6;" : "font-weight:bold; vertical-align:middle;";

            const weaponItem = {
                id: w.id,
                name: `<span style="${nameStyle}">${w.name}</span>${usesLabel}${destroyedLabel}`,
                img: w.img || "systems/lancer/assets/icons/generic_item.svg",
                cost: actionButtons,
                tags: this._getItemTags(w),
                description: fullDescription
            };

            const mountLabel = weaponMountMap[w.id] || "other";
            if (!groups.has(mountLabel)) {
                groups.set(mountLabel, []);
            }
            groups.get(mountLabel).push(weaponItem);
        });

        // Add weapons grouped by mounts in loadout order
        if (actor.system.loadout?.weapon_mounts) {
            actor.system.loadout.weapon_mounts.forEach((mount, mountIdx) => {
                const mountType = mount.type || `Mount ${mountIdx + 1}`;
                if (groups.has(mountType)) {
                    let localizedMount = mountType;
                    if (game.i18n.lang === "pt-BR") {
                        const ptMap = {
                            "Main": "Encaixe Principal",
                            "Heavy": "Encaixe Pesado",
                            "Flex": "Encaixe Flexível",
                            "Aux/Aux": "Encaixe Aux/Aux",
                            "Integrated": "Encaixe Integrado",
                            "Main/Aux": "Encaixe Principal/Aux"
                        };
                        localizedMount = ptMap[mountType] || mountType;
                    }

                    items.push({
                        name: localizedMount,
                        isHeader: true
                    });
                    items.push(...groups.get(mountType));
                    groups.delete(mountType);
                }
            });
        }

        // Add remaining groups (e.g. unmounted weapons or pilot weapons under fallback header)
        for (const [key, weaponList] of groups.entries()) {
            const headerName = key === "other"
                ? game.i18n.localize("STYLISH_HUD.Weapon.OtherHeader")
                : key;
            items.push({
                name: headerName,
                isHeader: true
            });
            items.push(...weaponList);
        }

        return { items };
    }

    _getCoreData(actor) {
        const items = [];
        if (!actor || actor.type !== "mech") return { items };

        const frame = actor.items.find(i => i.type === "frame" || i.system?.type === "Frame" || (typeof i.is_frame === "function" && i.is_frame()));
        if (frame && frame.system?.core_system) {
            const core = frame.system.core_system;
            const coreActiveName = core.active_name || "Core Power";
            const corePassiveName = core.passive_name || "Passive";
            const isCoreActive = actor.system?.core_active;

            // Active Power
            items.push({
                id: `core-active-${frame.id}`,
                name: `<span style="font-weight:bold; vertical-align:middle; ${isCoreActive ? 'color: var(--l-accent); text-shadow: 0 0 5px var(--l-accent);' : ''}">[ACTIVE] ${coreActiveName}</span>`,
                img: frame.img || "systems/lancer/assets/icons/skills/nuclear_fire.svg",
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('core-active:${frame.id}')">ACTIVATE</button>`,
                description: core.active_effect || ""
            });

            // Passive Power
            if (core.passive_name) {
                items.push({
                    id: `core-passive-${frame.id}`,
                    name: `<span style="font-weight:bold; vertical-align:middle;">[PASSIVE] ${corePassiveName}</span>`,
                    img: "systems/lancer/assets/icons/skills/tactics.svg",
                    cost: "",
                    description: core.passive_effect || ""
                });
            }
        }

        return { items };
    }

    _getTechData(actor) {
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
                <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('tech:${s.id}', event)">TECH ATTACK</button>
            `;
            items.push({
                id: s.id,
                name: s.name,
                img: s.img || "systems/lancer/assets/icons/generic_item.svg",
                cost: actionButtons,
                tags: this._getItemTags(s),
                description: s.system?.effect || s.system?.description || ""
            });
        });

        // Add basic Tech Actions
        items.unshift(
            {
                id: "basic-invade",
                name: game.i18n.localize("STYLISH_HUD.Basic.Invade.Name"),
                img: "systems/lancer/assets/icons/skills/hacker.svg",
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('basic:invade')">TECH ATTACK</button>`,
                tags: `<div class="lancer-tags"><span class="lancer-tag damage-tag">2 Heat</span><span class="lancer-tag range-tag">Sensors</span></div>`,
                description: game.i18n.localize("STYLISH_HUD.Basic.Invade.Desc")
            },
            {
                id: "basic-lockon",
                name: game.i18n.localize("STYLISH_HUD.Basic.LockOn.Name"),
                img: "systems/lancer/assets/icons/skills/spotter.svg",
                cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88, 180, 52, 0.05); border-color:rgba(88, 180, 52, 0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:lockon')">QUICK TECH</button>`,
                tags: `<div class="lancer-tags"><span class="lancer-tag range-tag">Sensors</span></div>`,
                description: game.i18n.localize("STYLISH_HUD.Basic.LockOn.Desc")
            },
            {
                id: "basic-bolster",
                name: game.i18n.localize("STYLISH_HUD.Basic.Bolster.Name"),
                img: "systems/lancer/assets/icons/skills/leader.svg",
                cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88, 180, 52, 0.05); border-color:rgba(88, 180, 52, 0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:bolster')">QUICK TECH</button>`,
                tags: `<div class="lancer-tags"><span class="lancer-tag range-tag">Sensors</span></div>`,
                description: game.i18n.localize("STYLISH_HUD.Basic.Bolster.Desc")
            }
        );

        return { items };
    }

    _getSystemData(actor) {
        const categories = {
            all: []
        };
        if (!actor) return { items: categories };

        const systems = actor.items.filter(i =>
            i.type === "mech_system" ||
            i.type === "pilot_gear" ||
            i.type === "pilot_armor" ||
            (i.type === "npc_feature" && i.system?.type === "System")
        );

        systems.forEach(s => {
            const isDrone = s.system?.type?.toLowerCase() === "drone" ||
                s.system?.tags?.some(t => (typeof t === "string" ? t : t.id)?.toLowerCase() === "drone");
            const hasDeployables = s.system?.deployables && s.system.deployables.length > 0;

            let actionButtons = `
                <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('activate:${s.id}', event)" data-tooltip="Enviar um card representando este item para o chat"><i class="fas fa-comment-alt"></i></button>
            `;

            if (isDrone && hasDeployables) {
                actionButtons = `
                    <div style="display:inline-flex; gap:4px; align-items:center;">
                        <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('activate:${s.id}', event)" data-tooltip="Enviar um card representando este item para o chat"><i class="fas fa-comment-alt"></i></button>
                        <button type="button" class="pf2e-dmg-btn" style="background:rgba(88, 180, 52, 0.05) !important; border-color:rgba(88, 180, 52, 0.25) !important; color:#58b434 !important;" onclick="event.stopPropagation(); StylishAction.useItem('deploy:${s.id}', event)" data-tooltip="Posicionar/Deploy Drone no mapa"><i class="fas fa-robot"></i></button>
                    </div>
                `;
            } else if (s.system?.actions && Array.isArray(s.system.actions) && s.system.actions.length > 0) {
                let actionBtnsHtml = s.system.actions.map((act, index) => {
                    const actType = act.activation || "Ação";
                    return `<button type="button" class="pf2e-map-btn" style="background:rgba(88, 180, 52, 0.05); border-color:rgba(88, 180, 52, 0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('system-action:${s.id}:${index}', event)" data-tooltip="${act.detail || 'Ativar ação do sistema'}">${actType.toUpperCase()}</button>`;
                }).join("");
                actionButtons = `
                    <div style="display:inline-flex; gap:4px; align-items:center;">
                        <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('activate:${s.id}', event)" data-tooltip="Enviar um card representando este item para o chat"><i class="fas fa-comment-alt"></i></button>
                        ${actionBtnsHtml}
                    </div>
                `;
            }

            const isDestroyed = s.system?.destroyed;
            const destroyedLabel = isDestroyed ? `<span style="font-family:'Orbitron'; font-size:0.85em; color:#ff3333; margin-left:8px; font-weight:bold;">[DESTRUÍDO]</span>` : "";
            const nameStyle = isDestroyed ? "text-decoration:line-through; opacity:0.6;" : "";
            const displayName = isDestroyed ? `<span style="${nameStyle}">${s.name}</span>${destroyedLabel}` : s.name;

            categories.all.push({
                id: s.id,
                name: displayName,
                img: s.img || "systems/lancer/assets/icons/generic_item.svg",
                cost: actionButtons,
                tags: this._getItemTags(s),
                description: s.system?.effect || s.system?.description || ""
            });
        });

        return {
            hasTabs: true,
            hasSubTabs: false,
            items: categories,
            tabLabels: { all: "Systems" }
        };
    }

    _getTalentData(actor) {
        const categories = {
            all: []
        };
        if (!actor) return { items: categories };

        // If the actor is a mech, retrieve talents from its pilot
        let targetActor = actor;
        if (actor.type === "mech") {
            const pilotActorObj = actor.system.pilot?.value;
            if (pilotActorObj) {
                targetActor = pilotActorObj;
            } else {
                const pilotId = actor.system.pilot?.id || actor.system.pilot_id || actor.system.pilot;
                if (pilotId && typeof pilotId === "string") {
                    const pilotActor = game.actors.get(pilotId);
                    if (pilotActor) targetActor = pilotActor;
                } else {
                    // Fallback: search for pilot actor owned by the user
                    const ownedPilots = game.actors.filter(a => a.type === "pilot" && (a.isOwner || game.user.isGM));
                    if (ownedPilots.length > 0) {
                        const matched = ownedPilots.find(p =>
                            actor.name.toLowerCase().includes(p.name.toLowerCase()) ||
                            p.name.toLowerCase().includes(actor.name.toLowerCase())
                        );
                        targetActor = matched || ownedPilots[0];
                    }
                }
            }
        }

        const talents = targetActor.items.filter(i => i.type === "talent");
        talents.forEach(t => {
            const currRank = t.system.curr_rank || 1;
            const rankIndex = Math.max(0, currRank - 1);
            const rankObj = t.system.ranks?.[rankIndex];
            const traitDescription = rankObj?.description || rankObj?.desc || rankObj?.text || t.system?.description || "";

            categories.all.push({
                id: t.id,
                name: `${t.name} (Rank ${currRank})` + (rankObj?.name ? ` - ${rankObj.name}` : ""),
                img: t.img || "systems/lancer/assets/icons/generic_item.svg",
                cost: "",
                description: traitDescription
            });
        });

        return {
            hasTabs: true,
            hasSubTabs: false,
            items: categories,
            tabLabels: { all: "Talents" }
        };
    }

    _getUtilityData(actor) {
        const items = [];
        if (!actor) return { items };

        // Standard LANCER tical options
        if (actor.type === "mech" || actor.type === "npc") {
            let overchargeDie = "1";
            if (actor.system?.overcharge !== undefined) {
                const ocLevel = actor.system.overcharge;
                const ocSequence = actor.system.overcharge_sequence ? actor.system.overcharge_sequence.split(",") : ["1", "1d4", "1d6", "1d6+4"];
                const idx = Math.min(ocLevel, ocSequence.length - 1);
                overchargeDie = ocSequence[idx] || "1";
            }

            const ocNameStr = game.i18n.localize("STYLISH_HUD.Utilities.Overcharge.Name");
            const displayDie = overchargeDie.toString().startsWith('+') ? overchargeDie : `+${overchargeDie}`;
            const ocNameWithDie = `${ocNameStr} <span style="font-family:'Orbitron'; font-size:0.85em; color:#ffaa00; margin-left:8px;">[${displayDie} Heat]</span>`;

            items.push({
                id: "util-overcharge",
                name: ocNameWithDie,
                img: `<i class="cci cci-burn la-dropshadow -fontsize11"></i>`,
                isIcon: true,
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:overcharge')">ACTIVATE</button>`,
                description: game.i18n.localize("STYLISH_HUD.Utilities.Overcharge.Desc")
            });
            items.push({
                id: "util-stabilize",
                name: game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Name"),
                img: `<i class="cci cci-repair la-dropshadow -fontsize11"></i>`,
                isIcon: true,
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:stabilize')">ACTIVATE</button>`,
                description: game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Desc")
            });
            items.push({
                id: "util-full-repair",
                name: game.i18n.localize("STYLISH_HUD.Utilities.FullRepair.Name"),
                img: `<i class="cci cci-health la-dropshadow -fontsize11"></i>`,
                isIcon: true,
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:full-repair')">ACTIVATE</button>`,
                description: game.i18n.localize("STYLISH_HUD.Utilities.FullRepair.Desc")
            });

            // Add basic Reactions
            items.push(
                {
                    id: "basic-brace",
                    name: game.i18n.localize("STYLISH_HUD.Basic.Brace.Name"),
                    img: "systems/lancer/assets/icons/skills/hull.svg",
                    cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215, 60, 50, 0.05); border-color:rgba(215, 60, 50, 0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:brace')">REACTION</button>`,
                    description: game.i18n.localize("STYLISH_HUD.Basic.Brace.ShortDesc")
                },
                {
                    id: "basic-overwatch",
                    name: game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Name"),
                    img: "systems/lancer/assets/icons/skills/vanguard.svg",
                    cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215, 60, 50, 0.05); border-color:rgba(215, 60, 50, 0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:overwatch')">REACTION</button>`,
                    description: game.i18n.localize("STYLISH_HUD.Basic.Overwatch.ShortDesc")
                }
            );
        }

        return { items };
    }

    _getStatusData(actor) {
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

            const targetBtn = `<button type="button" class="pf2e-dmg-btn" style="margin-left:4px;" onclick="event.stopPropagation(); StylishAction.useItem('target-status:${cond.id}')">${game.i18n.localize('STYLISH_HUD.Label.ApplyTarget')}</button>`;
            const costHtml = `<div style="display:inline-flex; gap:4px; align-items:center;">${toggleBtn}${targetBtn}</div>`;

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

    _getStatsData(actor) {
        return { items: [] };
    }

    /**
     * Executes actions triggered via the Action HUD submenu buttons
     */
    async useItem(actor, itemId, event = null) {
        console.log(`Lancer Standalone HUD | useItem called for actor: ${actor?.name} (ID: ${actor?.id}), itemId: ${itemId}`);

        if (itemId.startsWith("tracker:")) {
            const actionType = itemId.split(":")[1];
            if (actionType === "reset") {
                await actor.setFlag('stylish-bridge-lancer', 'actionTracker', {
                    move: false, quick1: false, quick2: false, full: false, protocol: false, reaction: false, free: false, overcharge: false, core: false
                });
            } else {
                const current = actor.getFlag('stylish-bridge-lancer', 'actionTracker') || {};
                const newState = !current[actionType];
                current[actionType] = newState;
                
                if (newState === true) {
                    if (actionType === 'quick1' || actionType === 'quick2') {
                        current.full = true;
                    } else if (actionType === 'full') {
                        current.quick1 = true;
                        current.quick2 = true;
                    }
                } else {
                    if (actionType === 'full') {
                        current.quick1 = false;
                        current.quick2 = false;
                    } else if (actionType === 'quick1' || actionType === 'quick2') {
                        if (!current.quick1 && !current.quick2) {
                            current.full = false;
                        }
                    }
                }
                
                await actor.setFlag('stylish-bridge-lancer', 'actionTracker', current);
            }
            return;
        }
        if (!actor) return;

        const deductAction = async (isFull = false) => {
            const current = actor.getFlag('stylish-bridge-lancer', 'actionTracker') || {};
            const updates = { ...current };
            if (isFull) {
                updates.full = true;
                updates.quick1 = true;
                updates.quick2 = true;
            } else {
                if (!updates.quick1) updates.quick1 = true;
                else if (!updates.quick2) updates.quick2 = true;
                
                updates.full = true;
            }
            await actor.setFlag('stylish-bridge-lancer', 'actionTracker', updates);
        };

        const setActionState = async (stateKey) => {
            const current = actor.getFlag('stylish-bridge-lancer', 'actionTracker') || {};
            if (!current[stateKey]) {
                const updates = { ...current, [stateKey]: true };
                await actor.setFlag('stylish-bridge-lancer', 'actionTracker', updates);
            }
        };

        if (itemId.startsWith("attack:")) {
            const id = itemId.replace("attack:", "");
            const item = actor.items.get(id);
            if (item) {
                await deductAction();
                return item.beginWeaponAttackFlow();
            }
        }
        if (itemId.startsWith("damage:")) {
            const id = itemId.replace("damage:", "");
            const item = actor.items.get(id);
            if (item) return item.beginDamageFlow();
        }
        if (itemId.startsWith("tech:")) {
            const id = itemId.replace("tech:", "");
            const item = actor.items.get(id);
            if (item) {
                await deductAction();
                return item.beginTechAttackFlow();
            }
        }
        if (itemId.startsWith("core-active:")) {
            const id = itemId.replace("core-active:", "");
            const item = actor.items.get(id);
            if (item) {
                if (typeof item.beginCoreActiveFlow === "function") return item.beginCoreActiveFlow();
                if (actor.beginCoreActiveFlow) return actor.beginCoreActiveFlow();
                console.log(`Lancer Standalone HUD | Activate core system: ${item?.name}`);
            }
        }
        if (itemId.startsWith("activate:")) {
            const id = itemId.replace("activate:", "");
            const item = actor.items.get(id);
            console.log(`Lancer Standalone HUD | Activate system item: ${item?.name} (ID: ${id})`);
            if (item) {
                const tagsList = [];
                if (item.system?.damage) {
                    const damages = Array.isArray(item.system.damage) ? item.system.damage : [item.system.damage];
                    damages.forEach(d => {
                        if (d && (d.val || d.value)) {
                            tagsList.push(`<span class="lancer-tag damage-tag">${d.val || d.value} ${d.type || ''}</span>`);
                        }
                    });
                }
                if (item.system?.range) {
                    const ranges = Array.isArray(item.system.range) ? item.system.range : [item.system.range];
                    ranges.forEach(r => {
                        if (r && (r.val || r.value || r.type)) {
                            tagsList.push(`<span class="lancer-tag range-tag">${r.type || 'Range'}: ${r.val || r.value || ''}</span>`);
                        }
                    });
                }
                if (item.system?.tags) {
                    const wTags = Array.isArray(item.system.tags) ? item.system.tags : [item.system.tags];
                    wTags.forEach(t => {
                        if (!t) return;
                        let id = typeof t === "string" ? t : (t.id || t.name || "");
                        let val = typeof t === "object" ? (t.val !== undefined ? t.val : t.value) : null;
                        if (id) {
                            const capId = typeof id.capitalize === "function" ? id.capitalize() : (id.charAt(0).toUpperCase() + id.slice(1));
                            const nameKey = `LANCER.Tag${capId}`;
                            let lbl = game.i18n.has(nameKey) ? game.i18n.localize(nameKey) : id;
                            if (val !== undefined && val !== null) lbl = `${lbl} ${val}`;
                            tagsList.push(`<span class="lancer-tag">${lbl}</span>`);
                        }
                    });
                }

                const tagsHtml = tagsList.length ? `<div class="lancer-tags" style="margin-top:4px; margin-bottom:8px;">${tagsList.join('')}</div>` : "";
                const content = `
                    <div class="card clipped-bot" style="margin:0px">
                      <div class="lancer-header lancer-system">
                        // SYSTEM :: ${item.name} //
                      </div>
                      <div class="effect-text">
                        ${tagsHtml}
                        ${item.system.description || item.system.effect || ""}
                      </div>
                    </div>
                `;

                const speaker = ChatMessage.getSpeaker({ actor: actor });
                console.log(`Lancer Standalone HUD | Speaker resolved for activate:`, speaker);

                return ChatMessage.create({
                    user: game.user.id,
                    speaker: speaker,
                    content: content
                });
            }
        }
        if (itemId.startsWith("deploy:")) {
            const id = itemId.replace("deploy:", "");
            const item = actor.items.get(id);
            console.log(`Lancer Standalone HUD | Deploy item: ${item?.name} (ID: ${id})`);
            if (item) {
                let deployableId = item.system.deployables?.[0];
                let deployableActor = game.actors.find(a =>
                    (deployableId && a.system?.lid === deployableId) ||
                    (a.name.toLowerCase() === item.name.toLowerCase())
                );

                if (!deployableActor) {
                    // Try fuzzy name match in game.actors
                    deployableActor = game.actors.find(a =>
                        a.name.toLowerCase().includes(item.name.toLowerCase()) ||
                        item.name.toLowerCase().includes(a.name.toLowerCase())
                    );
                }

                if (!deployableActor) {
                    // Search in compendiums asynchronously
                    for (let pack of game.packs.filter(p => p.metadata.type === "Actor")) {
                        try {
                            const index = await pack.getIndex();
                            const entry = index.find(e =>
                                (deployableId && e.name === deployableId) ||
                                (e.name.toLowerCase() === item.name.toLowerCase()) ||
                                (e.name.toLowerCase().includes(item.name.toLowerCase()))
                            );
                            if (entry) {
                                const doc = await pack.getDocument(entry._id);
                                deployableActor = await Actor.create(doc.toObject());
                                break;
                            }
                        } catch (e) {
                            console.error("Lancer Standalone HUD | Error searching compendium pack:", pack.name, e);
                        }
                    }
                }

                if (deployableActor) {
                    const viewElement = canvas.app.canvas || canvas.app.view;
                    if (viewElement) {
                        viewElement.style.cursor = "crosshair";
                        ui.notifications.info(game.i18n.format("STYLISH_HUD.Deploy.Prompt", { name: deployableActor.name }));

                        const getSnappedPosition = (x, y) => {
                            let snapped = null;
                            if (canvas.grid.getSnappedPoint) {
                                try {
                                    // Try snapping with default center mode (1 / CENTER)
                                    snapped = canvas.grid.getSnappedPoint({ x, y }, { mode: 1 });
                                } catch (e) {
                                    console.warn("Lancer Standalone HUD | getSnappedPoint failed:", e);
                                }
                            }
                            if (snapped && typeof snapped.x === "number" && typeof snapped.y === "number") {
                                return snapped;
                            }
                            if (canvas.grid.getSnappedPosition) {
                                try {
                                    const res = canvas.grid.getSnappedPosition(x, y);
                                    if (res) {
                                        if (typeof res.x === "number" && typeof res.y === "number") return res;
                                        if (Array.isArray(res)) return { x: res[0], y: res[1] };
                                    }
                                } catch (e) {
                                    console.warn("Lancer Standalone HUD | getSnappedPosition failed:", e);
                                }
                            }
                            if (canvas.grid.getCenter) {
                                try {
                                    const res = canvas.grid.getCenter(x, y);
                                    if (res) {
                                        if (typeof res.x === "number" && typeof res.y === "number") return res;
                                        if (Array.isArray(res)) return { x: res[0], y: res[1] };
                                    }
                                } catch (e) {
                                    console.warn("Lancer Standalone HUD | getCenter failed:", e);
                                }
                            }
                            return { x, y };
                        };

                        // Cleanup function for listeners
                        const cleanup = () => {
                            $(viewElement).off("click.deploy");
                            $(viewElement).off("contextmenu.deploy");
                            $(document).off("keydown.deploy");
                            viewElement.style.cursor = "default";
                        };

                        // 1. ESC key listener to cancel
                        $(document).on("keydown.deploy", (e) => {
                            if (e.key === "Escape") {
                                cleanup();
                                ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Deploy.Cancelled"));
                            }
                        });

                        // 2. Right-click listener to cancel
                        $(viewElement).on("contextmenu.deploy", (e) => {
                            e.preventDefault();
                            cleanup();
                            ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Deploy.Cancelled"));
                        });

                        // 3. Click on canvas to spawn
                        $(viewElement).on("click.deploy", async (e) => {
                            e.preventDefault();
                            cleanup();

                            const clickedPos = canvas.mousePosition;
                            const snapped = getSnappedPosition(clickedPos.x, clickedPos.y);

                            try {
                                let tokenData = await deployableActor.getTokenDocument({ x: snapped.x, y: snapped.y });
                                if (typeof tokenData.toObject === "function") {
                                    tokenData = tokenData.toObject();
                                }
                                tokenData.x = snapped.x;
                                tokenData.y = snapped.y;

                                const spawnedTokens = await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);
                                if (spawnedTokens && spawnedTokens.length > 0) {
                                    ui.notifications.info(game.i18n.format("STYLISH_HUD.Deploy.Success", { name: deployableActor.name }));

                                    // Chat card log
                                    const content = `
                                        <div class="card clipped-bot" style="margin:0px">
                                          <div class="lancer-header lancer-system" style="background:#58b434 !important;">
                                            // DEPLOYED :: ${item.name} //
                                          </div>
                                          <div class="effect-text">
                                            <strong>${deployableActor.name}</strong> foi posicionado no campo de batalha.<br><br>
                                            ${item.system.description || item.system.effect || ""}
                                          </div>
                                        </div>
                                    `;
                                    const speaker = ChatMessage.getSpeaker({ actor: actor });
                                    await ChatMessage.create({
                                        user: game.user.id,
                                        speaker: speaker,
                                        content: content
                                    });
                                }
                            } catch (err) {
                                console.error("Lancer Standalone HUD | Error spawning deployable token:", err);
                                ui.notifications.error(`Erro ao criar o token de ${deployableActor.name}: ${err.message}`);
                            }
                        });
                        return;
                    }
                }

                // Fallback to notification and chat card if actor not found
                ui.notifications.warn(game.i18n.format("STYLISH_HUD.Deploy.NotFound", { name: item.name }));
                ui.notifications.info(game.i18n.localize("STYLISH_HUD.Deploy.ChatFallback"));
                const content = `
                    <div class="card clipped-bot" style="margin:0px">
                      <div class="lancer-header lancer-system" style="background:#58b434 !important;">
                        // DEPLOYING :: ${item.name} //
                      </div>
                      <div class="effect-text">
                        <strong>Deployable(s):</strong> ${item.system.deployables?.join(", ") || item.name}<br><br>
                        ${item.system.description || item.system.effect || ""}
                      </div>
                    </div>
                `;
                const speaker = ChatMessage.getSpeaker({ actor: actor });
                return ChatMessage.create({
                    user: game.user.id,
                    speaker: speaker,
                    content: content
                });
            }
        }
        if (itemId.startsWith("util:")) {
            const action = itemId.replace("util:", "");
            if (action === "overcharge") {
                await setActionState('overcharge');
                return actor.beginOverchargeFlow();
            }
            if (action === "stabilize") return actor.beginStabilizeFlow();
            if (action === "full-repair") return actor.beginFullRepairFlow();
        }
        if (itemId.startsWith("basic:")) {
            const action = itemId.replace("basic:", "");
            let name = "";
            let desc = "";
            let icon = "";
            let tagsHtml = "";
            
            if (action === "brace" || action === "overwatch") {
                await setActionState("reaction");
            } else if (action === "invade" || action === "lockon" || action === "bolster") {
                await deductAction();
            }


            if (action === "invade") {
                name = game.i18n.localize("STYLISH_HUD.Basic.Invade.Name");
                icon = "hacker.svg";
                tagsHtml = `<div class="lancer-tags"><span class="lancer-tag damage-tag">2 Heat</span><span class="lancer-tag range-tag">Sensors</span></div>`;
                desc = game.i18n.localize("STYLISH_HUD.Basic.Invade.Desc");
            } else if (action === "lockon") {
                const targets = game.user.targets;
                if (targets.size > 0) {
                    for (let target of targets) {
                        if (target.actor) {
                            target.actor.toggleStatusEffect("lockon", {active: true});
                        }
                    }
                } else {
                    ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget") || "You must target at least one token first.");
                }

                name = game.i18n.localize("STYLISH_HUD.Basic.LockOn.Name");
                icon = "spotter.svg";
                tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">Sensors</span></div>`;
                desc = game.i18n.localize("STYLISH_HUD.Basic.LockOn.Desc");
            } else if (action === "bolster") {
                const targets = game.user.targets;
                if (targets.size > 0) {
                    for (let target of targets) {
                        if (target.actor) {
                            target.actor.toggleStatusEffect("bolster", {active: true});
                        }
                    }
                } else {
                    ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget") || "You must target at least one token first.");
                }

                name = game.i18n.localize("STYLISH_HUD.Basic.Bolster.Name");
                icon = "leader.svg";
                tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">Sensors</span></div>`;
                desc = game.i18n.localize("STYLISH_HUD.Basic.Bolster.Desc");
            } else if (action === "brace") {
                if (actor) {
                    actor.toggleStatusEffect("brace", {active: true});
                }
                name = game.i18n.localize("STYLISH_HUD.Basic.Brace.Name");
                icon = "hull.svg";
                desc = game.i18n.localize("STYLISH_HUD.Basic.Brace.Desc");
            } else if (action === "overwatch") {
                name = game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Name");
                icon = "vanguard.svg";
                desc = game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Desc");
            }

            const content = `
                <div class="card clipped-bot" style="margin:0px">
                    <div class="lancer-header lancer-system" style="background:#1e1e1e !important; border-bottom: 2px solid #58b434;">
                        <img src="systems/lancer/assets/icons/skills/${icon}" style="width:24px; height:24px; margin-right:8px; vertical-align:middle; filter:invert(1) sepia(1) saturate(5) hue-rotate(50deg);">
                        <span style="vertical-align:middle;">// ${name.toUpperCase()} //</span>
                    </div>
                    <div class="effect-text">
                        ${tagsHtml}
                        ${desc}
                    </div>
                </div>
            `;
            return ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                content: content
            });
        }
        if (itemId.startsWith("status:")) {
            const statusId = itemId.replace("status:", "");
            return actor.toggleStatusEffect(statusId);
        }
        if (itemId.startsWith("target-status:")) {
            const statusId = itemId.replace("target-status:", "");
            const targets = game.user.targets;
            if (targets.size === 0) {
                ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget"));
                return;
            }
            for (let target of targets) {
                const targetActor = target.actor;
                if (targetActor) {
                    await targetActor.toggleStatusEffect(statusId);
                }
            }
            return;
        }
        if (itemId.startsWith("change-profile:")) {
            const parts = itemId.split(":");
            const weaponId = parts[1];
            const idx = parseInt(parts[2]);
            const item = actor.items.get(weaponId);
            if (item && !isNaN(idx)) {
                await item.update({ "system.selected_profile_index": idx });
                if (lancerHUDInstance) lancerHUDInstance.render(false);
            }
            return;
        }
        if (itemId.startsWith("system-action:")) {
            const parts = itemId.split(":");
            const id = parts[1];
            const idx = parts[2];
            const item = actor.items.get(id);
            if (item && typeof item.beginActivationFlow === "function") {
                const act = item.system?.actions?.[idx];
                if (act) {
                    const actType = (act.activation || "").toLowerCase();
                    if (actType.includes("full")) await deductAction(true);
                    else if (actType.includes("quick") || actType.includes("reaction")) await deductAction(false);
                    
                    if (actType.includes("reaction")) {
                        await setActionState("reaction");
                    }
                }
                return item.beginActivationFlow(`system.actions.${idx}`);
            }
        }
        if (itemId.startsWith("stats-roll:")) {
            const stat = itemId.replace("stats-roll:", "");
            const path = `system.${stat}`;
            return actor.beginStatFlow(path);
        }

        return super.useItem(actor, itemId, event);
    }
}

/**
 * Standalone HUD Application for Lancer VTT
 */
class LancerActionHUD extends Application {
    constructor(adapter) {
        super();
        this.adapter = adapter;
        this.activeToken = null;
        this.activeTab = "strike";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "lancer-action-hud",
            template: "modules/stylish-bridge-lancer/templates/hud.html",
            popOut: false,
            minimizable: false,
            resizable: false
        });
    }

    _injectHTML(html) {
        console.log("Lancer Standalone HUD | _injectHTML called with", html);
        $("#board").after(html);
        this._element = html;
    }

    async getData() {
        console.log("Lancer Standalone HUD | getData called, activeToken is:", this.activeToken);
        const token = this.activeToken;
        if (!token || !token.actor) return { active: false };

        const actor = token.actor;

        const hp = actor.system.hp || { value: 0, max: 0 };
        const heat = actor.system.heat || { value: 0, max: 0 };
        const structure = actor.system.structure || { value: 0, max: 0 };
        const stress = actor.system.stress || { value: 0, max: 0 };
        const overshield = actor.system.overshield || { value: 0 };

        const hpPct = Math.clamp((hp.value / (hp.max || 1)) * 100, 0, 100);
        const heatPct = Math.clamp((heat.value / (heat.max || 1)) * 100, 0, 100);

        const layout = this.adapter.getDefaultLayout();

        if (!layout.some(tab => tab.systemId === this.activeTab)) {
            this.activeTab = layout[0]?.systemId || "strike";
        }

        const tabs = layout.map(tab => ({
            id: tab.systemId,
            label: tab.label,
            active: tab.systemId === this.activeTab
        }));

        const activeTabObj = layout.find(tab => tab.systemId === this.activeTab);
        const subMenuData = await this.adapter._getSystemSubMenuData(actor, this.activeTab, activeTabObj);

        let itemsList = [];
        if (subMenuData.items) {
            if (Array.isArray(subMenuData.items)) {
                itemsList = subMenuData.items;
            } else if (typeof subMenuData.items === "object") {
                const categories = subMenuData.items;
                for (const [catKey, catItems] of Object.entries(categories)) {
                    if (Array.isArray(catItems)) {
                        itemsList = itemsList.concat(catItems);
                    }
                }
            }
        }

        const tabLabelsMap = {
            "strike": "STYLISH_HUD.Tabs.Weapons",
            "tech": "STYLISH_HUD.Tabs.Tech",
            "system": "STYLISH_HUD.Tabs.Systems",
            "talent": "STYLISH_HUD.Tabs.Talents",
            "utility": "STYLISH_HUD.Tabs.Utilities",
            "status": "STYLISH_HUD.Tabs.Statuses",
            "stats": "STYLISH_HUD.Tabs.Stats"
        };
        const activeTabKey = tabLabelsMap[this.activeTab];
        const activeTabLabel = activeTabKey ? game.i18n.localize(activeTabKey) : "Actions";

        const armor = actor.system.armor ?? 0;
        const evasion = actor.system.evasion ?? 0;
        const edef = actor.system.edef ?? 0;
        const burn = actor.system.burn?.value ?? actor.system.burn ?? 0;
        const burnPath = (actor.system.burn?.value !== undefined) ? "system.burn.value" : "system.burn";
        const overshieldPath = (actor.system.overshield?.value !== undefined) ? "system.overshield.value" : "system.overshield";

        const saveTarget = actor.system.save ?? actor.system.save_target ?? 10;
        const spMax = actor.system.sp ?? actor.system.sp_max ?? actor.system.sp?.max ?? 0;
        const techAttackStr = (actor.system.tech_attack >= 0 ? "+" : "") + (actor.system.tech_attack ?? 0);

        // Find pilot actor
        let pilotActor = null;
        const pilotActorObj = actor.system.pilot?.value;
        if (pilotActorObj) {
            pilotActor = pilotActorObj;
        } else {
            const pilotId = actor.system.pilot?.id || actor.system.pilot_id || actor.system.pilot;
            if (pilotId && typeof pilotId === "string") {
                pilotActor = game.actors.get(pilotId);
            } else {
                const ownedPilots = game.actors.filter(a => a.type === "pilot" && (a.isOwner || game.user.isGM));
                if (ownedPilots.length > 0) {
                    const matched = ownedPilots.find(p =>
                        actor.name.toLowerCase().includes(p.name.toLowerCase()) ||
                        p.name.toLowerCase().includes(actor.name.toLowerCase())
                    );
                    pilotActor = matched || ownedPilots[0];
                }
            }
        }

        const mechGridStats = {
            size: actor.system.size ?? 1,
            hpMax: hp.max,
            armor: armor,
            repairsMax: actor.system.repairs?.max ?? 0,
            speed: actor.system.speed ?? 0,
            evasion: evasion,
            techAttack: techAttackStr,
            edef: edef,
            sensors: actor.system.sensor_range ?? 0,
            save: saveTarget,
            heatMax: heat.max,
            sp: spMax,
            // HASE Stats
            hull: actor.system.hull ?? 0,
            agi: actor.system.agi ?? 0,
            sys: actor.system.sys ?? 0,
            eng: actor.system.eng ?? 0
        };

        const isStatsTab = this.activeTab === "stats";

        const actionTracker = actor.getFlag('stylish-bridge-lancer', 'actionTracker') || {
            move: false,
            quick1: false,
            quick2: false,
            full: false,
            protocol: false,
            reaction: false,
            free: false,
            overcharge: false,
            core: false
        };

        return {
            active: true,
            actorName: actor.name,
            actorImg: actor.img || "systems/lancer/assets/icons/generic_item.svg",
            armor: armor,
            evasion: evasion,
            edef: edef,
            speed: actor.system.speed ?? 0,
            burn: burn,
            burnPath: burnPath,
            overshieldPath: overshieldPath,
            isStatsTab: isStatsTab,
            actionTracker: actionTracker,
            mechGridStats: mechGridStats,
            hp: {
                value: hp.value,
                max: hp.max,
                pct: hpPct
            },
            heat: {
                value: heat.value,
                max: heat.max,
                pct: heatPct
            },
            structure: {
                value: structure.value,
                max: structure.max
            },
            stress: {
                value: stress.value,
                max: stress.max
            },
            overshield: {
                value: overshield.value
            },
            tabs: tabs,
            activeTab: this.activeTab,
            activeTabLabel: activeTabLabel,
            items: itemsList
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Apply width percentages dynamically to bypass HTML/CSS linter errors
        const hpFill = html.find(".hp-fill");
        const hpPct = hpFill.data("pct");
        if (hpPct !== undefined) hpFill.css("width", `${hpPct}%`);

        const heatFill = html.find(".heat-fill");
        const heatPct = heatFill.data("pct");
        if (heatPct !== undefined) heatFill.css("width", `${heatPct}%`);

        // Tab selection
        html.find(".hud-tab-btn").click(event => {
            event.preventDefault();
            this.activeTab = event.currentTarget.dataset.tabId;
            this.render(false);
        });

        // Search filtering
        html.find(".hud-search-input").on("input", event => {
            const query = event.currentTarget.value.trim().toLowerCase();
            html.find(".hud-item-row").each((i, el) => {
                const row = $(el);
                const name = row.find(".hud-item-name").text().toLowerCase();
                const desc = row.find(".hud-item-description").text().toLowerCase();
                if (name.includes(query) || desc.includes(query)) {
                    row.show();
                } else {
                    row.hide();
                }
            });
        });

        // Click to roll HASE from the grid
        html.find(".la-stat-roll-btn").click(event => {
            event.preventDefault();
            const stat = event.currentTarget.dataset.stat;
            const actor = this.activeToken.actor;
            if (actor && stat) {
                actor.beginStatFlow(`system.${stat}`);
            }
        });

        // Toggle full description view on click
        html.find(".hud-item-description, .hud-item-name").click(event => {
            event.preventDefault();
            event.stopPropagation();
            const row = $(event.currentTarget).closest(".hud-item-row");
            row.find(".hud-item-description").toggleClass("expanded");
        });

        // Change HP or Heat directly via input field
        html.find(".hud-vital-input").change(async (event) => {
            const input = $(event.currentTarget);
            const path = input.data("path");
            const val = parseInt(input.val());
            const actor = this.activeToken.actor;
            if (actor && !isNaN(val)) {
                await actor.update({ [path]: val });
            }
        });

        // Click to change HP or Heat
        html.find(".hud-attribute-clickable").click(async (event) => {
            event.preventDefault();
            const path = event.currentTarget.dataset.path;
            const label = event.currentTarget.dataset.label;

            const actor = this.activeToken.actor;
            const currentVal = foundry.utils.getProperty(actor, `${path}.value`) ?? foundry.utils.getProperty(actor, path) ?? 0;

            new Dialog({
                title: game.i18n.format("STYLISH_HUD.Dialog.AdjustTitle", { label }),
                content: `
                    <div style="font-family: 'Orbitron', sans-serif; padding: 5px;">
                        <p>${game.i18n.format("STYLISH_HUD.Dialog.CurrentVal", { value: currentVal })}</p>
                        <input type="text" id="hud-attr-input" placeholder="${game.i18n.localize("STYLISH_HUD.Dialog.Placeholder")}" autofocus style="width:100%; text-align:center; background:#0a100c; color:#00ff66; border:1px solid #00ff66; font-family:'Orbitron'; font-size:1.1em; padding:5px; box-sizing:border-box;"/>
                    </div>
                `,
                buttons: {
                    update: {
                        label: game.i18n.localize("STYLISH_HUD.Dialog.Confirm"),
                        callback: async (html) => {
                            const input = html.find("#hud-attr-input").val();
                            if (input) {
                                await this.adapter.updateAttribute(actor, path, input);
                            }
                        }
                    }
                },
                default: "update"
            }).render(true);
        });
    }
}

let lancerHUDInstance = null;

// Control Token Selection Hook
Hooks.on("controlToken", (token, controlled) => {
    console.log("Lancer Standalone HUD | controlToken Hook fired for:", token?.name, "controlled:", controlled);
    if (!lancerHUDInstance) {
        console.log("Lancer Standalone HUD | lancerHUDInstance is null, skipping controlToken");
        return;
    }

    // Defer check to let selection state settle (resolves race conditions between select/deselect hooks)
    setTimeout(() => {
        const controlledTokens = canvas.tokens?.controlled || [];
        const ownedToken = controlledTokens.find(t => t.actor && (t.actor.isOwner || game.user.isGM));

        if (ownedToken) {
            if (lancerHUDInstance.activeToken?.id !== ownedToken.id) {
                lancerHUDInstance.activeToken = ownedToken;
                lancerHUDInstance.render(true);
            }
        } else {
            if (lancerHUDInstance.activeToken) {
                lancerHUDInstance.activeToken = null;
                lancerHUDInstance.close();
            }
        }
    }, 50);
});

// Update Actor Stats Hook
Hooks.on("updateActor", (actor, changes) => {
    if (lancerHUDInstance && lancerHUDInstance.activeToken?.actor.id === actor.id) {
        lancerHUDInstance.render(false);
    }
});

// Create/Delete Item Hooks
Hooks.on("createItem", (item) => {
    if (lancerHUDInstance && lancerHUDInstance.activeToken?.actor.id === item.parent?.id) {
        lancerHUDInstance.render(false);
    }
});

// Create/Delete Item Hooks
Hooks.on("deleteItem", (item) => {
    if (lancerHUDInstance && lancerHUDInstance.activeToken?.actor.id === item.parent?.id) {
        lancerHUDInstance.render(false);
    }
});

// Canvas Ready Hook
Hooks.on("canvasReady", () => {
    if (!lancerHUDInstance) return;
    const controlledTokens = canvas.tokens?.controlled || [];
    if (controlledTokens.length > 0) {
        const firstToken = controlledTokens[0];
        if (firstToken.actor && (firstToken.actor.isOwner || game.user.isGM)) {
            lancerHUDInstance.activeToken = firstToken;
            lancerHUDInstance.render(true);
            return;
        }
    }
    lancerHUDInstance.activeToken = null;
    lancerHUDInstance.close();
});

// Automatically update tracker on attacks or actions
Hooks.on("createChatMessage", async (msg, options, userId) => {
    // Only process for the user who created the message
    if (userId !== game.user.id) return;
    
    if (!lancerHUDInstance || !lancerHUDInstance.activeToken) return;
    const actor = lancerHUDInstance.activeToken.actor;
    
    // Verify the message belongs to the current actor
    if (!actor || msg.speaker?.actor !== actor.id) return;

    let isActionSpent = false;
    let isFullAction = false;
    let isQuickAction = false;

    const content = (msg.content || "").toLowerCase();
    const itemData = msg.flags?.lancer?.item;
    const itemType = itemData ? itemData.type : null;

    if (content.includes("barrage") || content.includes("full action")) {
        isFullAction = true;
        isActionSpent = true;
    } else if (content.includes("skirmish") || content.includes("quick action") || content.includes("quick tech")) {
        isQuickAction = true;
        isActionSpent = true;
    } else if (itemType === "weapon" || content.includes("attack roll")) {
        isQuickAction = true;
        isActionSpent = true;
    }

    if (isActionSpent) {
        const current = actor.getFlag('stylish-bridge-lancer', 'actionTracker') || {};
        const updates = { ...current };

        if (isFullAction) {
            updates.full = true;
            updates.quick1 = true;
            updates.quick2 = true;
        } else if (isQuickAction) {
            if (!updates.quick1) updates.quick1 = true;
            else if (!updates.quick2) updates.quick2 = true;
            
            updates.full = true;
        }

        await actor.setFlag('stylish-bridge-lancer', 'actionTracker', updates);
    }
});

// Automatically update tracker on movement
Hooks.on("updateToken", async (tokenDoc, changes, context, userId) => {
    // Only process for the user who moved the token
    if (userId !== game.user.id) return;
    
    // Check if position changed
    if (changes.x === undefined && changes.y === undefined) return;
    
    if (!lancerHUDInstance || !lancerHUDInstance.activeToken) return;
    
    // Check if the moved token is the active token
    if (tokenDoc.id !== lancerHUDInstance.activeToken.id) return;
    
    const actor = lancerHUDInstance.activeToken.actor;
    if (!actor) return;
    
    const current = actor.getFlag('stylish-bridge-lancer', 'actionTracker') || {};
    if (!current.move) {
        const updates = { ...current, move: true };
        await actor.setFlag('stylish-bridge-lancer', 'actionTracker', updates);
    }
});

// Ready Hooks Initialization
Hooks.once("ready", () => {
    console.log("Lancer Standalone HUD | ready Hook fired");
    const adapter = new LancerSystemAdapter();
    lancerHUDInstance = new LancerActionHUD(adapter);

    window.StylishAction = {
        useItem: async (itemId, event) => {
            if (lancerHUDInstance && lancerHUDInstance.activeToken) {
                await lancerHUDInstance.adapter.useItem(lancerHUDInstance.activeToken.actor, itemId, event);
            }
        },
        closeHUD: () => {
            if (lancerHUDInstance) {
                lancerHUDInstance.activeToken = null;
                lancerHUDInstance.close();
            }
        }
    };

    const controlledTokens = canvas.tokens?.controlled || [];
    if (controlledTokens.length > 0) {
        const firstToken = controlledTokens[0];
        if (firstToken.actor && (firstToken.actor.isOwner || game.user.isGM)) {
            lancerHUDInstance.activeToken = firstToken;
            lancerHUDInstance.render(true);
        }
    }
    console.log("Lancer Standalone HUD | Initialized successfully.");
});
