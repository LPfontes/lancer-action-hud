/* scripts/hud/lancer-item-popup.js */

/**
 * Popup Application that displays item details extracted from the HUD row.
 */
export class LancerItemPopup extends Application {
    constructor(itemData, options = {}) {
        super(options);
        this.itemData = itemData;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "lancer-item-popup",
            template: "modules/lancer-action-hud/templates/popup.html",
            popOut: true,
            minimizable: true,
            resizable: true,
            width: 500,
            height: "fit-content"
        });
    }

    getData() {
        return this.itemData;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".la-popup-header").click(function () {
            const body = $(this).siblings(".la-popup-body");
            const icon = $(this).find(".la-popup-toggle-icon");
            body.toggleClass("collapsed");
            icon.toggleClass("fa-chevron-up fa-chevron-down");
        });

        html.find(".activation-flow").click(function (event) {
            event.stopPropagation();
            const el = $(this);
            const talentId = el.data("talent-id");
            const rankIndex = el.data("rank-index");
            const actionIndex = el.data("action-index");
            if (talentId !== undefined && rankIndex !== undefined && actionIndex !== undefined) {
                StylishAction.useItem(`talent-rank-action:${talentId}:${rankIndex}:${actionIndex}`);
            }
        });
    }
}
