/* scripts/adapter/data-utility.js */

/**
 * Retorna dados de utilitários (Overcharge, Stabilize, Reactions, etc.) para o HUD.
 * @param {Actor} actor
 * @returns {{ items: Array }}
 */
export function getUtilityData(actor) {
    const items = [];
    if (!actor) return { items };

    // Standard LANCER tactical options
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
        const ocNameWithDie = `${ocNameStr} <span style="font-family:'Orbitron'; font-size:0.6em; color:#ffaa00;">${displayDie}</span>`;
        const ocNamePlain = `${ocNameStr} ${displayDie}`;

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

        // Testes de Dano de Stress e Estrutura
        items.push(
            {
                id: "util-overheat-self",
                actionId: "overheat:self",
                name: "<i class='cci cci-heat i--4'></i>",
                tooltip: "Teste de Dano de Stress",
                isIcon: true,
                cost: `<button type="button" class="hud-utility-btn" onclick="event.stopPropagation(); StylishAction.useItem('overheat:self', event)" data-tooltip="Teste de Dano de Stress" data-uuid="${actor.uuid}" data-flow-type="Stress"><i class="cci cci-heat i--4"></i></button>`,
                description: "Realiza o Teste de Superaquecimento / Dano de Estresse (Stress Check)."
            },
            {
                id: "util-structure-self",
                actionId: "structure:self",
                name: "<i class='cci cci-condition-shredded i--4'></i>",
                tooltip: "Teste de Dano de Estrutura",
                isIcon: true,
                cost: `<button type="button" class="hud-utility-btn" onclick="event.stopPropagation(); StylishAction.useItem('structure:self', event)" data-tooltip="Teste de Dano de Estrutura" data-uuid="${actor.uuid}" data-flow-type="Structure"><i class="cci cci-condition-shredded i--4"></i></button>`,
                description: "Realiza o Teste de Dano de Estrutura (Structure Check)."
            }
        );

        const repairName = game.i18n.localize("STYLISH_HUD.Utilities.FullRepair.Name");
        items.push({
            id: "util-full-repair",
            actionId: "util:full-repair",
            name: `<span style="font-family:'Orbitron'; font-size:0.6em;">${repairName}</span>`,
            tooltip: repairName,
            isIcon: false,
            cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:full-repair')"> ${game.i18n.localize("STYLISH_HUD.Utilities.FullRepair.Action")} </button>`,
            description: game.i18n.localize("STYLISH_HUD.Utilities.FullRepair.Desc")
        });
    }

    return { items };
}
