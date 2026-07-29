/* scripts/adapter/item-tags.js */

/**
 * Extrai e normaliza tags de um item do Lancer.
 * Usado por strike, tech, system e implementos.
 * @param {Item} w - O item do Foundry VTT
 * @returns {Array} Lista de objetos { label, class, tooltip }
 */
export function getItemTags(w) {
    const tags = [];
    if (!w || !w.system) return tags;

    const extractFromSource = (source) => {
        if (!source) return;

        // 1. System tags
        const tagsField = source.all_tags || source.tags;
        if (tagsField) {
            const wTags = Array.isArray(tagsField) ? tagsField : [tagsField];
            wTags.forEach(t => {
                if (!t) return;
                let id = "";
                let val = null;
                let customTooltip = "";
                if (typeof t === "string") {
                    id = t;
                } else if (typeof t === "object") {
                    id = t.id || t.name || "";
                    val = t.val !== undefined ? t.val : t.value;
                    customTooltip = t.description || t.desc || "";
                }
                if (id) {
                    const capId = typeof id.capitalize === "function" ? id.capitalize() : (id.charAt(0).toUpperCase() + id.slice(1));
                    const nameKey = `LANCER.Tag${capId}`;
                    const descKey = `LANCER.Tag${capId}Desc`;

                    let label = game.i18n.has(nameKey) ? game.i18n.localize(nameKey) : id;
                    if (val !== undefined && val !== null) {
                        if (label.includes("{VAL}")) {
                            label = label.replace(/\{VAL\}/g, val);
                        } else {
                            label = `${label} ${val}`;
                        }
                    }

                    let tooltip = customTooltip;
                    if (!tooltip && game.i18n.has(descKey)) {
                        tooltip = game.i18n.localize(descKey);
                    }

                    if (!tags.some(existing => existing.label === label)) {
                        tags.push({
                            label: label,
                            class: "tag-system",
                            tooltip: tooltip
                        });
                    }
                }
            });
        }
    };

    // Extract from main system object
    extractFromSource(w.system);

    // Also extract from profiles if they exist (standard for Lancer weapons)
    if (w.system.profiles && Array.isArray(w.system.profiles)) {
        w.system.profiles.forEach(profile => {
            extractFromSource(profile);
        });
    }

    return tags;
}
