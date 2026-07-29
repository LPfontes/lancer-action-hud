/* scripts/adapter/data-talent.js */

/**
 * Retorna dados de talentos do piloto para o HUD.
 * @param {Actor} actor
 * @returns {{ hasTabs, hasSubTabs, items, rankGroups, tabLabels }}
 */
export function getTalentData(actor) {
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
