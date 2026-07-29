/* scripts/hud/lancer-action-hud.js */
import { LancerItemPopup } from "./lancer-item-popup.js";
import { getActiveHUD, HUDState, stripHtml } from "../utils.js";

/**
 * Standalone HUD Application for Lancer VTT
 */
export class LancerActionHUD extends Application {
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

            const actor = HUDState.lancerHUD?.activeToken?.actor;
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
