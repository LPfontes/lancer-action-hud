/* scripts/adapter/data-actions.js */

/**
 * Retorna dados de Ações Padrões (Actions tab) para o HUD,
 * organizadas por Ações Rápidas, Ações Completas e Reações/Outras.
 * @param {Actor} actor
 * @returns {{ items: Array }}
 */
export function getActionsData(actor) {
    const t = (key, fallback) => game.i18n.localize(`STYLISH_HUD.Tags.${key}`) || fallback;
    const tf = (key, data, fallback) => game.i18n.format(`STYLISH_HUD.Tags.${key}`, data) || fallback;

    const quickActionLabel = t("QuickAction", "Ação Rápida");
    const fullActionLabel = t("FullAction", "Ação Completa");
    const quickTechLabel = t("QuickTech", "Tech Rápido");
    const fullTechLabel = t("FullTech", "Tech Completo");
    const reactionLabel = t("Reaction", "Reação");
    const freeActionLabel = t("FreeAction", "Ação Livre");
    const moveLabel = t("Move", "Movimento");
    const meleeLabel = t("Melee", "Corpo a Corpo");
    const sensorsLabel = t("Sensors", "Sensores");

    const items = [
        // --- AÇÕES RÁPIDAS ---
        {
            name: game.i18n.localize("STYLISH_HUD.Header.QuickActions") || "// AÇÕES RÁPIDAS //",
            isHeader: true
        },
        {
            id: "basic-grapple",
            name: game.i18n.localize("STYLISH_HUD.Basic.Grapple.Name") || "Agarrar",
            img: "systems/lancer/assets/icons/skills/hull.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:grapple')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" },
                { label: meleeLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Grapple.Desc"),
            isAction: true
        },
        {
            id: "basic-hide",
            name: game.i18n.localize("STYLISH_HUD.Basic.Hide.Name") || "Esconder",
            img: "systems/lancer/assets/icons/skills/tactics.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:hide')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Hide.Desc"),
            isAction: true
        },
        {
            id: "basic-ram",
            name: game.i18n.localize("STYLISH_HUD.Basic.Ram.Name") || "Empurrar",
            img: "systems/lancer/assets/icons/skills/hull.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:ram')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" },
                { label: meleeLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Ram.Desc"),
            isAction: true
        },
        {
            id: "basic-boost",
            name: game.i18n.localize("STYLISH_HUD.Basic.Boost.Name") || "Impulsionar",
            img: "systems/lancer/assets/icons/skills/vanguard.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:boost')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Boost.Desc"),
            isAction: true
        },
        {
            id: "basic-search",
            name: game.i18n.localize("STYLISH_HUD.Basic.Search.Name") || "Procurar",
            img: "systems/lancer/assets/icons/skills/spotter.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:search')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" },
                { label: sensorsLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Search.Desc"),
            isAction: true
        },
        {
            id: "basic-quick-tech",
            name: game.i18n.localize("STYLISH_HUD.Basic.QuickTech.Name") || "Programar Rápido",
            img: "systems/lancer/assets/icons/skills/hacker.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:quick-tech')">
                ${quickTechLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickTechLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.QuickTech.Desc"),
            isAction: true
        },
        {
            id: "basic-scan",
            name: game.i18n.localize("STYLISH_HUD.Basic.Scan.Name") || "Escanear",
            img: "systems/lancer/assets/icons/skills/spotter.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:scan')">
                ${quickTechLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickTechLabel, class: "tag-range" },
                { label: sensorsLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Scan.Desc"),
            isAction: true
        },
        {
            id: "basic-invade",
            name: game.i18n.localize("STYLISH_HUD.Basic.Invade.Name") || "Invadir",
            img: "systems/lancer/assets/icons/skills/hacker.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('tech:invade')">
                ${quickTechLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickTechLabel, class: "tag-range" },
                { label: tf("Heat", { amount: 2 }, "2 de Calor"), class: "tag-damage" },
                { label: sensorsLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Invade.Desc"),
            isAction: true
        },
        {
            id: "basic-bolster",
            name: game.i18n.localize("STYLISH_HUD.Basic.Bolster.Name") || "Reforçar",
            img: "systems/lancer/assets/icons/skills/leader.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:bolster')">
                ${quickTechLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickTechLabel, class: "tag-range" },
                { label: sensorsLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Bolster.Desc"),
            isAction: true
        },
        {
            id: "basic-lockon",
            name: game.i18n.localize("STYLISH_HUD.Basic.LockOn.Name") || "Travar Mira",
            img: "systems/lancer/assets/icons/skills/spotter.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:lockon')">
                ${quickTechLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickTechLabel, class: "tag-range" },
                { label: sensorsLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.LockOn.Desc"),
            isAction: true
        },
        {
            id: "basic-self-destruct",
            name: game.i18n.localize("STYLISH_HUD.Basic.SelfDestruct.Name") || "Autodestruir",
            img: "systems/lancer/assets/icons/skills/nuclear_fire.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:self-destruct')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" },
                { label: tf("Burst", { amount: 2 }, "Explosão 2"), class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.SelfDestruct.Desc"),
            isAction: true
        },
        {
            id: "basic-shutdown",
            name: game.i18n.localize("STYLISH_HUD.Basic.ShutDown.Name") || "Desligar",
            img: "systems/lancer/assets/icons/skills/tactics.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:shutdown')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.ShutDown.Desc"),
            isAction: true
        },
        {
            id: "basic-prepare",
            name: game.i18n.localize("STYLISH_HUD.Basic.Prepare.Name") || "Preparar",
            img: "systems/lancer/assets/icons/skills/tactics.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:prepare')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Prepare.Desc"),
            isAction: true
        },
        {
            id: "basic-skirmish",
            name: game.i18n.localize("STYLISH_HUD.Basic.Skirmish.Name") || "Alvejar",
            img: "systems/lancer/assets/icons/skills/brawler.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:skirmish')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Skirmish.Desc"),
            isAction: true
        },
        {
            id: "basic-eject",
            name: game.i18n.localize("STYLISH_HUD.Basic.Eject.Name") || "Ejetar",
            img: "systems/lancer/assets/icons/skills/vanguard.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:eject')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Eject.Desc"),
            isAction: true
        },
        {
            id: "basic-quick-activation",
            name: game.i18n.localize("STYLISH_HUD.Basic.QuickActivation.Name") || "Ativação Rápida",
            img: "systems/lancer/assets/icons/skills/tactics.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(88,180,52,0.05); border-color:rgba(88,180,52,0.25); color:#58b434;" onclick="event.stopPropagation(); StylishAction.useItem('basic:quick-activation')">
                ${quickActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: quickActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.QuickActivation.Desc"),
            isAction: true
        },

        // --- AÇÕES COMPLETAS ---
        {
            name: game.i18n.localize("STYLISH_HUD.Header.FullActions") || "// AÇÕES COMPLETAS //",
            isHeader: true
        },
        {
            id: "basic-barrage",
            name: game.i18n.localize("STYLISH_HUD.Basic.Barrage.Name") || "Barragem",
            img: "systems/lancer/assets/icons/skills/brawler.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:barrage')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Barrage.Desc"),
            isAction: true
        },
        {
            id: "basic-disengage",
            name: game.i18n.localize("STYLISH_HUD.Basic.Disengage.Name") || "Desengajar",
            img: "systems/lancer/assets/icons/skills/vanguard.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:disengage')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Disengage.Desc"),
            isAction: true
        },
        {
            id: "util-stabilize",
            name: game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Name") || "Estabilizar",
            img: "systems/lancer/assets/icons/skills/hull.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('util:stabilize')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Desc"),
            isAction: true
        },
        {
            id: "basic-improvised",
            name: game.i18n.localize("STYLISH_HUD.Basic.ImprovisedAttack.Name") || "Improvisar Ataque",
            img: "systems/lancer/assets/icons/skills/brawler.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('attack:improvised')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" },
                { label: tf("Kinetic", { damage: "1d6" }, "1d6 Cinético"), class: "tag-damage" },
                { label: tf("Threat", { amount: 1 }, "Ameaça 1"), class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.ImprovisedAttack.Desc"),
            isAction: true
        },
        {
            id: "basic-full-tech",
            name: game.i18n.localize("STYLISH_HUD.Basic.FullTech.Name") || "Programar Completo",
            img: "systems/lancer/assets/icons/skills/hacker.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:full-tech')">
                ${fullTechLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullTechLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.FullTech.Desc"),
            isAction: true
        },
        {
            id: "basic-boot-up",
            name: game.i18n.localize("STYLISH_HUD.Basic.BootUp.Name") || "Ligar",
            img: "systems/lancer/assets/icons/skills/tactics.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:boot-up')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.BootUp.Desc"),
            isAction: true
        },
        {
            id: "basic-skill-check",
            name: game.i18n.localize("STYLISH_HUD.Basic.SkillCheck.Name") || "Teste de Perícia",
            img: "systems/lancer/assets/icons/skills/tactics.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:skill-check')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.SkillCheck.Desc"),
            isAction: true
        },
        {
            id: "basic-dismount",
            name: game.i18n.localize("STYLISH_HUD.Basic.Dismount.Name") || "Desmontar",
            img: "systems/lancer/assets/icons/skills/vanguard.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:dismount')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Dismount.Desc"),
            isAction: true
        },
        {
            id: "basic-full-activation",
            name: game.i18n.localize("STYLISH_HUD.Basic.FullActivation.Name") || "Ativação Completa",
            img: "systems/lancer/assets/icons/skills/tactics.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:full-activation')">
                ${fullActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: fullActionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.FullActivation.Desc"),
            isAction: true
        },

        // --- REAÇÕES E OUTROS ---
        {
            name: game.i18n.localize("STYLISH_HUD.Header.OtherActions") || "// OUTRAS AÇÕES E REAÇÕES //",
            isHeader: true
        },
        {
            id: "basic-move",
            name: game.i18n.localize("STYLISH_HUD.Basic.Move.Name") || "Movimento",
            img: "systems/lancer/assets/icons/skills/vanguard.svg",
            cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('tracker:move')">
                ${moveLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: moveLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Move.Desc"),
            isAction: true
        },
        {
            id: "basic-overwatch",
            name: game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Name") || "Retaliar",
            img: "systems/lancer/assets/icons/skills/vanguard.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:overwatch')">
                ${reactionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: reactionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Desc"),
            isAction: true
        },
        {
            id: "basic-brace",
            name: game.i18n.localize("STYLISH_HUD.Basic.Brace.Name") || "Suportar",
            img: "systems/lancer/assets/icons/skills/hull.svg",
            cost: `<button type="button" class="pf2e-map-btn" style="background:rgba(215,60,50,0.05); border-color:rgba(215,60,50,0.25); color:#d73c32;" onclick="event.stopPropagation(); StylishAction.useItem('basic:brace')">
                ${reactionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: reactionLabel, class: "tag-damage" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Basic.Brace.Desc"),
            isAction: true
        },
        {
            id: "util-overcharge",
            name: game.i18n.localize("STYLISH_HUD.Utilities.Overcharge.Name") || "Sobrecarga",
            img: "systems/lancer/assets/icons/skills/nuclear_fire.svg",
            cost: `<button type="button" class="pf2e-map-btn" onclick="event.stopPropagation(); StylishAction.useItem('util:overcharge')">
                ${freeActionLabel.toUpperCase()}
            </button>`,
            tags: [
                { label: freeActionLabel, class: "tag-range" }
            ],
            description: game.i18n.localize("STYLISH_HUD.Utilities.Overcharge.Desc"),
            isAction: true
        }
    ];

    return { items };
}
