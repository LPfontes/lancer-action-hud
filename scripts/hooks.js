/* scripts/hooks.js */
import { getActiveHUD, refreshHUD, HUDState, isSuperheavyWeapon } from "./utils.js";
import { LancerSystemAdapter } from "./adapter/lancer-adapter.js";
import { LancerDeployableHUD } from "./hud/lancer-deployable-hud.js";
import { safeToggleStatusEffect, safeApplyHeat } from "./socket.js";

// Control Token Selection Hook
// A abertura do HUD é feita manualmente pela tecla Z (keybinding "toggleHUD").
// Aqui apenas fechamos o HUD quando nenhum token está selecionado.
Hooks.on("controlToken", (token, controlled) => {
    setTimeout(() => {
        const controlled = canvas.tokens?.controlled || [];
        if (controlled.length === 0) {
            // Nenhum token selecionado: fecha o HUD
            const { instance } = getActiveHUD();
            if (instance && instance.activeToken) {
                instance.activeToken = null;
                instance.close();
            }
            if (HUDState.deployableHUD && HUDState.deployableHUD.activeToken) {
                HUDState.deployableHUD.activeToken = null;
                HUDState.deployableHUD.close();
            }
        }
    }, 50);
});

// Update Actor Stats Hook
Hooks.on("updateActor", (actor, diff, options, userId) => {
    const { instance } = getActiveHUD();
    if (instance && (instance.activeToken?.actor?.id === actor.id || instance.activeToken?.actor?.system?.pilot?.value?.id === actor.id)) {
        instance.render(false);
    }
});

// Create/Update/Delete Item Hooks
Hooks.on("updateItem", (item) => {
    const { instance } = getActiveHUD();
    const activeActorId = instance?.activeToken?.actor?.id;
    const activePilotId = instance?.activeToken?.actor?.system?.pilot?.value?.id;
    if (instance && (item.parent?.id === activeActorId || item.parent?.id === activePilotId)) {
        instance.render(false);
    }
});

Hooks.on("createItem", (item) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor.id === item.parent?.id) {
        instance.render(false);
    }
});

Hooks.on("deleteItem", (item) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor.id === item.parent?.id) {
        instance.render(false);
    }
});


