/* scripts/adapter/data-counters.js */

/**
 * Mapeamento padrão dos contadores/dados de talentos do LANCER (baseado em talents.json).
 */
const KNOWN_TALENT_COUNTERS = {
    t_brawler: [
        { rank: 3, id: "ctr_brawler", name: "Dado de Lutador", default_value: 6, min: 1, max: 6, description: "Ganhe um Dado de Lutador — 1d6 — que começa em 6. Sempre que você <b>Agarrar</b>, <b>Empurrar</b> ou <b>Improvisar Ataque</b>, diminua o valor do Dado de Lutador em 1. Quando o Dado de Lutador atingir 1, você pode redefini-lo para 6 e, como uma <b>Ação Completa</b>, fazer um golpe nocauteador contra um personagem adjacente. Ele deve obter sucesso em um <b>salvamento de Casco</b>, ou sofre <b>2d6+2 de Dano Cinético</b> e fica <b>Atordoado</b> até o final do próximo turno dele. O valor do seu Dado de Lutador persiste entre as cenas, mas é redefinido para 6 quando você descansar ou fizer um <b>Reparo Completo</b>." }
    ],
    t_brutal: [
        { rank: 2, id: "ctr_brutal", name: "Precisão Implacável", default_value: 0, min: 0, max: 6, description: "Quando fizer uma rolagem de ataque e errar, sua próxima rolagem de ataque recebe <b>+1 de Precisão</b>. Esse efeito se acumula e persiste até você acertar." }
    ],
    t_duelist: [
        { rank: 3, id: "ctr_duelist", name: "Dados de Espadachim", default_value: 0, min: 0, max: 3, description: "1/rodada, quando você acertar com uma arma Principal Corpo a Corpo, você recebe 1 Dado de Espadachim — 1d6 — até um máximo de 3 Dados de Espadachim. Eles duram até serem gastos ou quando a cena atual terminar. Você pode gastar Dados de Espadachim a uma taxa de 1 para 1 para: Aparar (Reação p/ Resistência), Defletir (Reação a distância), Fintar (Ação Livre p/ ignorar engajamento) ou Derrubar (Ação Rápida p/ derrubar alvo)." }
    ],
    t_gunslinger: [
        { rank: 3, id: "ctr_gunslinger", name: "Dado de Pistoleiro", default_value: 6, min: 1, max: 6, description: "Você ganha um Dado de Pistoleiro — 1d6 — começando em 6. Sempre que você acertar com uma arma Auxiliar à distância, reduza o valor do Dado de Pistoleiro em 1. Quando o Dado de Pistoleiro atingir 1, você pode redefinir para 6 para dar <b>+2d6 de Dano bônus</b> ao acertar e tornar o <b>Dano</b> PF para seu próximo ataque com uma arma Auxiliar à distância. Esse ataque também ignora cobertura. O valor do seu Dado de Pistoleiro persiste entre as cenas, mas é redefinido para 6 quando você descansar ou fizer um Reparo Completo." }
    ],
    t_leader: [
        { rank: 1, id: "ctr_leader", name: "Dados de Liderança", default_value: 3, min: 0, max: 6, description: "Ganhe Dados de Liderança (d6). 1/turno, no seu turno como uma <b>Ação Livre</b>, você pode dar uma ordem a um PJ aliado com o qual você pode se comunicar, descrevendo um curso de ação, e entregar a ele um Dado de Liderança. Ele pode gastar o Dado de Liderança para receber <b>+1 de Precisão</b> em qualquer ação que siga diretamente essa ordem, ou para reduzir Dano sofrido em -1d6, ou para causar +1d6 de Dano bônus." },
        { rank: 3, id: "ctr_leader", name: "Dados de Liderança", default_value: 6, min: 0, max: 6, description: "Ganhe 6 Dados de Liderança (d6). 1/turno, no seu turno como uma <b>Ação Livre</b>, você pode dar uma ordem a um PJ aliado com o qual você pode se comunicar, descrevendo um curso de ação, e entregar a ele um Dado de Liderança. Ele pode gastar o Dado de Liderança para receber <b>+1 de Precisão</b> em qualquer ação que siga diretamente essa ordem, ou para reduzir Dano sofrido em -1d6, ou para causar +1d6 de Dano bônus." }
    ],
    t_stormbringer: [
        { rank: 3, id: "ctr_stormbringer", name: "Dado de Torrente", default_value: 6, min: 1, max: 6, description: "Ganhe um Dado de Torrente, 1d6 começando em 6. Sempre que usar <b>Domínio da Tempestade</b>, diminua o valor do Dado de Torrente em 1, até um mínimo de 1.<br>Quando o Dado de Torrente chegar a 1, você pode redefini-lo para 6 e fazer um ataque maciço como uma <b>Ação Completa</b>, visando um personagem na linha de visão e a até <b>Alcance 15</b>: ele deve obter sucesso em um <b>salvamento de Agilidade</b> ou sofre 2d6 explosivo, fica <b>Atordoado</b> até o final do próximo turno dele e cai <b>Prostrado</b>. Em caso de sucesso, ele sofre metade do <b>Dano</b> e cai <b>Prostrado</b>, mas não fica <b>Atordoado</b>.<br>O valor do seu Dado de Torrente persiste entre as cenas, mas é redefinido para 6 quando você descansar ou fizer um <b>Reparo Completo</b>." }
    ]
};

function normalizeKey(str) {
    if (!str || typeof str !== "string") return "";
    return str.toLowerCase()
        .replace(/_die$/g, "")
        .replace(/\sdie$/g, "")
        .replace(/^ctr_/g, "")
        .trim();
}

