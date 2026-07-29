/* scripts/hud/lancer-deployable-hud.js */

/**
 * HUD compacto para tokens do tipo Deployable.
 */
export class LancerDeployableHUD extends Application {
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