// Ouve renderização de cards no Chat para capturar cliques nos botões
Hooks.on("renderChatMessage", (message, html, data) => {
    html.on("click", ".lancer-chat-action-btn", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const btn = $(event.currentTarget);
        const actionId = btn.data("action");
        const actorId = btn.data("actor-id");

        // Busca o ator dono da ação ou usa o ativo
        const actor = game.actors.get(actorId) || getActiveHUD().token?.actor;

        if (actor && actionId) {
            const adapter = new LancerSystemAdapter();
            await adapter.useItem(actor, actionId, event);
        }
    });

    html.on("click", ".lancer-chat-apply-status-btn", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const btn = $(event.currentTarget);
        const statusIdStr = btn.data("status-id");
        const targetsStr = btn.data("targets");

        if (!statusIdStr) return;

        const statusIds = String(statusIdStr).split(";").flatMap(s => s.split(",")).map(s => s.trim()).filter(Boolean);

        let targetUuids = [];
        if (targetsStr) {
            targetUuids = String(targetsStr).split(",").filter(Boolean);
        }

        if (targetUuids.length === 0) {
            const currentTargets = Array.from(game.user.targets);
            if (currentTargets.length > 0) {
                targetUuids = currentTargets.map(t => t.actor?.uuid || t.document?.uuid).filter(Boolean);
            }
        }

        if (targetUuids.length === 0) {
            ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget") || "Selecione pelo menos um token como alvo.");
            return;
        }

        let count = 0;
        for (const uuid of targetUuids) {
            const doc = await fromUuid(uuid);
            const targetActor = doc?.actor || (doc instanceof Actor ? doc : null);
            if (targetActor) {
                for (const statusId of statusIds) {
                    await safeToggleStatusEffect(targetActor, statusId, { active: true });
                }
                count++;
            }
        }
        ui.notifications.info(`Efeito(s) '${statusIds.join(", ")}' processado(s) em ${count} token(s).`);
    });

    html.on("click", ".lancer-chat-apply-heat-btn", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const btn = $(event.currentTarget);
        const heatAmount = parseInt(btn.data("heat")) || 2;
        const targetsStr = btn.data("targets");

        let targetUuids = [];
        if (targetsStr) {
            targetUuids = String(targetsStr).split(",").filter(Boolean);
        }

        if (targetUuids.length === 0) {
            const currentTargets = Array.from(game.user.targets);
            if (currentTargets.length > 0) {
                targetUuids = currentTargets.map(t => t.actor?.uuid || t.document?.uuid).filter(Boolean);
            }
        }

        if (targetUuids.length === 0) {
            ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget") || "Selecione pelo menos um token como alvo.");
            return;
        }

        let count = 0;
        for (const uuid of targetUuids) {
            const doc = await fromUuid(uuid);
            const targetActor = doc?.actor || (doc instanceof Actor ? doc : null);
            if (targetActor) {
                await safeApplyHeat(targetActor, heatAmount);
                count++;
            }
        }
        if (count > 0) {
            ui.notifications.info(`Aplicado ${heatAmount} de Calor em ${count} token(s).`);
        }
    });

    // Injeta os botões de calor e Fragment Signal em cards de Tech Attack / Invade sem botões existentes
    const contentText = (message.content || "").toLowerCase();
    const headerText = html.find(".lancer-header, .card-header, header").text().toLowerCase();
    const flagsLancer = message.flags?.lancer || {};

    const isTechOrInvadeCard = 
        flagsLancer.flow === "TechAttackFlow" || 
        flagsLancer.stat === "tech_attack" ||
        String(flagsLancer.title || "").toLowerCase().includes("invade") ||
        String(flagsLancer.title || "").toLowerCase().includes("tech") ||
        String(flagsLancer.item?.name || "").toLowerCase().includes("invade") ||
        String(flagsLancer.item?.name || "").toLowerCase().includes("tech") ||
        contentText.includes("tech_attack") ||
        contentText.includes("tech attack") ||
        contentText.includes("invade") || 
        contentText.includes("invadir") ||
        headerText.includes("tech_attack") ||
        headerText.includes("tech attack") ||
        headerText.includes("invade");

    if (isTechOrInvadeCard && html.find(".lancer-hud-injected-buttons, .lancer-chat-apply-heat-btn").length === 0) {
        const targetUuids = Array.from(game.user.targets).map(t => t.actor?.uuid || t.document?.uuid).filter(Boolean);
        const injectedButtonsHtml = `
            <div class="lancer-hud-injected-buttons" style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.15); display: flex; flex-direction: column; gap: 4px;">
                <button type="button" class="pf2e-map-btn lancer-chat-apply-heat-btn" data-heat="2" data-targets="${targetUuids.join(',')}" style="background: rgba(255,100,0,0.15); border: 1px solid #ff6400; color: #ff9d00; padding: 4px 8px; font-size: 0.8em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                    <i class="fas fa-fire"></i> Aplicar 2 de Calor no Alvo
                </button>
                <div style="font-size: 0.75em; font-weight: bold; color: #58b434; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">// FRAGMENT SIGNAL //</div>
                <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="impaired,slowed" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 8px; font-size: 0.8em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                    <i class="fas fa-bolt"></i> Aplicar Fragment Signal (Impaired & Slowed)
                </button>
                <div style="display: flex; gap: 4px; width: 100%;">
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="impaired" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.1); border: 1px solid rgba(88,180,52,0.5); color: #58b434; padding: 3px 6px; font-size: 0.75em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex: 1;">
                        <i class="fas fa-biohazard"></i> Impaired
                    </button>
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="slowed" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.1); border: 1px solid rgba(88,180,52,0.5); color: #58b434; padding: 3px 6px; font-size: 0.75em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex: 1;">
                        <i class="fas fa-hourglass-half"></i> Slowed
                    </button>
                </div>
            </div>
        `;
        const cardBody = html.find(".card, .effect-text, .card-content, .chat-card, .message-content").first();
        if (cardBody.length > 0) {
            cardBody.append(injectedButtonsHtml);
        } else {
            html.append(injectedButtonsHtml);
        }
    }
});

// Canvas Ready Hook
Hooks.on("canvasReady", () => {
    refreshHUD();
});

// Automatically update tracker on attacks or actions
Hooks.on("createChatMessage", async (msg, options, userId) => {
    if (userId !== game.user.id) return;

    const { instance } = getActiveHUD();
    if (!instance || instance instanceof LancerDeployableHUD) return;
    if (!instance.activeToken) return;
    const actor = instance.activeToken.actor;

    if (!actor || msg.speaker?.actor !== actor.id) return;

    let isActionSpent = false;
    let isFullAction = false;
    let isQuickAction = false;

    const content = (msg.content || "").toLowerCase();
    const itemData = msg.flags?.lancer?.item;
    const itemType = itemData ? itemData.type : null;

    if (content.includes("barrage") || content.includes("full action") || content.includes("superheavy")) {
        isFullAction = true;
        isActionSpent = true;
    } else if (content.includes("skirmish") || content.includes("quick action") || content.includes("quick tech")) {
        isQuickAction = true;
        isActionSpent = true;
    } else if (itemType === "weapon" || content.includes("attack roll")) {
        const itemId = msg.flags?.lancer?.itemId || msg.flags?.lancer?.item?._id;
        const weaponItem = itemId ? actor.items.get(itemId) : null;
        const isSuperheavy = weaponItem ? isSuperheavyWeapon(weaponItem) : content.includes("superheavy");

        if (isSuperheavy) {
            isFullAction = true;
        } else {
            isQuickAction = true;
        }
        isActionSpent = true;
    }

    if (isActionSpent) {
        const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
        const updates = { ...current };

        if (isFullAction) {
            updates.full = true;
            updates.quick1 = true;
            updates.quick2 = true;
        } else if (isQuickAction) {
            if (!updates.quick1) updates.quick1 = true;
            else if (!updates.quick2) updates.quick2 = true;

            updates.full = true;
        }

        await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
    }
});

