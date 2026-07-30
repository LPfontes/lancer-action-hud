/* scripts/main.js — entry point */

// Foundry VTT Lancer Action HUD
// Este arquivo é o ponto de entrada do módulo.
// Toda a lógica está distribuída nos módulos abaixo.

import { LancerSystemAdapter } from "./adapter/lancer-adapter.js";
import { LancerActionHUD } from "./hud/lancer-action-hud.js";
import { LancerItemPopup } from "./hud/lancer-item-popup.js";
import { LancerDeployableHUD } from "./hud/lancer-deployable-hud.js";
import { HUDState, getActiveHUD, refreshHUD, stripHtml } from "./utils.js";
import { safeToggleStatusEffect, safeDeleteEffect, safeApplyHeat } from "./socket.js";
import "./hooks.js";
import "./init.js";

// Re-export para uso externo caso necessário
export {
    LancerSystemAdapter,
    LancerActionHUD,
    LancerItemPopup,
    LancerDeployableHUD,
    HUDState,
    getActiveHUD,
    refreshHUD,
    stripHtml,
    safeToggleStatusEffect,
    safeDeleteEffect,
    safeApplyHeat
};
