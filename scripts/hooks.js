/* scripts/hooks.js */
import { getActiveHUD, refreshHUD, HUDState, isSuperheavyWeapon } from "./utils.js";
import { LancerSystemAdapter } from "./adapter/lancer-adapter.js";
import { LancerDeployableHUD } from "./hud/lancer-deployable-hud.js";
import { safeToggleStatusEffect } from "./socket.js";

// Control Token Selection Hook
Hooks.on("controlToken", (token, controlled) => {
    setTimeout(() => {
        refreshHUD();
    }, 50);
});

// Update Actor Stats Hook
Hooks.on("updateActor", (actor, diff, options, userId) => {
    const { instance } = getActiveHUD();
    if (instance && instance.activeToken?.actor?.id === actor.id) {
        instance.render(false);
    }
});

// Create/Delete Item Hooks
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
    html.find(".lancer-chat-action-btn").click(async (event) => {
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

    html.find(".lancer-chat-apply-status-btn").click(async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const btn = $(event.currentTarget);
        const statusId = btn.data("status-id");
        const targetsStr = btn.data("targets");

        if (!statusId) return;

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
                await safeToggleStatusEffect(targetActor, statusId, { active: true });
                count++;
            }
        }
        ui.notifications.info(`Efeito '${statusId}' processado em ${count} token(s).`);
    });
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
            const { instance } = getActiveHUD();
            if (instance && typeof instance.toggleHUD === "function") {
                instance.toggleHUD();
            } else if (HUDState.lancerHUD) {
                HUDState.lancerHUD.toggleHUD();
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
