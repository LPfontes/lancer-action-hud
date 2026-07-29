/* scripts/adapter/use-item.js */
import { getActiveHUD, HUDState, isSuperheavyWeapon } from "../utils.js";
import { safeToggleStatusEffect } from "../socket.js";

/**
 * Executa ações disparadas pelos botões do HUD.
 * @param {Actor} actor
 * @param {string} itemId
 * @param {Event|null} event
 */
export async function useItem(actor, itemId, event = null) {

    if (itemId.startsWith("tracker:")) {
        const actionType = itemId.split(":")[1];
        if (actionType === "reset") {
            await actor.setFlag('lancer-action-hud', 'actionTracker', {
                move: false, quick1: false, quick2: false, full: false, protocol: false, reaction: false, free: false, overcharge: false
            });
        } else {
            const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
            const newState = !current[actionType];
            current[actionType] = newState;

            if (newState === true) {
                if (actionType === 'quick1' || actionType === 'quick2') {
                    current.full = true;
                } else if (actionType === 'full') {
                    current.quick1 = true;
                    current.quick2 = true;
                }
            } else {
                if (actionType === 'full') {
                    current.quick1 = false;
                    current.quick2 = false;
                } else if (actionType === 'quick1' || actionType === 'quick2') {
                    if (!current.quick1 && !current.quick2) {
                        current.full = false;
                    }
                }
            }

            await actor.setFlag('lancer-action-hud', 'actionTracker', current);
        }
        return;
    }
    if (!actor) return;

    const deductAction = async (isFull = false) => {
        const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
        const updates = { ...current };
        if (isFull) {
            updates.full = true;
            updates.quick1 = true;
            updates.quick2 = true;
        } else {
            if (!updates.quick1) updates.quick1 = true;
            else if (!updates.quick2) updates.quick2 = true;

            updates.full = true;
        }
        await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
    };

    const setActionState = async (stateKey) => {
        const current = actor.getFlag('lancer-action-hud', 'actionTracker') || {};
        if (!current[stateKey]) {
            const updates = { ...current, [stateKey]: true };
            await actor.setFlag('lancer-action-hud', 'actionTracker', updates);
        }
    };

    if (itemId.startsWith("attack:")) {
        if (HUDState.lancerHUD) {
            HUDState.lancerHUD._hudVisible = false;
            HUDState.lancerHUD.minimize();
        }
        const id = itemId.replace("attack:", "");
        const item = actor.items.get(id);
        if (item) {
            const isSuperheavy = isSuperheavyWeapon(item);
            await deductAction(isSuperheavy);
            return item.beginWeaponAttackFlow();
        }
    }
    if (itemId.startsWith("damage:")) {
        if (HUDState.lancerHUD) {
            HUDState.lancerHUD._hudVisible = false;
            HUDState.lancerHUD.minimize();
        }
        const id = itemId.replace("damage:", "");
        const item = actor.items.get(id);
        if (item) return item.beginDamageFlow();
    }
    if (itemId.startsWith("tech:")) {
        if (HUDState.lancerHUD) {
            HUDState.lancerHUD._hudVisible = false;
            HUDState.lancerHUD.minimize();
        }
        const id = itemId.replace("tech:", "");
        if (id === "invade") {
            await deductAction();
            if (typeof actor.beginTechAttackFlow === "function") {
                return actor.beginTechAttackFlow();
            } else if (typeof actor.beginStatFlow === "function") {
                return actor.beginStatFlow("system.tech_attack");
            }
        }
        const item = actor.items.get(id);
        if (item) {
            await deductAction();
            return item.beginTechAttackFlow();
        }
    }
    if (itemId.startsWith("core-active:")) {
        const id = itemId.replace("core-active:", "");
        const item = actor.items.get(id);

        // Tenta disparar o fluxo nativo do Lancer
        if (typeof actor.beginCoreActiveFlow === "function") {
            return actor.beginCoreActiveFlow();
        }

        const CoreActiveFlow = game.lancer?.CoreActiveFlow || CONFIG?.LANCER?.flows?.CoreActiveFlow;
        if (CoreActiveFlow) {
            const flow = new CoreActiveFlow(actor);
            return flow.begin();
        }

        if (item) {
            if (typeof item.beginCoreActiveFlow === "function") return item.beginCoreActiveFlow();
        }
    }
    if (itemId.startsWith("activate:")) {
        const id = itemId.replace("activate:", "");
        let item = actor.items.get(id);
        if (!item && actor.type === "mech") {
            let pilotActor = actor.system.pilot?.value;
            if (!pilotActor) {
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
            if (pilotActor) {
                item = pilotActor.items.get(id);
            }
        }

        if (item) {
            if (item.type === "talent" && item.system?.ranks) {
                const currRank = item.system.curr_rank || item.system.ranks.length;
                let ranksContent = "";
                item.system.ranks.slice(0, currRank).forEach((r, idx) => {
                    const rNum = idx + 1;
                    const rName = r.name || `Rank ${rNum}`;
                    const rDesc = r.description || r.desc || r.text || "";
                    ranksContent += `
                        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.15);">
                            <div style="font-weight:bold;">Rank ${rNum}: ${rName}</div>
                            <div style="font-size:0.9em; margin-top:4px; opacity:0.9;">${rDesc}</div>
                        </div>
                    `;
                });
                const content = `
                    <div class="card clipped-bot" style="margin:0px">
                      <div class="lancer-header lancer-system" style="background: rgba(128, 41, 50, 0.9) !important;">
                        // TALENT :: ${item.name.toUpperCase()} //
                      </div>
                      <div class="effect-text">
                        ${ranksContent || item.system?.description || ""}
                      </div>
                    </div>
                `;
                const speaker = ChatMessage.getSpeaker({ actor: actor });
                return ChatMessage.create({
                    user: game.user.id,
                    speaker: speaker,
                    content: content
                });
            }

            const tagsList = [];

            // 1. Processa Danos
            if (item.system?.damage) {
                const damages = Array.isArray(item.system.damage) ? item.system.damage : [item.system.damage];
                damages.forEach(d => {
                    if (d && (d.val !== undefined || d.value !== undefined)) {
                        const val = d.val ?? d.value;
                        tagsList.push(`<span class="lancer-tag damage-tag">${val} ${d.type || ''}</span>`);
                    }
                });
            }

            // 2. Processa Alcances
            if (item.system?.range) {
                const ranges = Array.isArray(item.system.range) ? item.system.range : [item.system.range];
                ranges.forEach(r => {
                    if (r && (r.val !== undefined || r.value !== undefined || r.type)) {
                        const val = r.val ?? r.value ?? '';
                        tagsList.push(`<span class="lancer-tag range-tag">${r.type || 'Range'}: ${val}</span>`);
                    }
                });
            }

            // 3. Processa Tags do Sistema
            if (item.system?.tags) {
                const wTags = Array.isArray(item.system.tags) ? item.system.tags : [item.system.tags];
                wTags.forEach(t => {
                    if (!t) return;
                    let rawId = typeof t === "string" ? t : (t.id || t.lid || t.name || "");
                    let val = typeof t === "object" ? (t.val !== undefined ? t.val : t.value) : null;

                    if (rawId) {
                        const cleanId = rawId.replace(/^tg_/, "");
                        const capId = typeof cleanId.capitalize === "function" ? cleanId.capitalize() : (cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
                        const nameKey = `LANCER.Tag${capId}`;
                        let lbl = game.i18n.has(nameKey) ? game.i18n.localize(nameKey) : capId;
                        if (val !== undefined && val !== null && val !== "") lbl = `${lbl} ${val}`;
                        tagsList.push(`<span class="lancer-tag">${lbl}</span>`);
                    }
                });
            }

            const tagsHtml = tagsList.length ? `<div class="lancer-tags" style="margin-top:4px; margin-bottom:8px;">${tagsList.join('')}</div>` : "";

            // 4. Texto Principal (Effect com fallback para Description)
            const mainText = item.system?.effect || item.system?.description || "";

            // 5. Mapeia Ações e Injeta Botões Interativos no Card
            let actionsHtml = "";
            if (item.system?.actions && Array.isArray(item.system.actions) && item.system.actions.length > 0) {
                const actionBlocks = item.system.actions.map((act, index) => {
                    const actType = act.activation ? act.activation.toUpperCase() : "USAR";
                    const actName = act.name ? `<strong>${act.name}</strong>` : `Ação ${index + 1}`;

                    const rawTooltip = act.detail || act.name || 'Executar Ação';
                    const safeTooltip = rawTooltip.replace(/"/g, '&quot;');

                    return `
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <div>${actName}</div>
                                <button type="button" class="pf2e-map-btn lancer-chat-action-btn" 
                                        style="background: rgba(88,180,52,0.1); border-color: rgba(88,180,52,0.3); color: #58b434; font-size: 0.8em; padding: 2px 8px; width: auto; cursor: pointer;" 
                                        data-action="system-action:${item.id}:${index}"
                                        data-actor-id="${actor.id}"
                                        data-tooltip="${safeTooltip}">
                                    <i class="fas fa-play" style="font-size:0.8em; margin-right:4px;"></i>${actType}
                                </button>
                            </div>
                            <div style="font-size: 0.9em; opacity: 0.85; line-height: 1.3;">${act.detail || ""}</div>
                        </div>
                    `;
                }).join("");

                actionsHtml = `<div class="lancer-actions-block" style="margin-top: 8px;">${actionBlocks}</div>`;
            }

            // 6. Template Final do Card no Chat
            const content = `
                <div class="card clipped-bot" style="margin:0px">
                  <div class="lancer-header lancer-system">
                    // SYSTEM :: ${item.name} //
                  </div>
                  <div class="effect-text">
                    ${tagsHtml}
                    ${mainText ? `<div style="margin-bottom:6px;">${mainText}</div>` : ""}
                    ${actionsHtml}
                  </div>
                </div>
            `;

            const speaker = ChatMessage.getSpeaker({ actor: actor });

            return ChatMessage.create({
                user: game.user.id,
                speaker: speaker,
                content: content
            });
        }
    }
    if (itemId.startsWith("deploy:")) {
        if (HUDState.lancerHUD) {
            HUDState.lancerHUD._hudVisible = false;
            HUDState.lancerHUD.minimize();
        }
        const id = itemId.replace("deploy:", "");
        const item = actor.items.get(id);
        if (item) {
            let deployableId = item.system.deployables?.[0];
            let deployableActor = game.actors.find(a =>
                (deployableId && a.system?.lid === deployableId) ||
                (a.name.toLowerCase() === item.name.toLowerCase())
            );

            if (!deployableActor) {
                // Try fuzzy name match in game.actors
                deployableActor = game.actors.find(a =>
                    a.name.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(a.name.toLowerCase())
                );
            }

            if (!deployableActor) {
                // Search in compendiums asynchronously
                for (let pack of game.packs.filter(p => p.metadata.type === "Actor")) {
                    try {
                        const index = await pack.getIndex();
                        const entry = index.find(e =>
                            (deployableId && e.name === deployableId) ||
                            (e.name.toLowerCase() === item.name.toLowerCase()) ||
                            (e.name.toLowerCase().includes(item.name.toLowerCase()))
                        );
                        if (entry) {
                            const doc = await pack.getDocument(entry._id);
                            deployableActor = await Actor.create(doc.toObject());
                            break;
                        }
                    } catch (e) {
                        console.error("Lancer Standalone HUD | Error searching compendium pack:", pack.name, e);
                    }
                }
            }

            if (deployableActor) {
                const viewElement = canvas.app.canvas || canvas.app.view;
                if (viewElement) {
                    viewElement.style.cursor = "crosshair";
                    ui.notifications.info(game.i18n.format("STYLISH_HUD.Deploy.Prompt", { name: deployableActor.name }));

                    const getSnappedPosition = (x, y) => {
                        let snapped = null;
                        if (canvas.grid.getSnappedPoint) {
                            try {
                                // Try snapping with default center mode (1 / CENTER)
                                snapped = canvas.grid.getSnappedPoint({ x, y }, { mode: 1 });
                            } catch (e) {
                                console.warn("Lancer Standalone HUD | getSnappedPoint failed:", e);
                            }
                        }
                        if (snapped && typeof snapped.x === "number" && typeof snapped.y === "number") {
                            return snapped;
                        }
                        if (canvas.grid.getSnappedPosition) {
                            try {
                                const res = canvas.grid.getSnappedPosition(x, y);
                                if (res) {
                                    if (typeof res.x === "number" && typeof res.y === "number") return res;
                                    if (Array.isArray(res)) return { x: res[0], y: res[1] };
                                }
                            } catch (e) {
                                console.warn("Lancer Standalone HUD | getSnappedPosition failed:", e);
                            }
                        }
                        if (canvas.grid.getCenter) {
                            try {
                                const res = canvas.grid.getCenter(x, y);
                                if (res) {
                                    if (typeof res.x === "number" && typeof res.y === "number") return res;
                                    if (Array.isArray(res)) return { x: res[0], y: res[1] };
                                }
                            } catch (e) {
                                console.warn("Lancer Standalone HUD | getCenter failed:", e);
                            }
                        }
                        return { x, y };
                    };

                    // Cleanup function for listeners
                    const cleanup = () => {
                        $(viewElement).off("click.deploy");
                        $(viewElement).off("contextmenu.deploy");
                        $(document).off("keydown.deploy");
                        viewElement.style.cursor = "default";
                    };

                    // 1. ESC key listener to cancel
                    $(document).on("keydown.deploy", (e) => {
                        if (e.key === "Escape") {
                            cleanup();
                            ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Deploy.Cancelled"));
                        }
                    });

                    // 2. Right-click listener to cancel
                    $(viewElement).on("contextmenu.deploy", (e) => {
                        e.preventDefault();
                        cleanup();
                        ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Deploy.Cancelled"));
                    });

                    // 3. Click on canvas to spawn
                    $(viewElement).on("click.deploy", async (e) => {
                        e.preventDefault();
                        cleanup();

                        const clickedPos = canvas.mousePosition;
                        const snapped = getSnappedPosition(clickedPos.x, clickedPos.y);

                        try {
                            let tokenData = await deployableActor.getTokenDocument({ x: snapped.x, y: snapped.y });
                            if (typeof tokenData.toObject === "function") {
                                tokenData = tokenData.toObject();
                            }
                            tokenData.x = snapped.x;
                            tokenData.y = snapped.y;

                            const spawnedTokens = await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);
                            if (spawnedTokens && spawnedTokens.length > 0) {
                                ui.notifications.info(game.i18n.format("STYLISH_HUD.Deploy.Success", { name: deployableActor.name }));

                                // Chat card log
                                const content = `
                                    <div class="card clipped-bot" style="margin:0px">
                                      <div class="lancer-header lancer-system" style="background:#58b434 !important;">
                                        // DEPLOYED :: ${item.name} //
                                      </div>
                                      <div class="effect-text">
                                        <strong>${deployableActor.name}</strong> foi posicionado no campo de batalha.<br><br>
                                        ${item.system.effect}
                                        ${item.system.actions}
                                        ${item.system.tags}
                                      </div>
                                    </div>
                                `;
                                const speaker = ChatMessage.getSpeaker({ actor: actor });
                                await ChatMessage.create({
                                    user: game.user.id,
                                    speaker: speaker,
                                    content: content
                                });
                            }
                        } catch (err) {
                            console.error("Lancer Standalone HUD | Error spawning deployable token:", err);
                            ui.notifications.error(`Erro ao criar o token de ${deployableActor.name}: ${err.message}`);
                        }
                    });
                    return;
                }
            }

            // Fallback to notification and chat card if actor not found
            ui.notifications.warn(game.i18n.format("STYLISH_HUD.Deploy.NotFound", { name: item.name }));
            ui.notifications.info(game.i18n.localize("STYLISH_HUD.Deploy.ChatFallback"));
            const content = `
                <div class="card clipped-bot" style="margin:0px">
                  <div class="lancer-header lancer-system" style="background:#58b434 !important;">
                    // DEPLOYING :: ${item.name} //
                  </div>
                  <div class="effect-text">
                    <strong>Deployable(s):</strong> ${item.system.deployables?.join(", ") || item.name}<br><br>
                    ${item.system.effect}
                    ${item.system.actions}
                    ${item.system.tags}
                  </div>
                </div>
            `;
            const speaker = ChatMessage.getSpeaker({ actor: actor });
            return ChatMessage.create({
                user: game.user.id,
                speaker: speaker,
                content: content
            });
        }
    }
    if (itemId.startsWith("util:")) {
        const action = itemId.replace("util:", "");
        if (action === "overcharge") {
            await setActionState('overcharge');
            return actor.beginOverchargeFlow();
        }
        if (action === "stabilize") return actor.beginStabilizeFlow();
        if (action === "full-repair") return actor.beginFullRepairFlow();
    }
    if (itemId.startsWith("basic:")) {
        const action = itemId.replace("basic:", "");
        let name = "";
        let desc = "";
        let icon = "";
        let tagsHtml = "";

        if (action === "brace" || action === "overwatch") {
            await setActionState("reaction");
        } else if (action === "invade" || action === "lockon" || action === "bolster") {
            await deductAction();
        }


        if (action === "invade") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Invade.Name");
            icon = "hacker.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag damage-tag">2 Heat</span><span class="lancer-tag range-tag">Sensors</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Invade.Desc");
        } else if (action === "lockon") {
            const targets = game.user.targets;
            if (targets.size > 0) {
                for (let target of targets) {
                    if (target.actor) {
                        await safeToggleStatusEffect(target.actor, "lockon", { active: true });
                    }
                }
            } else {
                ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget") || "You must target at least one token first.");
            }

            name = game.i18n.localize("STYLISH_HUD.Basic.LockOn.Name");
            icon = "spotter.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">Sensors</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.LockOn.Desc");
        } else if (action === "bolster") {
            const targets = game.user.targets;
            if (targets.size > 0) {
                for (let target of targets) {
                    if (target.actor) {
                        await safeToggleStatusEffect(target.actor, "bolster", { active: true });
                    }
                }
            } else {
                ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget") || "You must target at least one token first.");
            }

            name = game.i18n.localize("STYLISH_HUD.Basic.Bolster.Name");
            icon = "leader.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">Sensors</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Bolster.Desc");
        } else if (action === "brace") {
            if (actor) {
                await safeToggleStatusEffect(actor, "brace", { active: true });
            }
            name = game.i18n.localize("STYLISH_HUD.Basic.Brace.Name");
            icon = "hull.svg";
            desc = game.i18n.localize("STYLISH_HUD.Basic.Brace.Desc");
        } else if (action === "overwatch") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Name");
            icon = "vanguard.svg";
            desc = game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Desc");
        }

        const content = `
            <div class="card clipped-bot" style="margin:0px">
                <div class="lancer-header lancer-system" style="background:#1e1e1e !important; border-bottom: 2px solid #58b434;">
                    <img src="systems/lancer/assets/icons/skills/${icon}" style="width:24px; height:24px; margin-right:8px; vertical-align:middle; filter:invert(1) sepia(1) saturate(5) hue-rotate(50deg);">
                    <span style="vertical-align:middle;">// ${name.toUpperCase()} //</span>
                </div>
                <div class="effect-text">
                    ${tagsHtml}
                    ${desc}
                </div>
            </div>
        `;
        return ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: content
        });
    }
    if (itemId.startsWith("test:")) {
        const action = itemId.replace("test:", "");
        if (action === "stress-damage") {
            if (HUDState.lancerHUD) await HUDState.lancerHUD._showStructStressDialog(actor, "stress");
            return;
        }
        if (action === "structure-damage") {
            if (HUDState.lancerHUD) await HUDState.lancerHUD._showStructStressDialog(actor, "structure");
            return;
        }
    }
    if (itemId.startsWith("status:")) {
        const statusId = itemId.replace("status:", "");

        // Alterna o status no ator e aguarda a conclusão
        await safeToggleStatusEffect(actor, statusId);

        // Re-renderiza o HUD mantendo a aba e a posição atual
        const { instance } = getActiveHUD();
        if (instance) {
            instance.render(false);
        }
        return;
    }
    if (itemId.startsWith("target-status:")) {
        const statusId = itemId.replace("target-status:", "");
        const targets = game.user.targets;
        if (targets.size === 0) {
            ui.notifications.warn(game.i18n.localize("STYLISH_HUD.Warning.NoTarget"));
            return;
        }
        for (let target of targets) {
            const targetActor = target.actor;
            if (targetActor) {
                await safeToggleStatusEffect(targetActor, statusId);
            }
        }
        return;
    }
    if (itemId.startsWith("change-profile:")) {
        const parts = itemId.split(":");
        const weaponId = parts[1];
        const idx = parseInt(parts[2]);
        const item = actor.items.get(weaponId);
        if (item && !isNaN(idx)) {
            await item.update({ "system.selected_profile_index": idx });
            if (HUDState.lancerHUD) HUDState.lancerHUD.render(false);
        }
        return;
    }
    if (itemId.startsWith("system-action:")) {
        const parts = itemId.split(":");
        const id = parts[1];
        const idx = parts[2];
        const item = actor.items.get(id);
        if (item && typeof item.beginActivationFlow === "function") {
            const act = item.system?.actions?.[idx];
            if (act) {
                const actType = (act.activation || "").toLowerCase();
                if (actType.includes("full")) await deductAction(true);
                else if (actType.includes("quick") || actType.includes("reaction")) await deductAction(false);

                if (actType.includes("reaction")) {
                    await setActionState("reaction");
                }
            }
            return item.beginActivationFlow(`system.actions.${idx}`);
        }
    }
    if (itemId.startsWith("talent-rank-action:")) {
        const parts = itemId.split(":");
        const talentId = parts[1];
        const rankIdx = parseInt(parts[2]);
        const actionIdx = parseInt(parts[3]);

        let targetActor = actor;
        if (actor.type === "mech") {
            const pilotActorObj = actor.system.pilot?.value;
            if (pilotActorObj) {
                targetActor = pilotActorObj;
            } else {
                const pilotId = actor.system.pilot?.id || actor.system.pilot_id || actor.system.pilot;
                if (pilotId && typeof pilotId === "string") {
                    const pilotActor = game.actors.get(pilotId);
                    if (pilotActor) targetActor = pilotActor;
                }
            }
        }

        const item = targetActor.items.get(talentId);
        if (item && !isNaN(rankIdx) && !isNaN(actionIdx) && typeof item.beginActivationFlow === "function") {
            return item.beginActivationFlow(`system.ranks.${rankIdx}.actions.${actionIdx}`);
        }
        return;
    }
    if (itemId.startsWith("destroy-toggle:")) {
        const id = itemId.replace("destroy-toggle:", "");
        const item = actor.items.get(id);
        if (item) {
            const current = item.system?.destroyed || false;
            await item.update({ "system.destroyed": !current });
            if (HUDState.lancerHUD) HUDState.lancerHUD.render(false);
        }
        return;
    }

    if (itemId.startsWith("stats-roll:")) {
        const stat = itemId.replace("stats-roll:", "");
        const path = `system.${stat}`;
        return actor.beginStatFlow(path);
    }
}