/**
 * Retorna os dados de contadores/dados de talentos do piloto ativo para o HUD.
 * @param {Actor} actor
 * @returns {{ items: Array, hasTabs: boolean }}
 */
export function getCountersData(actor) {
    if (!actor) return { items: [] };

    // Se o ator for um mecha, busca o piloto correspondente
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

    const counterItems = [];
    const talents = targetActor.items.filter(i => i.type === "talent");

    talents.forEach(t => {
        const currRank = t.system.curr_rank || 1;
        const talentId = t.system.id || t.id;
        const lowerName = t.name.toLowerCase();

        // 1. Procura definições estáticas baseadas no ID do talento ou nome
        let key = Object.keys(KNOWN_TALENT_COUNTERS).find(k => k === talentId);
        if (!key) {
            if (lowerName.includes("lutador") || lowerName.includes("brawler")) key = "t_brawler";
            else if (lowerName.includes("brutal")) key = "t_brutal";
            else if (lowerName.includes("espadachim") || lowerName.includes("duelist")) key = "t_duelist";
            else if (lowerName.includes("pistoleiro") || lowerName.includes("gunslinger")) key = "t_gunslinger";
            else if (lowerName.includes("liderança") || lowerName.includes("leader")) key = "t_leader";
            else if (lowerName.includes("torrente") || lowerName.includes("stormbringer")) key = "t_stormbringer";
        }

        const activeDefs = new Map();

        if (key && KNOWN_TALENT_COUNTERS[key]) {
            KNOWN_TALENT_COUNTERS[key].forEach(def => {
                if (currRank >= def.rank) {
                    // Sobrescreve posto inferior pelo superior se possuir mesmo id (ex: Liderança rank 3 vs rank 1)
                    activeDefs.set(def.id, { ...def, systemId: def.id });
                }
            });
        }

        // 2. Procura definições dinâmicas no próprio item (se o sistema Lancer as fornecer) e mescla com as estáticas para evitar duplicatas
        if (t.system.counters) {
            const sysCounters = Array.isArray(t.system.counters)
                ? t.system.counters
                : Object.values(t.system.counters);

            sysCounters.forEach(c => {
                if (!c) return;
                const cId = c.id || `ctr_${(c.name || "dado").toLowerCase().replace(/\s+/g, '_')}`;
                const cNorm = normalizeKey(cId);

                // Procura se já existe uma definição correspondente em activeDefs
                let existingKey = null;
                for (const [mapId, existingDef] of activeDefs.entries()) {
                    const existingNormId = normalizeKey(existingDef.id);
                    const existingNormName = normalizeKey(existingDef.name);
                    if (existingNormId === cNorm || existingNormName === cNorm || cNorm.includes(existingNormId) || existingNormId.includes(cNorm)) {
                        existingKey = mapId;
                        break;
                    }
                }

                if (existingKey) {
                    const existing = activeDefs.get(existingKey);
                    existing.systemId = cId;
                    if (c.min !== undefined) existing.min = c.min;
                    if (c.max !== undefined) existing.max = c.max;
                    if (c.default_value !== undefined || c.val !== undefined || c.value !== undefined) {
                        existing.default_value = c.default_value ?? c.val ?? c.value;
                    }
                } else {
                    activeDefs.set(cId, {
                        rank: 1,
                        id: cId,
                        systemId: cId,
                        name: c.name || "Dado",
                        default_value: c.default_value ?? c.val ?? c.value ?? 0,
                        min: c.min ?? 0,
                        max: c.max ?? 99
                    });
                }
            });
        }

        // 3. Constrói os objetos de contador para o HUD
        activeDefs.forEach(def => {
            const effectiveId = def.systemId || def.id;
            const normId = normalizeKey(def.id);

            const itemFlagVal = t.getFlag("lancer-action-hud", `counter_${effectiveId}`)
                ?? t.getFlag("lancer-action-hud", `counter_${def.id}`)
                ?? t.getFlag("lancer-action-hud", `counter_ctr_${normId}`)
                ?? t.getFlag("lancer-action-hud", `counter_ctr_${normId}_die`);

            const actorFlagVal = targetActor.getFlag("lancer-action-hud", `counter_${effectiveId}`)
                ?? targetActor.getFlag("lancer-action-hud", `counter_${def.id}`)
                ?? targetActor.getFlag("lancer-action-hud", `counter_ctr_${normId}`);

            let sysVal = undefined;
            if (t.system.counters) {
                if (Array.isArray(t.system.counters)) {
                    const match = t.system.counters.find(sc => sc && (sc.id === effectiveId || sc.id === def.id || sc.name === def.name || normalizeKey(sc.id) === normId));
                    if (match) sysVal = match.val ?? match.value;
                } else if (typeof t.system.counters === "object") {
                    const match = t.system.counters[effectiveId] || t.system.counters[def.id];
                    if (match) sysVal = match.val ?? match.value;
                }
            }

            const rawVal = itemFlagVal ?? actorFlagVal ?? sysVal ?? def.default_value;
            const currentVal = Math.clamp(Number(rawVal), def.min, def.max);

            const itemDesc = t.system.ranks?.[currRank - 1]?.description
                ?? t.system.ranks?.[currRank - 1]?.detail
                ?? t.system.description
                ?? t.system.terse
                ?? def.description
                ?? "Dado / Contador de talento do LANCER.";

            counterItems.push({
                talentItemId: t.id,
                talentName: t.name,
                talentImg: t.img || "systems/lancer/assets/icons/generic_item.svg",
                currRank: currRank,
                id: effectiveId,
                name: def.name,
                value: currentVal,
                min: def.min,
                max: def.max,
                defaultValue: def.default_value,
                description: itemDesc
            });
        });
    });

    return {
        items: counterItems
    };
}
