/* scripts/adapter/data-strike.js */
import { getItemTags } from "./item-tags.js";

/**
 * Retorna dados de armas (Weapons tab) para o HUD.
 * @param {Actor} actor
 * @returns {{ items: Array }}
 */
export function getStrikeData(actor) {
    const items = [];
    if (!actor) return { items };

    // Build map of weapons to their mounts & loaded status from system.loadout.weapon_mounts
    const weaponMountMap = {};
    const weaponLoadedMap = {};
    if (actor.system.loadout?.weapon_mounts) {
        actor.system.loadout.weapon_mounts.forEach((mount, mountIdx) => {
            const mountType = mount.type || `Mount ${mountIdx + 1}`;
            if (mount.slots) {
                mount.slots.forEach(slot => {
                    const weaponObj = slot.weapon?.value || slot.weapon;
                    const weaponId = slot.weapon?.id || slot.weapon?._id || slot.weapon?.value?.id || slot.weapon?.value?._id || weaponObj?.id || weaponObj?._id;
                    if (weaponId) {
                        weaponMountMap[weaponId] = mountType;
                    }
                    if (weaponObj?.system?.loaded !== undefined) {
                        if (weaponId) weaponLoadedMap[weaponId] = weaponObj.system.loaded;
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

        const itemTagsList = getItemTags(w);
        const isLoadingWeapon = w.system?.loading === true || w.system?.loading_tag === true || itemTagsList.some(t => {
            const tagStr = (t.id || t.name || t.label || "").toLowerCase();
            return tagStr.includes("loading") || tagStr.includes("recarga") || tagStr.includes("tg_loading");
        });

        const isLoaded = isLoadingWeapon
            ? (w.system?.loaded !== undefined 
                ? w.system.loaded 
                : (weaponLoadedMap[w.id] !== undefined ? weaponLoadedMap[w.id] : true))
            : true;

        const unloadedText = game.i18n.localize("STYLISH_HUD.Weapon.Unloaded") || "DESCARREGADA";
        const unloadedLabel = (isLoadingWeapon && isLoaded === false) 
            ? `<span style="font-family:'Orbitron'; font-size:0.85em; color:#ff9d00; margin-left:8px; font-weight:bold;">[${unloadedText}]</span>` 
            : "";

        const isDestroyed = w.system?.destroyed;
        const destroyedLabel = isDestroyed ? `<span style="font-family:'Orbitron'; font-size:0.85em; color:#ff3333; margin-left:8px; font-weight:bold;">[DESTRUÍDO]</span>` : "";
        const nameStyle = isDestroyed ? "font-weight:bold; vertical-align:middle; text-decoration:line-through; opacity:0.6;" : "font-weight:bold; vertical-align:middle;";

        const weaponItem = {
            id: w.id,
            name: `<span style="${nameStyle}">${w.name}</span>${usesLabel}${unloadedLabel}${destroyedLabel}`,
            img: w.img || "systems/lancer/assets/icons/generic_item.svg",
            cost: actionButtons,
            tags: itemTagsList,
            description: fullDescription,
            canDestroy: true,
            isDestroyed: isDestroyed,
            isLoaded: isLoaded
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

    // Add Improvised Attack basic action
    const improvisedTooltip = `
        <div class="la-tooltip__content">
            Clique Esquerdo: Rolar Ataque Improvisado<br>
            Clique Direito: Card no Chat
        </div>
    `;

    const improvisedActionButtons = `
        <button type="button" class="roll-damage" 
            data-tooltip="${improvisedTooltip.replace(/"/g, '&quot;')}" 
            data-tooltip-class="clipped-bot la-tooltip la-gmsdark" 
            data-tooltip-direction="UP" 
            aria-label="Rolar" 
            onclick="event.stopPropagation(); StylishAction.useItem('attack:improvised', event)" 
            oncontextmenu="event.preventDefault(); event.stopPropagation(); StylishAction.useItem('basic:improvised', event)">
            <span class="range">
                <span class="la-number-weapon__span">1</span> 
                <i class="cci cci-melee"></i>
            </span>
            <span class="damage">
                <span class="la-number-weapon__span">1d6</span>
                <i class="cci cci-kinetic"></i>
            </span>
            <i style=""></i>
        </button>
    `;

    const tf = (key, data, fallback) => game.i18n.format(`STYLISH_HUD.Tags.${key}`, data) || fallback;
    const fullActionLabel = game.i18n.localize("STYLISH_HUD.Tags.FullAction") || "Ação Completa";
    const kineticTag = tf("Kinetic", { damage: "1d6" }, "1d6 Cinético");
    const threatTag = tf("Threat", { amount: 1 }, "Ameaça 1");

    const improvisedItem = {
        id: "basic-improvised",
        name: `<span style="font-weight:bold; vertical-align:middle;">${game.i18n.localize("STYLISH_HUD.Basic.ImprovisedAttack.Name") || "Ataque Improvisado"}</span>`,
        img: "systems/lancer/assets/icons/skills/brawler.svg",
        cost: improvisedActionButtons,
        tags: [
            { label: fullActionLabel, class: "tag-damage" },
            { label: kineticTag, class: "tag-damage" },
            { label: threatTag, class: "tag-range" }
        ],
        description: game.i18n.localize("STYLISH_HUD.Basic.ImprovisedAttack.Desc"),
        isAction: true
    };

    items.unshift(improvisedItem);

    return { items };
}
