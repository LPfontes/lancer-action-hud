/* scripts/init.js */
import { LancerSystemAdapter } from "./adapter/lancer-adapter.js";
import { LancerActionHUD } from "./hud/lancer-action-hud.js";
import { LancerDeployableHUD } from "./hud/lancer-deployable-hud.js";
import { HUDState, getActiveHUD, refreshHUD } from "./utils.js";
import { registerSocketListeners } from "./socket.js";

// Ready Hooks Initialization
Hooks.once("ready", () => {
    registerSocketListeners();
    const adapter = new LancerSystemAdapter();
    HUDState.lancerHUD = new LancerActionHUD(adapter);
    HUDState.deployableHUD = new LancerDeployableHUD();

    window.StylishAction = {
        useItem: async (itemId, event) => {
            const { instance } = getActiveHUD();
            if (instance && instance instanceof LancerActionHUD && instance.activeToken) {
                await instance.adapter.useItem(instance.activeToken.actor, itemId, event);
            }
        },
        closeHUD: () => {
            if (HUDState.lancerHUD) {
                HUDState.lancerHUD.activeToken = null;
                HUDState.lancerHUD.close();
            }
            if (HUDState.deployableHUD) {
                HUDState.deployableHUD.activeToken = null;
                HUDState.deployableHUD.close();
            }
        },
        toggleHUD: () => {
            const { instance } = getActiveHUD();
            if (instance && typeof instance.toggleHUD === "function") {
                instance.toggleHUD();
            } else if (HUDState.lancerHUD) {
                HUDState.lancerHUD.toggleHUD();
            }
        }
    };

    refreshHUD();
});
