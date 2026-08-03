/* scripts/utils.js */

/**
 * Singleton que guarda as instâncias ativas do HUD.
 * Usar objeto para manter referência mutável entre módulos.
 */
export const HUDState = {
    lancerHUD: null,
    deployableHUD: null
};

/**
 * Remove tags HTML de uma string
 */
export function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

/**
 * Retorna a instância do HUD ativa com base no token controlado
 */
export function getActiveHUD() {
    const controlledTokens = canvas.tokens?.controlled || [];
    const ownedToken = controlledTokens.find(t => t.actor && (t.actor.isOwner || game.user.isGM));
    if (ownedToken) {
        if (ownedToken.actor.type === "deployable") {
            return { instance: HUDState.deployableHUD, token: ownedToken, isDeployable: true };
        }
        return { instance: HUDState.lancerHUD, token: ownedToken, isDeployable: false };
    }
    if (HUDState.deployableHUD?.activeToken) {
        return { instance: HUDState.deployableHUD, token: HUDState.deployableHUD.activeToken, isDeployable: true };
    }
    return { instance: HUDState.lancerHUD, token: HUDState.lancerHUD?.activeToken, isDeployable: false };
}

/**
 * Atualiza o HUD ativo com base no token selecionado
 */
export function refreshHUD() {
    const { instance, token, isDeployable } = getActiveHUD();
    const otherInstance = isDeployable ? HUDState.lancerHUD : HUDState.deployableHUD;

    if (otherInstance && otherInstance.activeToken) {
        otherInstance.activeToken = null;
        otherInstance.close();
    }

    if (token) {
        if (instance && instance.activeToken?.id !== token.id) {
            instance.activeToken = token;
            if (game.settings.get("lancer-action-hud", "enableHUD")) {
                instance.render(true);
            }
        }
    } else {
        if (instance && instance.activeToken) {
            instance.activeToken = null;
            instance.close();
        }
    }
}

/**
 * Verifica se um item de arma é do tipo Superheavy
 * @param {Item} item
 * @returns {boolean}
 */
export function isSuperheavyWeapon(item) {
    if (!item) return false;
    const sys = item.system || {};
    const typeStr = (sys.weapon_type || sys.type || sys.mount || sys.size || sys.mount_type || "").toLowerCase();
    if (typeStr.includes("superheavy") || typeStr.includes("super heavy")) return true;

    if (Array.isArray(sys.tags)) {
        const hasTag = sys.tags.some(t => {
            const tagId = (typeof t === "string" ? t : (t.id || t.lid || t.name || "")).toLowerCase();
            return tagId.includes("superheavy") || tagId.includes("super_heavy");
        });
        if (hasTag) return true;
    }

    if (Array.isArray(sys.profiles)) {
        const hasSuperheavyProfile = sys.profiles.some(p => {
            const pType = (p.type || p.weapon_type || "").toLowerCase();
            return pType.includes("superheavy");
        });
        if (hasSuperheavyProfile) return true;
    }

    return false;
}
