/* scripts/main.js */

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
                return { ...this._getStrikeData(actor), title: menuData.label };
            case "tech":
                return { ...this._getTechData(actor), title: menuData.label };
            case "system":
                return { ...this._getSystemData(actor), title: menuData.label };
            case "core":
                return { ...this._getCoreData(actor), title: menuData.label };
            case "talent":
                return { ...this._getTalentData(actor), title: menuData.label };
            case "implementos":
                return { ...this._getImplementosData(actor), title: menuData.label };
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
                            if (label.includes("{VAL}")) {
                                label = label.replace(/\{VAL\}/g, val);
                            } else {
                                label = `${label} ${val}`;
                            }
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
            let dmgArray = Array.isArray(rawDmg) ? rawDmg : [rawDmg];

            // NPC weapons often store damage as an array of arrays (one per Tier)
            if (dmgArray.length > 0 && Array.isArray(dmgArray[0])) {
                const tier = actor.system?.tier || 1;
                const tierIdx = Math.max(0, Math.min(tier - 1, dmgArray.length - 1));
                dmgArray = dmgArray[tierIdx] || [];
            }

            const dmgObj = dmgArray[0];
            let dmgVal = "";
            let dmgType = "";
            if (dmgObj) {
                if (typeof dmgObj === "object") {
                    const rawVal = dmgObj.val !== undefined ? dmgObj.val : (dmgObj.value !== undefined ? dmgObj.value : dmgObj.amount);
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
                            const rawVal = d.val !== undefined ? d.val : (d.value !== undefined ? d.value : d.amount);
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
                description: fullDescription,
                canDestroy: true,
                isDestroyed: isDestroyed
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
                <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('tech:${s.id}', event)">
                    ${game.i18n.localize('STYLISH_HUD.Stats.TechAttack')}
                </button>
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
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('tech:invade')">
                    ${game.i18n.localize('STYLISH_HUD.Stats.TechAttack')}
                </button>`,
                tags: `<div class="lancer-tags"><span class="lancer-tag damage-tag">2 Heat</span><span class="lancer-tag range-tag">${game.i18n.localize('LANCER_HUD.Range.Sensors')}</span></div>`,
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
                tags: `<div class="lancer-tags"><span class="lancer-tag range-tag">${game.i18n.localize('STYLISH_HUD.Range.Sensors')}</span></div>`,
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
                tags: `<div class="lancer-tags"><span class="lancer-tag range-tag">${game.i18n.localize('STYLISH_HUD.Range.Sensors')}</span></div>`,
                description: game.i18n.localize("STYLISH_HUD.Basic.Bolster.Desc"),
                isAction: true
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
            const hasActions = s.system?.actions && Array.isArray(s.system.actions) && s.system.actions.length > 0;

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
            } else if (hasActions) {
                let actionBtnsHtml = s.system.actions.map((act, index) => {
                    const actType = act.activation || "Ação";
                    return `<button type="button" class="pf2e-map-btn" style="background:rgba(88, 180, 52, 0.05); border-color:rgba(88, 180, 52, 0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('system-action:${s.id}:${index}', event)" data-tooltip="${act.detail || act.name || 'Ativar ação do sistema'}">${actType.toUpperCase()}</button>`;
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

            const effectText = s.system?.effect || "";
            const descriptionText = s.system?.description || "";
            const combinedDescription = [effectText, descriptionText].filter(Boolean).join("<br><br>");

            categories.all.push({
                id: s.id,
                name: displayName,
                img: s.img || "systems/lancer/assets/icons/generic_item.svg",
                cost: actionButtons,
                tags: this._getItemTags(s),
                description: combinedDescription,
                canDestroy: true,
                isDestroyed: isDestroyed
            });

            if (hasActions) {
                s.system.actions.forEach((act, index) => {
                    const actType = (act.activation || "").toUpperCase();
                    const actName = act.name || `Action ${index + 1}`;
                    const actDetail = act.detail || "";
                    if (!actDetail && !actName) return;

                    const activationTags = actType ? [{
                        label: actType,
                        class: "tag-system",
                        tooltip: `${actType} Action`
                    }] : [];

                    categories.all.push({
                        id: `system-action-${s.id}-${index}`,
                        name: `<span style="opacity:0.85; font-size:0.92em; padding-left:12px; border-left:2px solid rgba(88,180,52,0.35);">↳ ${actName}</span>`,
                        img: s.img || "systems/lancer/assets/icons/generic_item.svg",
                        cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('system-action:${s.id}:${index}', event)">${actType || "USE"}</button>`,
                        tags: activationTags,
                        description: actDetail,
                        isAction: true
                    });
                });
            }
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
        const rankGroups = [];
        talents.forEach(t => {
            const currRank = t.system.curr_rank || 1;
            const ranks = [];

            for (let i = 0; i < currRank; i++) {
                const rankObj = t.system.ranks?.[i];
                const rankNum = i + 1;
                const traitDescription = rankObj?.description || rankObj?.desc || rankObj?.text || t.system?.description || "";
                const rankName = rankObj?.name || `Rank ${rankNum}`;

                const actions = rankObj?.actions;
                let actionsHtml = "";
                if (actions && Array.isArray(actions) && actions.length > 0) {
                    const actionBlocks = actions.map((act, actIdx) => {
                        const actType = act.activation || "";

                        let chipIcon = "";
                        if (actType.toLowerCase().includes("tech") || actType.toLowerCase().includes("quick")) {
                            chipIcon = '<i class="cci cci-tech-quick i--3"></i>';
                        } else if (actType.toLowerCase().includes("full")) {
                            chipIcon = '<i class="cci cci-tech-quick i--3"></i>';
                        }

                        const chipLabel = actType ? `USE ${actType.toUpperCase()}` : "USE";

                        return `
                            <div class="action-wrapper">
                                <div class="title-wrapper flexrow">
                                    <i class="cci cci-tech-quick i--4"></i>
                                    <span class="action-title collapse-trigger">${act.name || `Action ${actIdx + 1}`}</span>
                                </div>
                                <div class="action-detail">
                                    <hr class="hsep">
                                    <div class="action-flow-container">
                                        <a class="activation-flow lancer-button activation-chip activation-invade lancer-tech" data-talent-id="${t.id}" data-rank-index="${i}" data-action-index="${actIdx}" draggable="true">
                                            ${chipIcon}${chipLabel}
                                        </a><span class="vsep"></span>
                                    </div>
                                    ${act.detail || ""}
                                </div>
                            </div>`;
                    });
                    actionsHtml = `<div class="effect-text" style="display:grid; gap:8px">${actionBlocks.join("\n")}</div>`;
                }

                let fullDescription = traitDescription;
                if (actionsHtml) {
                    fullDescription += "\n" + actionsHtml;
                }

                categories.all.push({
                    id: `${t.id}-rank${rankNum}`,
                    name: `${t.name} (Rank ${rankNum}) - ${rankName}`,
                    img: t.img || "systems/lancer/assets/icons/generic_item.svg",
                    cost: "",
                    description: fullDescription
                });

                ranks.push({
                    id: `${t.id}-rank${rankNum}`,
                    rankNum: rankNum,
                    name: rankName,
                    description: fullDescription
                });
            }

            rankGroups.push({
                id: t.id,
                name: t.name,
                img: t.img || "systems/lancer/assets/icons/generic_item.svg",
                ranks: ranks
            });
        });

        return {
            hasTabs: true,
            hasSubTabs: false,
            items: categories,
            rankGroups: rankGroups,
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
            const ocNamePlain = `${ocNameStr} [${displayDie} Heat]`;

            items.push({
                id: "util-overcharge",
                actionId: "util:overcharge",
                name: ocNameWithDie,
                tooltip: ocNamePlain,
                isIcon: false,
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:overcharge')">ACTIVATE</button>`,
                description: game.i18n.localize("STYLISH_HUD.Utilities.Overcharge.Desc")
            });

            const stabName = game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Name");
            items.push({
                id: "util-stabilize",
                actionId: "util:stabilize",
                name: stabName,
                tooltip: stabName,
                isIcon: false,
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:stabilize')">ACTIVATE</button>`,
                description: game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Desc")
            });

            const repairName = game.i18n.localize("STYLISH_HUD.Utilities.FullRepair.Name");
            items.push({
                id: "util-full-repair",
                actionId: "util:full-repair",
                name: repairName,
                tooltip: repairName,
                isIcon: false,
                cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:full-repair')">ACTIVATE</button>`,
                description: game.i18n.localize("STYLISH_HUD.Utilities.FullRepair.Desc")
            });

            // Add basic Reactions
            const braceName = game.i18n.localize("STYLISH_HUD.Basic.Brace.Name");
            const overwatchName = game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Name");
            items.push(
                {
                    id: "basic-brace",
                    actionId: "basic:brace",
                    name: braceName,
                    tooltip: braceName,
                    cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215, 60, 50, 0.05); border-color:rgba(215, 60, 50, 0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:brace')">REACTION</button>`,
                    description: game.i18n.localize("STYLISH_HUD.Basic.Brace.ShortDesc")
                },
                {
                    id: "basic-overwatch",
                    actionId: "basic:overwatch",
                    name: overwatchName,
                    tooltip: overwatchName,
                    cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215, 60, 50, 0.05); border-color:rgba(215, 60, 50, 0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:overwatch')">REACTION</button>`,
                    description: game.i18n.localize("STYLISH_HUD.Basic.Overwatch.ShortDesc")
                }
            );
        }

        return { items };
    }

    _getImplementosData(actor) {
        const items = [];
        if (!actor) return { items };

        const deployableItems = actor.items.filter(i =>
            i.system?.deployables && Array.isArray(i.system.deployables) && i.system.deployables.length > 0
        );
        
        deployableItems.forEach(s => {
            const isDrone = s.system?.type?.toLowerCase() === "drone" ||
                s.system?.tags?.some(t => (typeof t === "string" ? t : t.id)?.toLowerCase() === "drone");
            const hasDeployables = s.system?.deployables && s.system.deployables.length > 0;
            const hasActions = s.system?.actions && Array.isArray(s.system.actions) && s.system.actions.length > 0;

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
            } else if (hasDeployables) {
                actionButtons = `
                    <div style="display:inline-flex; gap:4px; align-items:center;">
                        <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('activate:${s.id}', event)" data-tooltip="Enviar um card representando este item para o chat"><i class="fas fa-comment-alt"></i></button>
                        <button type="button" class="pf2e-dmg-btn" style="background:rgba(88, 180, 52, 0.05) !important; border-color:rgba(88, 180, 52, 0.25) !important; color:#58b434 !important;" onclick="event.stopPropagation(); StylishAction.useItem('deploy:${s.id}', event)" data-tooltip="Posicionar/Deploy no mapa"><i class="fas fa-box"></i></button>
                    </div>
                `;
            } else if (hasActions) {
                let actionBtnsHtml = s.system.actions.map((act, index) => {
                    const actType = act.activation || "Ação";
                    return `<button type="button" class="pf2e-map-btn" style="background:rgba(88, 180, 52, 0.05); border-color:rgba(88, 180, 52, 0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('system-action:${s.id}:${index}', event)" data-tooltip="${act.detail || act.name || 'Ativar ação do sistema'}">${actType.toUpperCase()}</button>`;
                }).join("");
                actionButtons = `
                    <div style="display:inline-flex; gap:4px; align-items:center;">
                        <button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('activate:${s.id}', event)" data-tooltip="Enviar um card representando este item para o chat"><i class="fas fa-comment-alt"></i></button>
                        ${actionBtnsHtml}
                    </div>
                `;
            }

            const effectText = s.system?.effect || "";
            const descriptionText = s.system?.description || "";
            const combinedDescription = [effectText, descriptionText].filter(Boolean).join("<br><br>");

            items.push({
                id: s.id,
                name: s.name,
                img: s.img || "systems/lancer/assets/icons/generic_item.svg",
                cost: actionButtons,
                tags: this._getItemTags(s),
                description: combinedDescription || (s.system?.deployables?.join(", ") || "")
            });
        });

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
            const costHtml = `<div style="display:inline-flex; gap:4px; align-items:center;"> ${toggleBtn}${targetBtn}</div>`;

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

        if (itemId.startsWith("tracker:")) {
            const actionType = itemId.split(":")[1];
            if (actionType === "reset") {
                await actor.setFlag('lancer-action-hud', 'actionTracker', {
                    move: false, quick1: false, quick2: false, full: false, protocol: false, reaction: false, free: false, overcharge: false
                });
            } else {
                const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
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

                await actor.setFlag('lancer-action-hud', 'actionTracker', current);
            }
            return;
        }
        if (!actor) return;

        const deductAction = async (isFull = false) => {
            const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
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
            await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
        };

        const setActionState = async (stateKey) => {
            const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
            if (!current[stateKey]) {
                const updates = { ...current, [stateKey]: true };
                await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
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
            
            // Tenta disparar o fluxo nativo do Lancer
            if (typeof actor.beginCoreActiveFlow === "function") {
                return actor.beginCoreActiveFlow();
            }
            
            const CoreActiveFlow = game.lancer?.CoreActiveFlow || CONFIG?.LANCER?.flows?.CoreActiveFlow;
            if (CoreActiveFlow) {
                const flow = new CoreActiveFlow(actor);
                return flow.begin();
            }

            if (item) {
                if (typeof item.beginCoreActiveFlow === "function") return item.beginCoreActiveFlow();
            }
        }
       if (itemId.startsWith("activate:")) {
            const id = itemId.replace("activate:", "");
            const item = actor.items.get(id);
            console.log("ativar item", item);

            if (item) {
                const tagsList = [];

                // 1. Processa Danos
                if (item.system?.damage) {
                    const damages = Array.isArray(item.system.damage) ? item.system.damage : [item.system.damage];
                    damages.forEach(d => {
                        if (d && (d.val !== undefined || d.value !== undefined)) {
                            const val = d.val ?? d.value;
                            tagsList.push(`<span class="lancer-tag damage-tag">${val} ${d.type || ''}</span>`);
                        }
                    });
                }

                // 2. Processa Alcances
                if (item.system?.range) {
                    const ranges = Array.isArray(item.system.range) ? item.system.range : [item.system.range];
                    ranges.forEach(r => {
                        if (r && (r.val !== undefined || r.value !== undefined || r.type)) {
                            const val = r.val ?? r.value ?? '';
                            tagsList.push(`<span class="lancer-tag range-tag">${r.type || 'Range'}: ${val}</span>`);
                        }
                    });
                }

                // 3. Processa Tags do Sistema
                if (item.system?.tags) {
                    const wTags = Array.isArray(item.system.tags) ? item.system.tags : [item.system.tags];
                    wTags.forEach(t => {
                        if (!t) return;
                        let rawId = typeof t === "string" ? t : (t.id || t.lid || t.name || "");
                        let val = typeof t === "object" ? (t.val !== undefined ? t.val : t.value) : null;
                        
                        if (rawId) {
                            const cleanId = rawId.replace(/^tg_/, "");
                            const capId = typeof cleanId.capitalize === "function" ? cleanId.capitalize() : (cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
                            const nameKey = `LANCER.Tag${capId}`;
                            let lbl = game.i18n.has(nameKey) ? game.i18n.localize(nameKey) : capId;
                            if (val !== undefined && val !== null && val !== "") lbl = `${lbl} ${val}`;
                            tagsList.push(`<span class="lancer-tag">${lbl}</span>`);
                        }
                    });
                }

                const tagsHtml = tagsList.length ? `<div class="lancer-tags" style="margin-top:4px; margin-bottom:8px;">${tagsList.join('')}</div>` : "";

                // 4. Texto Principal (Effect com fallback para Description)
                const mainText = item.system?.effect || item.system?.description || "";

                // 5. Mapeia Ações e Injeta Botões Interativos no Card
                let actionsHtml = "";
                if (item.system?.actions && Array.isArray(item.system.actions) && item.system.actions.length > 0) {
                    const actionBlocks = item.system.actions.map((act, index) => {
                        const actType = act.activation ? act.activation.toUpperCase() : "USAR";
                        const actName = act.name ? `<strong>${act.name}</strong>` : `Ação ${index + 1}`;
                        
                        const rawTooltip = act.detail || act.name || 'Executar Ação';
                        const safeTooltip = rawTooltip.replace(/"/g, '&quot;');

                        return `
                            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <div>${actName}</div>
                                    <button type="button" class="pf2e-map-btn lancer-chat-action-btn" 
                                            style="background: rgba(88,180,52,0.1); border-color: rgba(88,180,52,0.3); color: #58b434; font-size: 0.8em; padding: 2px 8px; width: auto; cursor: pointer;" 
                                            data-action="system-action:${item.id}:${index}"
                                            data-actor-id="${actor.id}"
                                            data-tooltip="${safeTooltip}">
                                        <i class="fas fa-play" style="font-size:0.8em; margin-right:4px;"></i>${actType}
                                    </button>
                                </div>
                                <div style="font-size: 0.9em; opacity: 0.85; line-height: 1.3;">${act.detail || ""}</div>
                            </div>
                        `;
                    }).join("");

                    actionsHtml = `<div class="lancer-actions-block" style="margin-top: 8px;">${actionBlocks}</div>`;
                }

                // 6. Template Final do Card no Chat
                const content = `
                    <div class="card clipped-bot" style="margin:0px">
                      <div class="lancer-header lancer-system">
                        // SYSTEM :: ${item.name} //
                      </div>
                      <div class="effect-text">
                        ${tagsHtml}
                        ${mainText ? `<div style="margin-bottom:6px;">${mainText}</div>` : ""}
                        ${actionsHtml}
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
        if (itemId.startsWith("deploy:")) {
            const id = itemId.replace("deploy:", "");
            const item = actor.items.get(id);
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
                                            ${item.system.effect}
                                            ${item.system.actions}
                                            ${item.system.tags}
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
                        ${item.system.effect}
                        ${item.system.actions}
                        ${item.system.tags}
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
                            target.actor.toggleStatusEffect("lockon", { active: true });
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
                            target.actor.toggleStatusEffect("bolster", { active: true });
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
                    actor.toggleStatusEffect("brace", { active: true });
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
        if (itemId.startsWith("test:")) {
            const action = itemId.replace("test:", "");
            if (action === "stress-damage") {
                if (lancerHUDInstance) await lancerHUDInstance._showStructStressDialog(actor, "stress");
                return;
            }
            if (action === "structure-damage") {
                if (lancerHUDInstance) await lancerHUDInstance._showStructStressDialog(actor, "structure");
                return;
            }
        }
        if (itemId.startsWith("status:")) {
            const statusId = itemId.replace("status:", "");
            
            // Alterna o status no ator e aguarda a conclusão
            await actor.toggleStatusEffect(statusId);

            // Re-renderiza o HUD mantendo a aba e a posição atual
            const { instance } = getActiveHUD();
            if (instance) {
                instance.render(false);
            }
            return;
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
        if (itemId.startsWith("talent-rank-action:")) {
            const parts = itemId.split(":");
            const talentId = parts[1];
            const rankIdx = parseInt(parts[2]);
            const actionIdx = parseInt(parts[3]);

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
                    }
                }
            }

            const item = targetActor.items.get(talentId);
            if (item && !isNaN(rankIdx) && !isNaN(actionIdx) && typeof item.beginActivationFlow === "function") {
                return item.beginActivationFlow(`system.ranks.${rankIdx}.actions.${actionIdx}`);
            }
            return;
        }
        if (itemId.startsWith("destroy-toggle:")) {
            const id = itemId.replace("destroy-toggle:", "");
            const item = actor.items.get(id);
            if (item) {
                const current = item.system?.destroyed || false;
                await item.update({ "system.destroyed": !current });
                if (lancerHUDInstance) lancerHUDInstance.render(false);
            }
            return;
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
        this._hudVisible = true;
    }

    /**
     * Opens a dialog for Stress Damage test
     */
    async rollStressDamage() {
        const actor = this.activeToken?.actor;
        if (!actor) return;

        return this._showStructStressDialog(actor, "stress");
    }

    /**
     * Opens a dialog for Structure Damage test
     */
    async rollStructureDamage() {
        const actor = this.activeToken?.actor;
        if (!actor) return;

        return new Promise((resolve) => {
            new Dialog({
                title: game.i18n.localize("STYLISH_HUD.Dialog.StructureDamage.Title") || "Structure Damage Test",
                content: `
                    <div class="lancer-dialog">
                        <p>${game.i18n.localize("STYLISH_HUD.Dialog.StructureDamage.Desc") || "Roll to resist Structure damage."}</p>
                        <div class="dialog-buttons">
                            <button type="button" data-action="roll">
                                <i class="fas fa-dice-d20"></i> ${game.i18n.localize("STYLISH_HUD.Dialog.StructureDamage.Roll") || "Roll Save"}
                            </button>
                            <button type="button" data-action="cancel">
                                ${game.i18n.localize("STYLISH_HUD.Dialog.Cancel") || "Cancel"}
                            </button>
                        </div>
                    </div>
                `,
                buttons: {},
                default: "roll",
                render: (html) => {
                    html.find("[data-action='roll']").click(async () => {
                        const roll = await actor.rollSave({ flavor: "Structure Damage" });
                        resolve(roll);
                    });
                    html.find("[data-action='cancel']").click(() => resolve(null));
                },
                close: () => resolve(null)
            }).render(true);
        });
    }

    /**
     * Shows the Structure/Stress Damage dialog using Lancer's built-in StructStressHUD
     * @param {Actor} actor - The actor taking damage
     * @param {string} type - "stress" or "structure"
     */
    async _showStructStressDialog(actor, type) {
        if (!actor) return;

        // Use Lancer's sliding HUD system to open the StructStressHUD
        const slidingHUD = game.modules.get("lancer")?.api?.slidingHUD;
        if (slidingHUD) {
            slidingHUD.open(type === "stress" ? "stress" : "struct", {
                title: game.i18n.localize(`STYLISH_HUD.Dialog.${type === "stress" ? "Stress" : "Structure"}Damage.Title`) || `${type === "stress" ? "Stress" : "Structure"} Damage Test`,
                actorUuid: actor.uuid,
                stat: type
            });
            return;
        }

        // Fallback to custom dialog if sliding HUD not available
        const template = "modules/lancer-action-hud/templates/structstress-dialog.html";
        const html = await renderTemplate(template, {
            actorName: actor.name,
            damageType: type === "stress" ? "Stress" : "Structure"
        });

        return new Promise((resolve) => {
            new Dialog({
                title: game.i18n.localize(`STYLISH_HUD.Dialog.${type === "stress" ? "Stress" : "Structure"}Damage.Title`) || `${type === "stress" ? "Stress" : "Structure"} Damage Test`,
                content: html,
                buttons: {},
                render: (dialogHtml) => {
                    dialogHtml.find("[data-button='submit']").click(async () => {
                        if (type === "stress") {
                            const roll = await actor.rollSave({ flavor: "Stress Damage" });
                            resolve(roll);
                        } else {
                            const roll = await actor.rollSave({ flavor: "Structure Damage" });
                            resolve(roll);
                        }
                    });
                    dialogHtml.find("[data-button='cancel']").click(() => resolve(null));
                },
                close: () => resolve(null)
            }).render(true);
        });
    }

    /**
     * Toggles the HUD visibility. If no token is active, does nothing.
     * Uses a CSS class instead of jQuery .hide()/.show() because the wrapper
     * has display:flex !important which overrides jQuery's inline display:none.
     */
    toggleHUD() {
        if (!this.activeToken) {
            return;
        }

        if (this._hudVisible) {
            this._hudVisible = false;
            if (this._element?.length) {
                this.minimize();
            }
        } else {
            this._hudVisible = true;
            if (!this._element || this._element.length === 0) {
                this.render(true);
            } else {
                this.maximize();
            }
        }
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "lancer-action-hud",
            title: "Lancer Action HUD",
            template: "modules/lancer-action-hud/templates/hud.html",
            popOut: true,
            minimizable: true,
            resizable: true,
            width: "fit-content",
            height: "auto"
        });
    }

    /** Salva posição ao mover a janela */
    setPosition(options = {}) {
        const pos = super.setPosition(options);
        if (pos && this._element?.length) {
            const saved = { left: pos.left, top: pos.top };
            game.settings.set("lancer-action-hud", "hudPosition", saved).catch(() => { });
        }
        return pos;
    }

    /** Restaura posição salva e fecha se não houver token ativo */
    async _render(force, options = {}) {
        if (!this.activeToken && !force) {
            return this.close();
        }
        // Injeta posição salva antes de renderizar
        try {
            const saved = game.settings.get("lancer-action-hud", "hudPosition");
            if (saved && !options.left && !options.top) {
                options.left = saved.left;
                options.top = saved.top;
            }
        } catch (e) { /* setting ainda não registrada */ }
        return super._render(force, options);
    }

    async getData() {
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

        const utilityData = await this.adapter._getUtilityData(actor);
        const utilityItems = utilityData.items || [];

        const tabLabelsMap = {
            "strike": "STYLISH_HUD.Tabs.Weapons",
            "tech": "STYLISH_HUD.Tabs.Tech",
            "system": "STYLISH_HUD.Tabs.Systems",
            "talent": "STYLISH_HUD.Tabs.Talents",
            "implementos": "STYLISH_HUD.Tabs.Implementos",
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
        const isTalentTab = this.activeTab === "talent";
        const isImplementosTab = this.activeTab === "implementos";
        const coreAvailable = (actor.system.core_energy ?? 0) > 0;
        const actionTracker = actor.getFlag('lancer-action-hud', 'actionTracker') || {
            move: false,
            quick1: false,
            quick2: false,
            full: false,
            protocol: false,
            reaction: false,
            free: false,
            overcharge: false,
            core: false,
        };
        return {
            core: coreAvailable,
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
            items: itemsList,
            isTalentTab: isTalentTab,
            isImplementosTab: isImplementosTab,
            talentGroups: subMenuData.rankGroups || [],
            utilityItems: utilityItems,
            hasUtilityItems: utilityItems.length > 0
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

        // Left panel collapse toggle
        const hud = this;
        html.find(".hud-left-collapse-btn").click(function () {
            const panel = $(this).siblings(".hud-left-panel");
            const icon = $(this).find(".fa-chevron-left");
            panel.toggleClass("collapsed");
            icon.toggleClass("fa-chevron-left fa-chevron-right");
            setTimeout(() => hud.setPosition(), 100);
        });

        // Talent accordion toggles
        // Implemento accordion toggle
        html.find(".hud-implemento-item").click(function (event) {
            event.stopPropagation();
            const body = $(this).find(".hud-implemento-body");
            const icon = $(this).find(".hud-implemento-toggle");
            body.toggleClass("collapsed");
            icon.toggleClass("collapsed");
        });

        html.find(".hud-talent-header").click(function () {
            const ranks = $(this).siblings(".hud-talent-ranks");
            const icon = $(this).find(".hud-talent-toggle");
            ranks.slideToggle(200);
            icon.toggleClass("collapsed");
        });

        html.find(".hud-talent-rank-header").click(function () {
            const desc = $(this).siblings(".hud-rank-description");
            const icon = $(this).find(".hud-rank-toggle");
            desc.slideToggle(200);
            icon.toggleClass("collapsed");
        });

        // Talent rank action buttons
        html.find(".hud-rank-description .activation-flow").click(function (event) {
            event.stopPropagation();
            const el = $(this);
            const talentId = el.data("talent-id");
            const rankIndex = el.data("rank-index");
            const actionIndex = el.data("action-index");
            if (talentId !== undefined && rankIndex !== undefined && actionIndex !== undefined) {
                StylishAction.useItem(`talent-rank-action:${talentId}:${rankIndex}:${actionIndex}`);
            }
        });

        // Talent rank click opens popup with actions
        html.find(".hud-talent-rank").click(function (event) {
            if ($(event.target).closest(".activation-flow, .hud-talent-rank-header, .hud-rank-toggle").length) return;
            const rank = $(this);
            const descEl = rank.find(".hud-rank-description");
            const nameEl = rank.find(".hud-rank-name");
            const imgEl = rank.closest(".hud-talent-group").find(".hud-talent-img");
            const name = nameEl.text().trim() || "Talent Rank";
            const desc = descEl.html() || "";
            const img = imgEl.attr("src") || "systems/lancer/assets/icons/generic_item.svg";
            const tags = [];
            rank.find(".hud-item-tag").each(function () {
                const el = $(this);
                tags.push({ label: el.text(), class: el.attr("class")?.replace("hud-item-tag", "").trim() || "" });
            });
            new LancerItemPopup({
                id: "talent-rank-popup",
                name: name,
                img: img,
                description: desc,
                tags: tags,
                cost: ""
            }, { title: name }).render(true);
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

        // Toggle full description view on click (only on description text)
        html.find(".hud-item-description").click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).toggleClass("expanded");
        });

        // Click on item row (except actions and description) opens detail popup
        html.find(".hud-item-row").click(async function (event) {
            const target = $(event.target);
            if (target.closest(".hud-item-actions, .hud-item-description, .hud-search-input").length) return;

            event.preventDefault();
            event.stopPropagation();

            const row = $(this);
            const itemId = row.data("item-id");
            if (!itemId) return;

            const actor = lancerHUDInstance?.activeToken?.actor;
            if (!actor) return;

            const nameHtml = row.find(".hud-item-name").html() || "";
            const imgSrc = row.find("img").attr("src") || "";
            const descHtml = row.find(".hud-item-description").html() || "";
            const costHtml = row.find(".hud-item-actions").html() || "";

            const tags = [];
            row.find(".hud-item-tag").each(function () {
                const el = $(this);
                tags.push({
                    label: el.text(),
                    class: el.attr("class")?.replace("hud-item-tag", "").trim() || ""
                });
            });

            // For system-action:{id}:{index}, get parent system data
            let sourceItem = null;
            if (itemId.startsWith("system-action:")) {
                const parentId = itemId.split(":")[1];
                sourceItem = actor.items.get(parentId);
            } else if (itemId.startsWith("core-active-") || itemId.startsWith("core-passive-")) {
                sourceItem = actor.items.find(i => i.type === "mech_frame");
            } else if (itemId.startsWith("core-")) {
                sourceItem = actor.items.find(i => i.type === "mech_frame");
            } else {
                sourceItem = actor.items.get(itemId);
            }

            if (sourceItem?.sheet) {
                const itemData = {
                    id: sourceItem.id,
                    name: sourceItem.name,
                    img: sourceItem.img,
                    description: sourceItem.system?.description || sourceItem.system?.effect || descHtml,
                    tags: tags,
                    cost: costHtml
                };
                new LancerItemPopup(itemData, {
                    title: sourceItem.name
                }).render(true);
            } else {
                new LancerItemPopup({
                    id: itemId,
                    name: stripHtml(nameHtml),
                    img: imgSrc,
                    description: descHtml,
                    tags: tags,
                    cost: costHtml
                }, {
                    title: stripHtml(nameHtml)
                }).render(true);
            }
        });

        // Change structure/stress badge inputs
        html.find(".hud-badge-input").change(async (event) => {
            const input = $(event.currentTarget);
            const path = input.data("path");
            const val = parseInt(input.val());
            const actor = this.activeToken.actor;
            if (actor && !isNaN(val)) {
                await actor.update({ [path]: val });
            }
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

/**
 * Popup Application that displays item details extracted from the HUD row.
 */
class LancerItemPopup extends Application {
    constructor(itemData, options = {}) {
        super(options);
        this.itemData = itemData;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "lancer-item-popup",
            template: "modules/lancer-action-hud/templates/popup.html",
            popOut: true,
            minimizable: true,
            resizable: true,
            width: 500,
            height: "fit-content"
        });
    }

    getData() {
        return this.itemData;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".la-popup-header").click(function () {
            const body = $(this).siblings(".la-popup-body");
            const icon = $(this).find(".la-popup-toggle-icon");
            body.toggleClass("collapsed");
            icon.toggleClass("fa-chevron-up fa-chevron-down");
        });

        html.find(".activation-flow").click(function (event) {
            event.stopPropagation();
            const el = $(this);
            const talentId = el.data("talent-id");
            const rankIndex = el.data("rank-index");
            const actionIndex = el.data("action-index");
            if (talentId !== undefined && rankIndex !== undefined && actionIndex !== undefined) {
                StylishAction.useItem(`talent-rank-action:${talentId}:${rankIndex}:${actionIndex}`);
            }
        });
    }
}

class LancerDeployableHUD extends Application {
    constructor() {
        super();
        this.activeToken = null;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "lancer-deployable-hud",
            title: "Deployable HUD",
            template: "modules/lancer-action-hud/templates/deployable-hud.html",
            popOut: true,
            minimizable: true,
            resizable: false,
            width: "auto",
            height: "auto"
        });
    }

    async getData() {
        const token = this.activeToken;
        if (!token || !token.actor) return { active: false };

        const actor = token.actor;
        const hp = actor.system.hp || { value: 0, max: 0 };
        const heat = actor.system.heat || { value: 0, max: 0 };
        const data = {
            active: true,
            actorName: actor.name,
            actorImg: actor.img || "icons/svg/mystery-man.svg",
            hp: { value: hp.value, max: hp.max },
            heat: { value: heat.value, max: heat.max },
            armor: actor.system.armor ?? 0,
            evasion: actor.system.evasion ?? 0,
            edef: actor.system.edef ?? 0,
            speed: actor.system.speed ?? 0,
            size: actor.system.size ?? 1,
            save: actor.system.save ?? 10,
            detail: actor.system.detail || ""
        };
        return data;
    }
}

function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

let lancerHUDInstance = null;
let deployableHUDInstance = null;

function getActiveHUD() {
    const controlledTokens = canvas.tokens?.controlled || [];
    const ownedToken = controlledTokens.find(t => t.actor && (t.actor.isOwner || game.user.isGM));
    if (ownedToken && ownedToken.actor.type === "deployable") {
        return { instance: deployableHUDInstance, token: ownedToken, isDeployable: true };
    }
    return { instance: lancerHUDInstance, token: ownedToken, isDeployable: false };
}

function refreshHUD() {
    const { instance, token, isDeployable } = getActiveHUD();
    const otherInstance = isDeployable ? lancerHUDInstance : deployableHUDInstance;

    if (otherInstance && otherInstance.activeToken) {
        otherInstance.activeToken = null;
        otherInstance.close();
    }

    if (token) {
        if (instance && instance.activeToken?.id !== token.id) {
            instance.activeToken = token;
            if (game.settings.get("lancer-action-hud", "enableHUD")) {
                instance.render(true);
            }
        }
    } else {
        if (instance && instance.activeToken) {
            instance.activeToken = null;
            instance.close();
        }
    }
}

// Control Token Selection Hook
Hooks.on("controlToken", (token, controlled) => {
    setTimeout(() => {
        refreshHUD();
    }, 50);
});

// Update Actor Stats Hook
Hooks.on("updateActor", (actor, diff, options, userId) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor?.id === actor.id) {
        instance.render(false);
    }
});

// Create/Delete Item Hooks
Hooks.on("createItem", (item) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor.id === item.parent?.id) {
        instance.render(false);
    }
});

Hooks.on("deleteItem", (item) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor.id === item.parent?.id) {
        instance.render(false);
    }
});
// Ouve renderização de cards no Chat para capturar cliques nos botões
Hooks.on("renderChatMessage", (message, html, data) => {
    html.find(".lancer-chat-action-btn").click(async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const btn = $(event.currentTarget);
        const actionId = btn.data("action");
        const actorId = btn.data("actor-id");

        // Busca o ator dono da ação ou usa o ativo
        const actor = game.actors.get(actorId) || getActiveHUD().token?.actor;
        
        if (actor && actionId) {
            const adapter = new LancerSystemAdapter();
            await adapter.useItem(actor, actionId, event);
        }
    });
});
// Canvas Ready Hook
Hooks.on("canvasReady", () => {
    refreshHUD();
});

// Automatically update tracker on attacks or actions
Hooks.on("createChatMessage", async (msg, options, userId) => {
    if (userId !== game.user.id) return;

    const { instance } = getActiveHUD();
    if (!instance || instance instanceof LancerDeployableHUD) return;
    if (!instance.activeToken) return;
    const actor = instance.activeToken.actor;

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
        const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
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

        await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
    }
});

// Automatically update tracker on movement
Hooks.on("updateToken", async (tokenDoc, changes, context, userId) => {
    if (userId !== game.user.id) return;
    if (changes.x === undefined && changes.y === undefined) return;

    const { instance } = getActiveHUD();
    if (!instance || instance instanceof LancerDeployableHUD) return;
    if (!instance.activeToken) return;
    if (tokenDoc.id !== instance.activeToken.id) return;

    const actor = instance.activeToken.actor;
    if (!actor) return;

    const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
    if (!current.move) {
        const updates = { ...current, move: true };
        await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
    }
});

// Init Hooks Initialization
Hooks.once("init", () => {
    // Persiste a posição da janela popout entre sessões
    game.settings.register("lancer-action-hud", "hudPosition", {
        name: "HUD Position",
        scope: "client",
        config: false,
        type: Object,
        default: { left: 150, top: 100 }
    });

    game.settings.register("lancer-action-hud", "enableHUD", {
        name: "STYLISH_HUD.Settings.EnableHUD.Name",
        hint: "STYLISH_HUD.Settings.EnableHUD.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: value => {
            if (value) {
                refreshHUD();
            } else {
                if (lancerHUDInstance) lancerHUDInstance.close();
                if (deployableHUDInstance) deployableHUDInstance.close();
            }
        }
    });

    game.keybindings.register("lancer-action-hud", "toggleEnableHUD", {
        name: "STYLISH_HUD.Keybinding.ToggleEnableHUD",
        hint: "STYLISH_HUD.Keybinding.ToggleEnableHUDHint",
        editable: [{ key: "KeyE", modifiers: ["Control"] }],
        onDown: () => {
            const current = game.settings.get("lancer-action-hud", "enableHUD");
            game.settings.set("lancer-action-hud", "enableHUD", !current);
            ui.notifications.info(`Lancer Action HUD: ${!current ? game.i18n.localize("STYLISH_HUD.Settings.HUDEnabled") : game.i18n.localize("STYLISH_HUD.Settings.HUDDisabled")}`);
            return true;
        }
    });

    game.keybindings.register("lancer-action-hud", "toggleHUD", {
        name: "STYLISH_HUD.Keybinding.ToggleHUD",
        hint: "STYLISH_HUD.Keybinding.ToggleHUDHint",
        editable: [{ key: "KeyZ" }],
        onDown: () => {
            const { instance } = getActiveHUD();
            if (instance && typeof instance.toggleHUD === "function") {
                instance.toggleHUD();
            } else if (lancerHUDInstance) {
                lancerHUDInstance.toggleHUD();
            }
            return true;
        }
    });
});
Hooks.on("createActiveEffect", (effect) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor?.id === effect.parent?.id) {
        instance.render(false);
    }
});

// Re-renderiza o HUD quando um efeito/status é removido
Hooks.on("deleteActiveEffect", (effect) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor?.id === effect.parent?.id) {
        instance.render(false);
    }
});
// Ready Hooks Initialization
Hooks.once("ready", () => {
    const adapter = new LancerSystemAdapter();
    lancerHUDInstance = new LancerActionHUD(adapter);
    deployableHUDInstance = new LancerDeployableHUD();

    window.StylishAction = {
        useItem: async (itemId, event) => {
            const { instance } = getActiveHUD();
            if (instance && instance instanceof LancerActionHUD && instance.activeToken) {
                await instance.adapter.useItem(instance.activeToken.actor, itemId, event);
            }
        },
        closeHUD: () => {
            if (lancerHUDInstance) {
                lancerHUDInstance.activeToken = null;
                lancerHUDInstance.close();
            }
            if (deployableHUDInstance) {
                deployableHUDInstance.activeToken = null;
                deployableHUDInstance.close();
            }
        },
        toggleHUD: () => {
            const { instance } = getActiveHUD();
            if (instance && typeof instance.toggleHUD === "function") {
                instance.toggleHUD();
            } else if (lancerHUDInstance) {
                lancerHUDInstance.toggleHUD();
            }
        }
    };

    refreshHUD();
});
