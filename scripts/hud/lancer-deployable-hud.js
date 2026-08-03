/* scripts/hud/lancer-deployable-hud.js */

/**
 * HUD compacto para tokens do tipo Deployable.
 */
export class LancerDeployableHUD extends Application {
    constructor() {
        super();
        this.activeToken = null;
        this._hudVisible = true;
    }

    /**
     * Alterna a visibilidade do HUD do deployable (tecla Z).
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

    /** Retorna botões do cabeçalho da janela */
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        buttons.unshift({
            label: "",
            class: "hud-minimize-btn",
            icon: "fas fa-window-minimize",
            onclick: (ev) => {
                ev.preventDefault();
                this.toggleHUD();
            }
        });
        const protoTokenLabel = game.i18n.localize("STYLISH_HUD.Button.PrototypeToken") || "Protótipo de Token";
        buttons.unshift({
            label: protoTokenLabel,
            class: "configure-token",
            icon: "fa-solid fa-circle-user",
            onclick: (ev) => {
                ev.preventDefault();
                const actor = this.activeToken?.actor;
                if (!actor) {
                    ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget") || "No active token/actor selected.");
                    return;
                }
                const tokenSheet = this.activeToken?.sheet || this.activeToken?.document?.sheet;
                if (tokenSheet) {
                    tokenSheet.render(true);
                } else if (actor.prototypeToken?.sheet) {
                    actor.prototypeToken.sheet.render(true);
                } else if (typeof TokenConfig !== "undefined") {
                    const doc = (actor.prototypeToken instanceof foundry.abstract.Document)
                        ? actor.prototypeToken
                        : actor;
                    new TokenConfig(doc, { configureDefault: true }).render(true);
                } else {
                    actor.sheet?.render(true);
                }
            }
        });
        return buttons;
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
        try {
            const saved = game.settings.get("lancer-action-hud", "hudPosition");
            if (saved && !options.left && !options.top) {
                options.left = saved.left;
                options.top = saved.top;
            }
        } catch (e) { }
        return super._render(force, options);
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".la-deployable-header").css("cursor", "pointer").on("click", (ev) => {
            ev.preventDefault();
            const actor = this.activeToken?.actor;
            if (actor) {
                actor.sheet?.render(true);
            }
        });
    }

    async close(options = {}) {
        this._hudVisible = false;
        return super.close(options);
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
