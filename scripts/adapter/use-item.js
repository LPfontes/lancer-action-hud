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

    if (itemId.startsWith("counter-delta:") || itemId.startsWith("counter-set:") || itemId.startsWith("counter-reset:")) {
        let targetActor = actor;
        if (actor.type === "mech") {
            const pilotActorObj = actor.system.pilot?.value;
            if (pilotActorObj) targetActor = pilotActorObj;
            else {
                const pilotId = actor.system.pilot?.id || actor.system.pilot_id || actor.system.pilot;
                if (pilotId && typeof pilotId === "string") {
                    const pilotActor = game.actors.get(pilotId);
                    if (pilotActor) targetActor = pilotActor;
                }
            }
        }

        const parts = itemId.split(":");
        const action = parts[0];
        const talentItemId = parts[1];
        const counterId = parts[2];

        const item = targetActor.items.get(talentItemId) || targetActor.items.find(i => i.id === talentItemId);
        let min = 0;
        let max = 99;
        let defaultVal = 0;

        const defaultsMap = {
            ctr_brawler: { default: 6, min: 1, max: 6 },
            ctr_brutal: { default: 0, min: 0, max: 6 },
            ctr_duelist: { default: 0, min: 0, max: 3 },
            ctr_gunslinger: { default: 6, min: 1, max: 6 },
            ctr_leader: { default: 3, min: 0, max: 6 },
            ctr_stormbringer: { default: 6, min: 1, max: 6 }
        };

        const normTarget = counterId.toLowerCase().replace(/_die$/, "").replace(/^ctr_/, "");
        const matchedDefaultKey = Object.keys(defaultsMap).find(k => k === counterId || k.replace(/^ctr_/, "") === normTarget);
        if (matchedDefaultKey) {
            defaultVal = defaultsMap[matchedDefaultKey].default;
            min = defaultsMap[matchedDefaultKey].min;
            max = defaultsMap[matchedDefaultKey].max;
            if (item && item.system.curr_rank >= 3 && matchedDefaultKey === "ctr_leader") {
                defaultVal = 6;
            }
        }

        if (item && item.system?.counters) {
            const sysCounters = Array.isArray(item.system.counters)
                ? item.system.counters
                : Object.values(item.system.counters);
            const match = sysCounters.find(c => {
                if (!c) return false;
                const cId = c.id || `ctr_${(c.name || '').toLowerCase().replace(/\s+/g, '_')}`;
                const normC = cId.toLowerCase().replace(/_die$/, "").replace(/^ctr_/, "");
                return c.id === counterId || c.name === counterId || normC === normTarget;
            });
            if (match) {
                if (match.min !== undefined) min = match.min;
                if (match.max !== undefined) max = match.max;
                defaultVal = match.default_value ?? match.val ?? match.value ?? defaultVal;
            }
        }

        const currentFlagVal = item?.getFlag("lancer-action-hud", `counter_${counterId}`)
            ?? item?.getFlag("lancer-action-hud", `counter_ctr_${normTarget}`)
            ?? targetActor.getFlag("lancer-action-hud", `counter_${counterId}`)
            ?? targetActor.getFlag("lancer-action-hud", `counter_ctr_${normTarget}`)
            ?? actor.getFlag("lancer-action-hud", `counter_${counterId}`);
        const currentVal = currentFlagVal !== undefined ? Number(currentFlagVal) : defaultVal;

        let newVal = currentVal;
        if (action === "counter-delta") {
            const delta = parseInt(parts[3], 10) || 0;
            newVal = Math.clamp(currentVal + delta, min, max);
        } else if (action === "counter-set") {
            const val = parseInt(parts[3], 10);
            if (!isNaN(val)) newVal = Math.clamp(val, min, max);
        } else if (action === "counter-reset") {
            newVal = defaultVal;
        }

        if (item) {
            await item.setFlag("lancer-action-hud", `counter_${counterId}`, newVal);
            await item.setFlag("lancer-action-hud", `counter_ctr_${normTarget}`, newVal);
            if (item.system.counters) {
                if (Array.isArray(item.system.counters)) {
                    const countersCopy = foundry.utils.deepClone(item.system.counters);
                    const idx = countersCopy.findIndex(c => {
                        if (!c) return false;
                        const cId = c.id || `ctr_${(c.name || '').toLowerCase().replace(/\s+/g, '_')}`;
                        const normC = cId.toLowerCase().replace(/_die$/, "").replace(/^ctr_/, "");
                        return c.id === counterId || c.name === counterId || normC === normTarget;
                    });
                    if (idx >= 0) {
                        countersCopy[idx].val = newVal;
                        countersCopy[idx].value = newVal;
                        await item.update({ "system.counters": countersCopy });
                    }
                }
            }
        }
        await targetActor.setFlag("lancer-action-hud", `counter_${counterId}`, newVal);
        await targetActor.setFlag("lancer-action-hud", `counter_ctr_${normTarget}`, newVal);
        if (actor !== targetActor) {
            await actor.setFlag("lancer-action-hud", `counter_${counterId}`, newVal);
            await actor.setFlag("lancer-action-hud", `counter_ctr_${normTarget}`, newVal);
        }

        const { instance } = getActiveHUD();
        if (instance) {
            instance.render(false);
        }
        return;
    }



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

    if (itemId.startsWith("roll:")) {
        if (HUDState.lancerHUD) {
            HUDState.lancerHUD._hudVisible = false;
            HUDState.lancerHUD.minimize();
        }
        const action = itemId.replace("roll:", "");
        if (action === "ram") {
            await deductAction(false);
            const BasicAttackFlow = game.lancer?.flows?.get("BasicAttackFlow") || CONFIG?.LANCER?.flows?.BasicAttackFlow;
            if (BasicAttackFlow) {
                const flow = new BasicAttackFlow(actor, { action: "ram" });
                return flow.begin(Array.from(game.user.targets));
            } else if (typeof actor.beginBasicAttackFlow === "function") {
                return actor.beginBasicAttackFlow({ action: "ram" });
            } else if (typeof actor.beginStatFlow === "function") {
                return actor.beginStatFlow("system.hull");
            }
        }
        if (action === "grapple") {
            await deductAction(false);
            const BasicAttackFlow = game.lancer?.flows?.get("BasicAttackFlow") || CONFIG?.LANCER?.flows?.BasicAttackFlow;
            if (BasicAttackFlow) {
                const flow = new BasicAttackFlow(actor, { action: "grapple" });
                return flow.begin(Array.from(game.user.targets));
            } else if (typeof actor.beginBasicAttackFlow === "function") {
                return actor.beginBasicAttackFlow({ action: "grapple" });
            } else if (typeof actor.beginStatFlow === "function") {
                return actor.beginStatFlow("system.hull");
            }
        }
        if (action === "search") {
            await deductAction(false);
            if (typeof actor.beginStatFlow === "function") {
                return actor.beginStatFlow("system.systems");
            }
        }
    }

    if (itemId.startsWith("attack:")) {
        if (HUDState.lancerHUD) {
            HUDState.lancerHUD._hudVisible = false;
            HUDState.lancerHUD.minimize();
        }
        const id = itemId.replace("attack:", "");
        if (id === "improvised" || id === "basic-improvised") {
            await deductAction(true);
            const BasicAttackFlow = game.lancer?.flows?.get("BasicAttackFlow") || CONFIG?.LANCER?.flows?.BasicAttackFlow;
            if (BasicAttackFlow) {
                const flow = new BasicAttackFlow(actor, { action: "improvised" });
                return flow.begin(Array.from(game.user.targets));
            } else if (typeof actor.beginBasicAttackFlow === "function") {
                return actor.beginBasicAttackFlow({ action: "improvised" });
            } else if (typeof actor.beginStatFlow === "function") {
                return actor.beginStatFlow("system.grit");
            }
        }
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
                    ${tagsHtml}</br>
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

        const fullActions = ["barrage", "disengage", "stabilize", "full-tech", "boot-up", "skill-check", "dismount", "full-activation"];
        const reactions = ["brace", "overwatch"];

        if (reactions.includes(action)) {
            await setActionState("reaction");
        } else if (fullActions.includes(action)) {
            await deductAction(true);
        } else {
            await deductAction(false);
        }


        let applyButtonHtml = "";
        const targetUuids = Array.from(game.user.targets).map(t => t.actor?.uuid || t.document?.uuid).filter(Boolean);

        const quickActionTag = game.i18n.localize("STYLISH_HUD.Tags.QuickAction") || "Quick Action";
        const fullActionTag = game.i18n.localize("STYLISH_HUD.Tags.FullAction") || "Full Action";
        const quickTechTag = game.i18n.localize("STYLISH_HUD.Tags.QuickTech") || "Quick Tech";
        const fullTechTag = game.i18n.localize("STYLISH_HUD.Tags.FullTech") || "Full Tech";
        const meleeTag = game.i18n.localize("STYLISH_HUD.Tags.Melee") || "Melee";
        const sensorsTag = game.i18n.localize("STYLISH_HUD.Tags.Sensors") || "Sensors";
        const heatTag = game.i18n.format("STYLISH_HUD.Tags.Heat", { amount: 2 }) || "2 Heat";
        const kineticTag = game.i18n.format("STYLISH_HUD.Tags.Kinetic", { damage: "1d6" }) || "1d6 Kinetic";
        const threatTag = game.i18n.format("STYLISH_HUD.Tags.Threat", { amount: 1 }) || "Threat 1";

        const applyHeatBtnText = game.i18n.format("STYLISH_HUD.ChatButtons.ApplyHeat", { amount: 2 });
        const applyFragSignalBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ApplyFragmentSignal");
        const impairedStatusText = game.i18n.localize("STYLISH_HUD.Status.Impaired") || "Impaired";
        const slowedStatusText = game.i18n.localize("STYLISH_HUD.Status.Slowed") || "Slowed";
        const applyLockOnBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ApplyLockOn");
        const applyBolsterBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ApplyBolster");
        const applyBraceBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ApplyBrace");
        const rollImprovisedBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.RollImprovisedAttack");
        const applyHiddenBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ApplyHidden");
        const rollSearchBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.RollSearch");
        const rollRamBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.RollRam");
        const applyProneBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ApplyProne");
        const rollGrappleBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.RollGrapple");
        const applyGrappleBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ApplyGrapple");
        const shutDownBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.ShutDown");
        const overchargeBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.Overcharge");
        const stabilizeBtnText = game.i18n.localize("STYLISH_HUD.ChatButtons.Stabilize");

        if (action === "invade") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Invade.Name");
            icon = "hacker.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag damage-tag">${heatTag}</span><span class="lancer-tag range-tag">${sensorsTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Invade.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); display: flex; flex-direction: column; gap: 4px;">
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-heat-btn" data-heat="2" data-targets="${targetUuids.join(',')}" style="background: rgba(255,100,0,0.15); border: 1px solid #ff6400; color: #ff9d00; padding: 4px 8px; font-size: 0.8em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-fire"></i> ${applyHeatBtnText}
                    </button>
                    <div style="font-size: 0.75em; font-weight: bold; color: #58b434; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">// FRAGMENT SIGNAL //</div>
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="impaired,slowed" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 8px; font-size: 0.8em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-bolt"></i> ${applyFragSignalBtnText}
                    </button>
                    <div style="display: flex; gap: 4px; width: 100%;">
                        <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="impaired" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.1); border: 1px solid rgba(88,180,52,0.5); color: #58b434; padding: 3px 6px; font-size: 0.75em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex: 1;">
                            <i class="fas fa-biohazard"></i> ${impairedStatusText}
                        </button>
                        <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="slowed" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.1); border: 1px solid rgba(88,180,52,0.5); color: #58b434; padding: 3px 6px; font-size: 0.75em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex: 1;">
                            <i class="fas fa-hourglass-half"></i> ${slowedStatusText}
                        </button>
                    </div>
                </div>
            `;
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
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${sensorsTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.LockOn.Desc");

            let spotterScanHtml = "";
            if (targets.size > 0) {
                for (let target of targets) {
                    if (!target.actor) continue;
                    const sys = target.actor.system || {};

                    const hpVal = sys.hp?.value ?? sys.hp ?? "N/A";
                    const hpMax = sys.hp?.max ?? "N/A";
                    const hpDisplay = hpMax !== "N/A" ? `${hpVal} / ${hpMax}` : `${hpVal}`;

                    const armor = sys.armor ?? 0;
                    const speed = sys.speed ?? 0;
                    const evasion = sys.evasion ?? 0;
                    const edef = sys.edef ?? 0;

                    const hull = sys.hull ?? sys.hase?.hull ?? 0;
                    const agi = sys.agi ?? sys.hase?.agi ?? 0;
                    const sysStat = sys.sys ?? sys.hase?.sys ?? 0;
                    const eng = sys.eng ?? sys.hase?.eng ?? 0;

                    const titleScan = game.i18n.localize("STYLISH_HUD.Spotter.ScanTitle") || "Observador — Análise de Alvo";
                    const labelHp = game.i18n.localize("STYLISH_HUD.Spotter.HP") || "PV";
                    const labelArmor = game.i18n.localize("STYLISH_HUD.Spotter.Armor") || "Armadura";
                    const labelEvasion = game.i18n.localize("STYLISH_HUD.Spotter.Evasion") || "Evasão";
                    const labelEdef = game.i18n.localize("STYLISH_HUD.Spotter.EDefense") || "Defesa-E";
                    const labelSpeed = game.i18n.localize("STYLISH_HUD.Spotter.Speed") || "Velocidade";
                    const labelHase = game.i18n.localize("STYLISH_HUD.Spotter.Hase") || "Perícias de Mecha (HASE)";

                    spotterScanHtml += `
                        <div style="margin-top: 8px; border: 1px solid #cc3333; background: #161616; color: #eeeeee; padding: 8px; border-radius: 4px; font-family: monospace; text-align: left;">
                            <div style="font-weight: bold; color: #ff5555; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 3px; margin-bottom: 6px; font-size: 0.95em;">
                                ${titleScan}: ${target.name}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 0.85em;">
                                <div><strong>${labelHp}:</strong> ${hpDisplay}</div>
                                <div><strong>${labelArmor}:</strong> ${armor}</div>
                                <div><strong>${labelEvasion}:</strong> ${evasion}</div>
                                <div><strong>${labelEdef}:</strong> ${edef}</div>
                                <div><strong>${labelSpeed}:</strong> ${speed}</div>
                            </div>
                            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15); font-size: 1em; color: #cccccc;">
                                <strong>${labelHase}:</strong><br/>
                                <span>Hull: +${hull} | Agi: +${agi} | Sys: +${sysStat} | Eng: +${eng}</span>
                            </div>
                        </div>`;
                }

                let pilotActor = actor;
                if (actor.type === "mech") {
                    pilotActor = actor.system.pilot?.value || (actor.system.pilot?.id ? game.actors.get(actor.system.pilot.id) : null) || actor;
                }
                const hasSpotter = pilotActor?.items?.some(i =>
                    i.type === "talent" && (
                        i.name?.toLowerCase().includes("spotter") ||
                        i.name?.toLowerCase().includes("observador")
                    )
                );

                const noteTitle = game.i18n.localize("STYLISH_HUD.Spotter.NoteTitle") || "Observador (Spotter)";
                const noteDesc = game.i18n.localize("STYLISH_HUD.Spotter.NoteDesc") || "Se você não se moveu e fez Travar Mira neste turno, pode Travar Mira novamente no final do turno como Ação Livre.";
                spotterScanHtml += `
                    <div style="margin-top: 6px; padding: 5px 7px; background: rgba(255,170,0,0.12); border-left: 3px solid #ffaa00; font-size: 1em; color: #ffddaa; text-align: left;">
                        💡 <strong>${noteTitle}:</strong> ${noteDesc}
                    </div>`;
            }

            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="lockon" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 1em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-crosshairs"></i> ${applyLockOnBtnText}
                    </button>
                    ${spotterScanHtml}
                </div>
            `;
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
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${sensorsTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Bolster.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="bolster" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-shield-alt"></i> ${applyBolsterBtnText}
                    </button>
                </div>
            `;
        } else if (action === "brace") {
            if (actor) {
                await safeToggleStatusEffect(actor, "brace", { active: true });
            }
            name = game.i18n.localize("STYLISH_HUD.Basic.Brace.Name");
            icon = "hull.svg";
            desc = game.i18n.localize("STYLISH_HUD.Basic.Brace.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="brace" data-targets="${actor.uuid}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-user-shield"></i> ${applyBraceBtnText}
                    </button>
                </div>
            `;
        } else if (action === "overwatch") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Name");
            icon = "vanguard.svg";
            desc = game.i18n.localize("STYLISH_HUD.Basic.Overwatch.Desc");
        } else if (action === "improvised") {
            name = game.i18n.localize("STYLISH_HUD.Basic.ImprovisedAttack.Name") || "Improvisar Ataque";
            icon = "brawler.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag damage-tag">${fullActionTag}</span><span class="lancer-tag damage-tag">${kineticTag}</span><span class="lancer-tag range-tag">${threatTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.ImprovisedAttack.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-action-btn" data-action="attack:improvised" data-actor-id="${actor.id}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-fist-raised"></i> ${rollImprovisedBtnText}
                    </button>
                </div>
            `;
        } else if (action === "hide") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Hide.Name");
            icon = "tactics.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${quickActionTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Hide.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="hidden" data-targets="${actor.uuid}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-eye-slash"></i> ${applyHiddenBtnText}
                    </button>
                </div>
            `;
        } else if (action === "search") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Search.Name");
            icon = "spotter.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${quickActionTag}</span><span class="lancer-tag range-tag">${sensorsTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Search.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-action-btn" data-action="roll:search" data-actor-id="${actor.id}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-dice-d20"></i> ${rollSearchBtnText}
                    </button>
                </div>
            `;
        } else if (action === "ram") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Ram.Name");
            icon = "hull.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${quickActionTag}</span><span class="lancer-tag damage-tag">${meleeTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Ram.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); display: flex; flex-direction: column; gap: 4px;">
                    <button type="button" class="pf2e-map-btn lancer-chat-action-btn" data-action="roll:ram" data-actor-id="${actor.id}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-dice-d20"></i> ${rollRamBtnText}
                    </button>
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="prone" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-user-slash"></i> ${applyProneBtnText}
                    </button>
                </div>
            `;
        } else if (action === "grapple") {
            name = game.i18n.localize("STYLISH_HUD.Basic.Grapple.Name");
            icon = "hull.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${quickActionTag}</span><span class="lancer-tag damage-tag">${meleeTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.Grapple.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); display: flex; flex-direction: column; gap: 4px;">
                    <button type="button" class="pf2e-map-btn lancer-chat-action-btn" data-action="roll:grapple" data-actor-id="${actor.id}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-dice-d20"></i> ${rollGrappleBtnText}
                    </button>
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="engaged,immobilized" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-lock"></i> ${applyGrappleBtnText}
                    </button>
                </div>
            `;
        } else if (action === "shutdown") {
            name = game.i18n.localize("STYLISH_HUD.Basic.ShutDown.Name");
            icon = "tactics.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${quickActionTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Basic.ShutDown.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="shutdown" data-targets="${actor.uuid}" style="background: rgba(255,100,0,0.15); border: 1px solid #ff6400; color: #ff9d00; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-power-off"></i> ${shutDownBtnText}
                    </button>
                </div>
            `;
        } else if (action === "overcharge") {
            const freeActionTag = game.i18n.localize("STYLISH_HUD.Tags.FreeAction") || "Free Action";
            name = game.i18n.localize("STYLISH_HUD.Utilities.Overcharge.Name");
            icon = "nuclear_fire.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag range-tag">${freeActionTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Utilities.Overcharge.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-action-btn" data-action="util:overcharge" data-actor-id="${actor.id}" style="background: rgba(255,100,0,0.15); border: 1px solid #ff6400; color: #ff9d00; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-bolt"></i> ${overchargeBtnText}
                    </button>
                </div>
            `;
        } else if (action === "stabilize") {
            name = game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Name");
            icon = "hull.svg";
            tagsHtml = `<div class="lancer-tags"><span class="lancer-tag damage-tag">${fullActionTag}</span></div>`;
            desc = game.i18n.localize("STYLISH_HUD.Utilities.Stabilize.Desc");
            applyButtonHtml = `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15); text-align: center;">
                    <button type="button" class="pf2e-map-btn lancer-chat-action-btn" data-action="util:stabilize" data-actor-id="${actor.id}" style="background: rgba(215,60,50,0.15); border: 1px solid #d73c32; color: #d73c32; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                        <i class="fas fa-wrench"></i> ${stabilizeBtnText}
                    </button>
                </div>
            `;
        }

        if (!name) {
            const keyName = action.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
            name = game.i18n.localize(`STYLISH_HUD.Basic.${keyName}.Name`) || action.toUpperCase();
            desc = game.i18n.localize(`STYLISH_HUD.Basic.${keyName}.Desc`) || "";
            icon = "tactics.svg";
        }

        const content = `
            <div class="card clipped-bot" style="margin:0px">
                <div class="lancer-header lancer-system" style="background:#1e1e1e !important; border-bottom: 2px solid #58b434;">
                    <img src="systems/lancer/assets/icons/skills/${icon}" style="width:24px; height:24px; margin-right:8px; vertical-align:middle; filter:invert(1) sepia(1) saturate(5) hue-rotate(50deg);">
                    <span style="vertical-align:middle;">// ${name.toUpperCase()} //</span>
                </div>
                <div class="effect-text">
                    ${tagsHtml}</br>
                    ${desc}
                    ${applyButtonHtml}
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

        const label = statusId.toUpperCase();
        const content = `
            <div class="card clipped-bot" style="margin:0px">
                <div class="lancer-header lancer-system" style="background:#1e1e1e !important; border-bottom: 2px solid #58b434;">
                    <span style="vertical-align:middle;">// STATUS :: ${label} //</span>
                </div>
                <div class="effect-text">
                    Status <strong>${label}</strong> acionado em <strong>${actor.name}</strong>.
                    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15);">
                        <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="${statusId}" data-targets="${actor.uuid}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                            <i class="fas fa-magic"></i> Alternar / Aplicar ${label}
                        </button>
                    </div>
                </div>
            </div>
        `;
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: content
        });

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
        const targetUuids = [];
        for (let target of targets) {
            const targetActor = target.actor;
            if (targetActor) {
                await safeToggleStatusEffect(targetActor, statusId);
                targetUuids.push(targetActor.uuid);
            }
        }

        const label = statusId.toUpperCase();
        const content = `
            <div class="card clipped-bot" style="margin:0px">
                <div class="lancer-header lancer-system" style="background:#1e1e1e !important; border-bottom: 2px solid #58b434;">
                    <span style="vertical-align:middle;">// TARGET STATUS :: ${label} //</span>
                </div>
                <div class="effect-text">
                    Aplicando status <strong>${label}</strong> no(s) alvo(s).
                    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.15);">
                        <button type="button" class="pf2e-map-btn lancer-chat-apply-status-btn" data-status-id="${statusId}" data-targets="${targetUuids.join(',')}" style="background: rgba(88,180,52,0.15); border: 1px solid #58b434; color: #58b434; padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                            <i class="fas fa-magic"></i> Alternar / Aplicar ${label} no(s) Alvo(s)
                        </button>
                    </div>
                </div>
            </div>
        `;
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: content
        });
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
