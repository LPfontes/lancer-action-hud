/* scripts/adapter/data-system.js */
import { getItemTags } from "./item-tags.js";

/**
 * Retorna dados de sistemas do mech para o HUD.
 * @param {Actor} actor
 * @returns {{ hasTabs, hasSubTabs, items, tabLabels }}
 */
export function getSystemData(actor) {
    const categories = {
        all: []
    };
    if (!actor) return { items: categories };

    const systems = actor.items.filter(i =>
        i.type === "mech_system" ||
        i.type === "pilot_gear" ||
        i.type === "pilot_armor" ||
        (i.type === "npc_feature" && i.system?.type?.toLowerCase() !== "weapon")
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
            tags: getItemTags(s),
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
