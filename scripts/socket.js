/* scripts/socket.js */

/**
 * Registers the socket listener for GM-delegated operations.
 */
export function registerSocketListeners() {
    game.socket.on("module.lancer-action-hud", async (data) => {
        if (!data || typeof data !== "object") return;
        if (!game.user.isGM) return;

        // Ensure only one active GM handles the socket event to prevent duplicate executions
        const activeGMs = game.users.filter(u => u.isGM && u.active);
        const primaryGM = activeGMs.sort((a, b) => a.id.localeCompare(b.id))[0];
        if (primaryGM && primaryGM.id !== game.user.id) return;

        try {
            if (data.type === "toggleStatusEffect") {
                const { actorUuid, statusId, options } = data;
                if (!actorUuid || !statusId) return;
                const doc = await fromUuid(actorUuid);
                const targetActor = doc?.actor || (doc instanceof Actor ? doc : null);
                if (targetActor && typeof targetActor.toggleStatusEffect === "function") {
                    await targetActor.toggleStatusEffect(statusId, options);
                }
            } else if (data.type === "deleteEffect") {
                const { actorUuid, effectId } = data;
                if (!actorUuid || !effectId) return;
                const doc = await fromUuid(actorUuid);
                const targetActor = doc?.actor || (doc instanceof Actor ? doc : null);
                if (targetActor) {
                    const effect = targetActor.effects.get(effectId);
                    if (effect) {
                        await effect.delete();
                    }
                }
            }
        } catch (err) {
            console.error("Lancer Standalone HUD | Error in GM socket handler:", err);
        }
    });
}

/**
 * Safely toggles a status effect on an actor, delegating to GM via socket if permission is lacking or if target is an unlinked ActorDelta.
 * @param {Actor} actor 
 * @param {string} statusId 
 * @param {object} [options] 
 */
export async function safeToggleStatusEffect(actor, statusId, options) {
    if (!actor || !statusId) return;

    const isUnlinkedTokenActor = actor.isToken || Boolean(actor.token) || actor.constructor.name === "ActorDelta" || actor.parent?.constructor?.name === "TokenDocument";
    const canModifyDirectly = game.user.isGM || (actor.canUserModify(game.user, "update") && !isUnlinkedTokenActor);

    if (canModifyDirectly) {
        try {
            return await actor.toggleStatusEffect(statusId, options);
        } catch (err) {
            console.warn("Lancer Standalone HUD | Direct toggleStatusEffect failed, delegating to GM socket:", err);
        }
    }

    const hasActiveGM = game.users.some(u => u.isGM && u.active);
    if (hasActiveGM) {
        const actorUuid = actor.uuid || (actor.token ? actor.token.uuid : null);
        if (actorUuid) {
            game.socket.emit("module.lancer-action-hud", {
                type: "toggleStatusEffect",
                actorUuid: actorUuid,
                statusId: statusId,
                options: options
            });
            return;
        }
    }

    // Fallback if no active GM is available
    try {
        return await actor.toggleStatusEffect(statusId, options);
    } catch (err) {
        console.error("Lancer Standalone HUD | Failed to toggle status effect without active GM:", err);
        ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.PermissionDeniedGM") || "You do not have permission to modify status effects on this token without an active GM.");
    }
}

/**
 * Safely deletes an effect from an actor, delegating to GM via socket if needed.
 * @param {Actor} actor 
 * @param {ActiveEffect} effect 
 */
export async function safeDeleteEffect(actor, effect) {
    if (!actor || !effect) return;

    const isUnlinkedTokenActor = actor.isToken || Boolean(actor.token) || actor.constructor.name === "ActorDelta" || actor.parent?.constructor?.name === "TokenDocument";
    const canModifyDirectly = game.user.isGM || (effect.canUserModify(game.user, "delete") && !isUnlinkedTokenActor);

    if (canModifyDirectly) {
        try {
            return await effect.delete();
        } catch (err) {
            console.warn("Lancer Standalone HUD | Direct effect.delete failed, delegating to GM socket:", err);
        }
    }

    const hasActiveGM = game.users.some(u => u.isGM && u.active);
    if (hasActiveGM) {
        const actorUuid = actor.uuid || (actor.token ? actor.token.uuid : null);
        if (actorUuid) {
            game.socket.emit("module.lancer-action-hud", {
                type: "deleteEffect",
                actorUuid: actorUuid,
                effectId: effect.id
            });
            return;
        }
    }

    try {
        return await effect.delete();
    } catch (err) {
        console.error("Lancer Standalone HUD | Failed to delete effect without active GM:", err);
        ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.PermissionDeniedGM") || "You do not have permission to modify status effects on this token without an active GM.");
    }
}
