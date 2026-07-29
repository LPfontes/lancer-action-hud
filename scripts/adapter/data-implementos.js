/* scripts/adapter/data-implementos.js */
import { getItemTags } from "./item-tags.js";

/**
 * Retorna dados de implementos/deployables para o HUD.
 * @param {Actor} actor
 * @returns {{ items: Array }}
 */
export function getImplementosData(actor) {
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
                <div style="display:grid; gap:4px; align-items:center;">
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
            tags: getItemTags(s),
            description: combinedDescription || (s.system?.deployables?.join(", ") || "")
        });
    });

    return { items };
}