// Automatically update tracker on movement
Hooks.on("updateToken", async (tokenDoc, changes, context, userId) => {
    if (userId !== game.user.id) return;
    if (changes.x === undefined && changes.y === undefined) return;

    const { instance } = getActiveHUD();
    if (!instance || instance instanceof LancerDeployableHUD) return;
    if (!instance.activeToken) return;
    if (tokenDoc.id !== instance.activeToken.id) return;

    const actor = instance.activeToken.actor;
    if (!actor) return;

    const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
    if (!current.move) {
        const updates = { ...current, move: true };
        await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
    }
});

// Init Hooks Initialization
Hooks.once("init", () => {
    // Persiste a posição da janela popout entre sessões
    game.settings.register("lancer-action-hud", "hudPosition", {
        name: "HUD Position",
        scope: "client",
        config: false,
        type: Object,
        default: { left: 150, top: 100 }
    });

    game.settings.register("lancer-action-hud", "enableHUD", {
        name: "STYLISH_HUD.Settings.EnableHUD.Name",
        hint: "STYLISH_HUD.Settings.EnableHUD.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: value => {
            if (value) {
                refreshHUD();
            } else {
                if (HUDState.lancerHUD) HUDState.lancerHUD.close();
                if (HUDState.deployableHUD) HUDState.deployableHUD.close();
            }
        }
    });

    game.keybindings.register("lancer-action-hud", "toggleEnableHUD", {
        name: "STYLISH_HUD.Keybinding.ToggleEnableHUD",
        hint: "STYLISH_HUD.Keybinding.ToggleEnableHUDHint",
        editable: [{ key: "KeyE", modifiers: ["Control"] }],
        onDown: () => {
            const current = game.settings.get("lancer-action-hud", "enableHUD");
            game.settings.set("lancer-action-hud", "enableHUD", !current);
            ui.notifications.info(`Lancer Action HUD: ${!current ? game.i18n.localize("STYLISH_HUD.Settings.HUDEnabled") : game.i18n.localize("STYLISH_HUD.Settings.HUDDisabled")}`);
            return true;
        }
    });

    game.keybindings.register("lancer-action-hud", "toggleHUD", {
        name: "STYLISH_HUD.Keybinding.ToggleHUD",
        hint: "STYLISH_HUD.Keybinding.ToggleHUDHint",
        editable: [{ key: "KeyZ" }],
        onDown: () => {
            const controlledTokens = canvas.tokens?.controlled || [];
            const ownedToken = controlledTokens.find(t => t.actor && (t.actor.isOwner || game.user.isGM));

            if (ownedToken) {
                const isDeployable = ownedToken.actor.type === "deployable";
                const instance = isDeployable ? HUDState.deployableHUD : HUDState.lancerHUD;
                const otherInstance = isDeployable ? HUDState.lancerHUD : HUDState.deployableHUD;

                // Fecha o outro tipo de HUD se estiver aberto
                if (otherInstance && otherInstance.activeToken) {
                    otherInstance.activeToken = null;
                    otherInstance.close();
                }

                if (instance) {
                    // Atualiza o token ativo se mudou
                    if (instance.activeToken?.id !== ownedToken.id) {
                        instance.activeToken = ownedToken;
                    }
                    if (typeof instance.toggleHUD === "function") {
                        instance.toggleHUD();
                    }
                }
            } else {
                // Nenhum token selecionado: apenas faz toggle do que estiver aberto
                const { instance } = getActiveHUD();
                if (instance && typeof instance.toggleHUD === "function") {
                    instance.toggleHUD();
                } else if (HUDState.lancerHUD) {
                    HUDState.lancerHUD.toggleHUD();
                }
            }
            return true;
        }
    });

});

Hooks.on("createActiveEffect", (effect) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor?.id === effect.parent?.id) {
        instance.render(false);
    }
});

// Re-renderiza o HUD quando um efeito/status é removido
Hooks.on("deleteActiveEffect", (effect) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor?.id === effect.parent?.id) {
        instance.render(false);
    }
});
