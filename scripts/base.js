/* scripts/systems/base.js */
import { defaultRegistry } from "./defaults.js";

export function configProps(attr) {
	const o = {
		color: attr.color,
		style: attr.style || "bar",
		x: attr.x || 0,
		y: attr.y || 0,
		icon: attr.icon || "",
		iconImg: attr.iconImg || "",
		barScale: attr.barScale,
		dotScale: attr.dotScale ?? 1,
		numberScale: attr.numberScale ?? 1,
		badgeScale: attr.badgeScale ?? 1,
	badgeConditions: Array.isArray(attr.badgeConditions) ? attr.badgeConditions : [],
		barLabelX: attr.barLabelX || 0,
		barLabelY: attr.barLabelY || 0,
		barValueX: attr.barValueX || 0,
		barValueY: attr.barValueY || 0,
		numberLabelX: attr.numberLabelX || 0,
		numberLabelY: attr.numberLabelY || 0,
		numberValueX: attr.numberValueX || 0,
		numberValueY: attr.numberValueY || 0,
		textColor: attr.textColor || "#000000",
		textStrokeColor: attr.textStrokeColor || "#ffffff",
		labelColor: attr.labelColor || "",
		valueColor: attr.valueColor || "",
		labelFontSize: attr.labelFontSize,
		valueFontSize: attr.valueFontSize,
		barFrameImg: attr.barFrameImg || "",
		barBgImg: attr.barBgImg || "",
		barFillImg: attr.barFillImg || "",
		dotFilledImg: attr.dotFilledImg || "",
		dotEmptyImg: attr.dotEmptyImg || "",
		numberBgImg: attr.numberBgImg || "",
		gmOnly: attr.gmOnly || false,
		ownerOnly: attr.ownerOnly || false,
	};
	for (const [k, v] of Object.entries(attr)) {
		if (/Img(X|Y|Scale|Rotation|Opacity|W|H)$/.test(k)) {
			if (v === 0) continue;
			o[k] = v;
		}
	}
	return o;
}

const isNumericValue = (v) =>
	typeof v === "number" ||
	(typeof v === "string" && v.trim() !== "" && isFinite(Number(v)));

export class BaseSystemAdapter {
	constructor() {
		this.systemId = "generic";
	}

	getStats(actor, configAttributes) {
		if (!configAttributes || configAttributes.length === 0) return [];

		const resolveTypedArrayValue = (path) => {
			if (!path || !path.includes(".")) return { found: false, value: 0, max: 0 };

			const segments = String(path).split(".");
			if (segments.length < 2) return { found: false, value: 0, max: 0 };

			const typeToken = String(segments.pop() || "").trim();
			if (!typeToken) return { found: false, value: 0, max: 0 };

			const collectionPath = segments.join(".");
			const collection = foundry.utils.getProperty(actor, collectionPath);

			if (!Array.isArray(collection) || collection.length === 0) {
				return { found: false, value: 0, max: 0 };
			}

			const normalizedToken = typeToken.toLowerCase();
			const item = collection.find((entry) => {
				if (!entry || typeof entry !== "object") return false;
				const candidates = [
					entry.type,
					entry.slug,
					entry.id,
					entry.key,
					entry.name,
					entry.label,
					entry.short,
					entry.code,
					entry.abbreviation,
				]
					.filter((candidate) => typeof candidate === "string")
					.map((candidate) => candidate.toLowerCase());
				return candidates.includes(normalizedToken);
			});

			if (!item) return { found: false, value: 0, max: 0 };

			const pickNumeric = (entry, keys) => {
				for (const key of keys) {
					const raw = foundry.utils.getProperty(entry, key);
					if (isNumericValue(raw)) return Number(raw);
				}

				for (const [key, raw] of Object.entries(entry)) {
					if (
						isNumericValue(raw) &&
						!key.toLowerCase().includes("sort") &&
						!key.toLowerCase().includes("order") &&
						!key.toLowerCase().includes("index")
					) {
						return Number(raw);
					}
				}

				return undefined;
			};

			const value = pickNumeric(item, [
				"total",
				"value",
				"current",
				"amount",
				"points",
				"used",
				"remaining",
				"speed",
				"base",
				"walk",
				"run",
				"modifier",
				"mod",
				"bonus",
				"rank",
				"level",
			]);
			const max = pickNumeric(item, [
				"max",
				"cap",
				"limit",
				"maximum",
			]);

			if (!isNumericValue(value) && !isNumericValue(max)) {
				return { found: false, value: 0, max: 0 };
			}

			return {
				found: true,
				value: isNumericValue(value) ? Number(value) : 0,
				max: isNumericValue(max) ? Number(max) : 0,
			};
		};

		return configAttributes.map((attr) => {
			if (!attr.path || attr.path.trim() === "") {
		return {
					path: "",
					label: attr.label || "New Attribute",
					value: 3,
					max: 5,
					percent: 60,
					temp: 0,
					tempPercent: 0,
					subtype: "resource",
				...configProps(attr),
		};
		}

		if (attr.path === "combat.initiative") {
				const combatant = game.combat?.combatants?.find(
					(c) => c.actorId === actor.id,
				);
				const initiative = combatant?.initiative;
				const value = Number.isFinite(initiative) ? initiative : "—";
			return {
				path: attr.path,
				label: attr.label,
				value,
				max: 0,
				percent: 100,
				subtype: "resource",
				...configProps(attr),
			};
		}

		const typedArrayResolved = resolveTypedArrayValue(attr.path);

			const rawVal = typedArrayResolved.found
				? typedArrayResolved.value
				:
				foundry.utils.getProperty(actor, `${attr.path}.value`) ??
				foundry.utils.getProperty(actor, attr.path) ??
				0;
			const val = Number(rawVal) || 0;

			let max = 0;

			if (typedArrayResolved.found) {
				max = typedArrayResolved.max;
			} else if (attr.maxPath && attr.maxPath.trim() !== "") {
				const cleanMax = attr.maxPath.trim();
				if (!isNaN(Number(cleanMax))) {
					max = Number(cleanMax);
				} else {
					max = foundry.utils.getProperty(actor, cleanMax) ?? 0;
				}
			} else {
				const rawObj = foundry.utils.getProperty(actor, attr.path);
				if (
					typeof rawObj === "object" &&
					rawObj !== null &&
					rawObj.max !== undefined
				) {
					max = rawObj.max;
				} else if (attr.path.endsWith(".value")) {
					const autoMaxPath = attr.path.replace(".value", ".max");
					max = foundry.utils.getProperty(actor, autoMaxPath) ?? 0;
				} else {
					max = foundry.utils.getProperty(actor, `${attr.path}.max`) ?? 0;
				}
			}
			max = Number(max) || 0;

			const percent = Math.clamp((val / (max || 1)) * 100, 0, 100);

		return {
			path: attr.path,
			label: attr.label,
			value: val,
			max: max,
			percent: percent,
			subtype: "resource",
			...configProps(attr),
		};
	});
	}

	
	async updateAttribute(actor, path, input) {
		const raw = foundry.utils.getProperty(actor, path);
		const usesValue =
			raw && typeof raw === "object" && raw !== null && "value" in raw;
		const currentRaw = usesValue
			? raw.value
			: foundry.utils.getProperty(actor, `${path}.value`) ?? raw;
		const current = Number.isFinite(Number(currentRaw)) ? Number(currentRaw) : 0;
		let max = 0;
		if (usesValue && raw.max !== undefined) {
			max = Number(raw.max);
		} else if (path.endsWith(".value")) {
			max = Number(foundry.utils.getProperty(actor, path.replace(".value", ".max")) ?? 0);
		} else {
			max = Number(foundry.utils.getProperty(actor, `${path}.max`) ?? 0);
		}
		if (!Number.isFinite(max)) max = 0;
		let newValue = current;

		if (input.startsWith("+") || input.startsWith("-")) {
			const delta = Number(input);
			if (!isNaN(delta)) newValue += delta;
		} else {
			const val = Number(input);
			if (!isNaN(val)) newValue = val;
		}

		if (max > 0) {
			newValue = Math.clamp(newValue, 0, max);
		} else {
			newValue = Math.max(0, newValue);
		}

		
		const targetPath = usesValue ? `${path}.value` : path;
		await actor.update({ [targetPath]: newValue });
	}

	
	getConditions(actor) {
		const effects = actor.temporaryEffects || [];


		return effects
			.map((e) => {
				
				const id =
					e.id ||
					e.flags?.core?.statusId ||
					e.slug ||
					e.label ||
					e.name ||
					"unknown";
				const src = e.img || e.icon;

			return {
				id: id,
				src: (typeof src === "string" && (src.includes("/") || src.includes("."))) ? src : "",
				name: e.name || e.label || "Unknown",
				value: e.value ?? null,
			};
			})
			.filter((c) => c.src);
	}

	
	async removeCondition(actor, conditionId) {
		let effect = actor.effects.get(conditionId);

		if (!effect) {
			effect = actor.effects.find((e) => {
				if (e.statuses instanceof Set) return e.statuses.has(conditionId);
				if (Array.isArray(e.statuses)) return e.statuses.includes(conditionId);
				return e.flags?.core?.statusId === conditionId;
			});
		}

		if (!effect) {
			effect = actor.effects.find(
				(e) => e.label === conditionId || e.name === conditionId,
			);
		}

		if (effect) {
			await effect.delete();
			if (game.user.isGM) {
				ui.notifications.info(
					`Removed condition '${effect.label || effect.name}' from ${actor.name}`,
				);
			}
			return;
		}


		const findConditionPath = (obj, prefix, depth) => {
			if (depth > 4) return null;
			for (const [k, v] of Object.entries(obj)) {
				if (k.toLowerCase() === conditionId.toLowerCase()) {
					if (typeof v === "object" && v !== null && "value" in v) {
						return `${prefix}.${k}.value`;
					}
					
					if (typeof v === "boolean") {
						return `${prefix}.${k}`;
					}
				}
				if (typeof v === "object" && v !== null) {
					const found = findConditionPath(v, `${prefix}.${k}`, depth + 1);
					if (found) return found;
				}
			}
			return null;
		};

		if (actor.system) {
			const path = findConditionPath(actor.system, "system", 0);
			if (path) {
				await actor.update({ [path]: false });
				if (game.user.isGM) {
					ui.notifications.info(
						`Removed condition '${conditionId}' (System Data) from ${actor.name}`,
					);
				}
				return;
			}
		}
	}

	
	resolveQuickSlotData(actor, itemId) {
		return null;
	}

	
	rollStat(actor, path, event) {
		return null;
	}

	isStatRollable(path) {
		return false;
	}

	
	
	_isCategoryVisible(visibility, actor) {
		if (!visibility || !visibility.mode || visibility.mode === "all") return true;
		if (!actor) return true;

		const actorType = actor.type;
		const actorId = actor.id;
		const types = visibility.actorTypes || [];
		const ids = visibility.actorIds || [];

		const isMatched = types.includes(actorType) || ids.includes(actorId);

		if (visibility.mode === "only") return isMatched;
		if (visibility.mode === "except") return !isMatched;

		return true;
	}

	
	getActionCategories(actor) {
		const config = (game.settings.settings.has("stylish-action-hud.configuration") ? game.settings.get("stylish-action-hud", "configuration") : null) || { customMenu: [] };

		
		if (config.customMenu && config.customMenu.length > 0) {
			return config.customMenu
				.map((cat, index) => ({
					id: `custom-${index}`,
					label: cat.label,
					icon: cat.icon,
					img: cat.img,

					
					buttonImg: cat.buttonImg,
					buttonScale: cat.buttonScale ?? 1.0,
					buttonX: cat.buttonX ?? 0,
					buttonY: cat.buttonY ?? 0,

					
					buttonFrameLayers: cat.buttonFrameLayers || [],
					buttonFrameColor: cat.buttonFrameColor || "",

					type: "submenu",
					cssClass: `btn-custom-${index}`,
					systemId: cat.systemId || null,
					_visibility: cat.visibility,
				}))
				.filter((cat) => this._isCategoryVisible(cat._visibility, actor));
		}

		const defaultLayout = defaultRegistry.getDefaultLayout(
			game.system.id,
			this,
		);
		if (defaultLayout && defaultLayout.length > 0) {
			return defaultLayout.map((cat, index) => ({
				id: `menu-${index}`,
				systemId: cat.systemId,
				label: cat.label,
				icon: cat.icon,
				type: "submenu",
			}));
		}

		return [];
	}

	
	async getSubMenuData(actor, categoryId) {

		const parts = categoryId.split("-");
		const index = parseInt(parts[parts.length - 1]);

		const config = (game.settings.settings.has("stylish-action-hud.configuration") ? game.settings.get("stylish-action-hud", "configuration") : null) || { customMenu: [] };

		
		let menuData = config.customMenu?.[index];

		if (!menuData || categoryId.startsWith("menu-")) {
			const defaultLayout = defaultRegistry.getDefaultLayout(
				game.system.id,
				this,
			);
			if (defaultLayout[index]) {
				menuData = defaultLayout[index];
			}
		}

		if (!menuData) return { title: "", items: [] };

		if (menuData.systemId) {
			return await this._getSystemSubMenuData(actor, menuData.systemId, menuData);
		}


		return this._getCustomSubMenuData(actor, menuData, index);
	}

	
	async _getSystemSubMenuData(actor, systemId, menuData) {
		
		return { title: menuData.label, items: [] };
	}

	
	_getCustomSubMenuData(actor, menuData, index) {
		const useSidebar = menuData.useSidebar === true;
		const personalMap =
			actor.getFlag("stylish-action-hud", "personalMap") || {};

		// 데이터 구조 초기화
		const items = {};
		const tabLabels = {};
		const subTabLabels = {};

		if (menuData.tabs) {
			menuData.tabs.forEach((tab, tIdx) => {
				let sKey = "";
				let tKey = "";
				let sLabel = "";
				let tLabel = "";

				if (useSidebar) {
					sLabel = tab.label || "General";

					
					sKey = sLabel.replace(/\s+/g, "_").toLowerCase();

					tLabel = tab.subLabel || "All";

					
					tKey = `tab-${tIdx}`;
				} else {
					
					sKey = `tab-${tIdx}`;
					sLabel = tab.label || "General";
				}

				if (useSidebar) {
					if (!items[sKey]) {
						items[sKey] = {};
						tabLabels[sKey] = sLabel;
						subTabLabels[sKey] = {};
					}
					if (!items[sKey][tKey]) {
						items[sKey][tKey] = [];
						subTabLabels[sKey][tKey] = tLabel;
					}
				} else {
					if (!items[sKey]) {
						items[sKey] = [];
						tabLabels[sKey] = sLabel;
					}
				}

				const targetArray = useSidebar ? items[sKey][tKey] : items[sKey];

				
				if (tab.items) {
					tab.items.forEach((savedItem, iIdx) => {
						this._processCustomItem(savedItem, targetArray, false, {
							catIdx: index,
							tabIdx: tIdx,
							itemIdx: iIdx,
						});
					});
				}

				
				const pKey = `${index}-${tIdx}`;
				const personalItems = personalMap[pKey];
				if (personalItems) {
					if (targetArray.length > 0) {
						targetArray.push({ isHeader: true, name: "Personal" });
					}
					personalItems.forEach((pItem, pIdx) => {
						this._processCustomItem(pItem, targetArray, true, {
							catIdx: index,
							tabIdx: tIdx,
							itemIdx: pIdx,
						});
					});
				}
			});
		}

		return {
			title: menuData.label,
			theme: "blue",
			hasTabs: true,
			hasSubTabs: useSidebar,
			items: items,
			tabLabels: tabLabels,
			subTabLabels: subTabLabels,
		};
	}

	
	_processCustomItem(savedItem, targetArray, isPersonal, personalMeta = {}) {
		if (!savedItem || !savedItem.id || !savedItem.type) {
			console.warn("stylish-action-hud | Invalid custom item data skipped:", savedItem);
			return;
		}

		if (savedItem.type === "Macro") {
			targetArray.push({
				id: `macro-${savedItem.id}`,
				name: savedItem.name || "Unknown Macro",
				img: savedItem.img || "icons/svg/dice-target.svg",
				cost: "",
				description: savedItem.flavor || "Macro",
				globalFlavor: !isPersonal ? (savedItem.flavor || "") : "",
				isPersonal: isPersonal,
				customCatIndex: personalMeta.catIdx,
				customTabIndex: personalMeta.tabIdx,
				customItemIndex: personalMeta.itemIdx,
			});
			return;
		}
	}

	
	async executeAction(actor, actionId) {
		
	}

	
	async useItem(actor, itemId, event = null) {
        if (!actor) return;

        // Suporte a chaves compostas (ex: "overheat:self", "structure:self", "macro:uuid", "attack:id")
        const [type, id] = typeof itemId === "string" ? itemId.split(":") : ["item", itemId];
		
        switch (type) {
            case "overheat": {
                if (typeof actor.beginOverheatFlow === "function") {
                    return await actor.beginOverheatFlow();
                }
                const OverheatFlow = game.lancer?.Flow?.get("OverheatFlow");
                if (OverheatFlow) {
                    const flow = new OverheatFlow(actor);
                    return await flow.begin();
                }
                ui.notifications.warn("Lancer OverheatFlow não foi encontrado.");
                return;
            }

            case "structure": {
                if (typeof actor.beginStructureFlow === "function") {
                    return await actor.beginStructureFlow();
                }
                const StructureFlow = game.lancer?.Flow?.get("StructureFlow");
                if (StructureFlow) {
                    const flow = new StructureFlow(actor);
                    return await flow.begin();
                }
                ui.notifications.warn("Lancer StructureFlow não foi encontrado.");
                return;
            }

            case "macro": {
                const uuid = id || itemId.replace("macro-", "");
                const macro = (await fromUuid(uuid)) || game.macros.get(uuid);

                if (macro) {
                    return await macro.execute({ actor: actor, token: actor.token });
                } else {
                    ui.notifications.warn(`Macro não encontrada: ${uuid}`);
                    return;
                }
            }
			case "tech": {
				const targets = Array.from(game.user.targets);

				// 1. Tenta acionar via Item do ator (se 'id' for o ID de uma arma/sistema de tech)
				const item = actor.items.get(id);
				if (item) {
					if (typeof item.beginTechAttackFlow === "function") {
						return await item.beginTechAttackFlow(targets);
					}
					if (typeof item.beginWeaponAttackFlow === "function") {
						return await item.beginWeaponAttackFlow(targets);
					}
				}

				// 2. Método nativo do Ator (Descoberto no seu log!)
				if (typeof actor.beginBasicTechAttackFlow === "function") {
					return await actor.beginBasicTechAttackFlow({ action: id, targets });
				}

				// 3. Busca no Map do Lancer (Descoberto no seu log: game.lancer.flows!)
				const TechAttackFlow = game.lancer?.flows?.get("TechAttackFlow");
				if (TechAttackFlow) {
					const flow = new TechAttackFlow(actor, { action: id || "invade" });
					return await flow.begin(targets);
				}

				// Notificação se não for encontrado
				const msg = game.i18n.has("LANCER_HUD.Notifications.FlowNotFound")
					? game.i18n.format("LANCER_HUD.Notifications.FlowNotFound", { flowName: "TechAttackFlow" })
					: `Fluxo Lancer 'TechAttackFlow' não foi encontrado.`;

				ui.notifications.warn(msg);
				return;
			}
			
        }

        // Execução padrão para Items do Foundry VTT
        const targetId = id || itemId;
        let item = actor.items.get(targetId);
        if (!item && this.findSyntheticItem) {
            item = this.findSyntheticItem(actor, targetId);
        }

        if (!item) {
            ui.notifications.warn(`Item não encontrado: ${targetId}`);
            return;
        }

        // Tenta executar os métodos nativos do Item
        if (typeof item.use === "function") return await item.use();
        if (typeof item.roll === "function") return await item.roll();
        if (typeof item.toChat === "function") return await item.toChat();
        if (typeof item.toMessage === "function") return await item.toMessage();

        // Fallbacks de sistema
        const sysId = game.system.id;
        const sysObj = game[sysId];

        if (sysObj) {
            if (typeof sysObj.rollItemMacro === "function") {
                return sysObj.rollItemMacro(item.name);
            }
            if (sysObj.utility?.rollItemMacro) {
                return sysObj.utility.rollItemMacro(item.name, item.type, item);
            }
        }

        return item.sheet.render(true);
    }

	
	async _getStorageFolder(actorName) {
		const rootName = "Stylish HUD Macros";

		
		let root = game.folders.find(
			(f) => f.name === rootName && f.type === "Macro" && !f.folder,
		);

		if (!root) {
			root = await Folder.create({
				name: rootName,
				type: "Macro",
				color: "#e61c34",
				sorting: "a",
			});
		}

		
		if (!actorName) return root;

		
		let subFolder = game.folders.find(
			(f) =>
				f.name === actorName && f.type === "Macro" && f.folder?.id === root.id,
		);

		if (!subFolder) {
			subFolder = await Folder.create({
				name: actorName,
				type: "Macro",
				folder: root.id,
				sorting: "a",
			});
		}

		return subFolder;
	}

	
	async createSystemMacro(dropData) {
		if (dropData.type !== "Item") return null;
		const item = await Item.fromDropData(dropData);
		if (!item) return null;

		
		const actorName = item.actor?.name || item.parent?.name || null;
		const folder = await this._getStorageFolder(actorName);

		
		const existing = game.macros.find(
			(m) =>
				m.name === item.name &&
				m.command.includes(item.id) &&
				m.folder?.id === folder.id,
		);
		if (existing) return existing;

		
		let hookId = null;

		try {
			const macro = await new Promise((resolve) => {
				let resolved = false;

				hookId = Hooks.once(
					"createMacro",
					async (document, options, userId) => {
						if (userId === game.user.id) {
							resolved = true;

							
							if (document.folder?.id !== folder.id) {
								await document.update({ folder: folder.id });
							}

							resolve(document);
							return false;
						}
					},
				);

				
				Hooks.call("hotbarDrop", ui.hotbar, dropData, 50);

				setTimeout(() => {
					if (!resolved) resolve(null);
				}, 500);
			});

			if (macro) return macro;
		} catch (err) {
			console.warn("StylishHUD | Macro trap failed:", err);
		} finally {
			if (hookId) Hooks.off("createMacro", hookId);
		}

		

		const command = `const item = await fromUuid("${item.uuid}"); 
if (item) item.use ? item.use() : (item.roll ? item.roll() : item.sheet.render(true));`;

		return await Macro.create({
			name: item.name,
			type: "script",
			img: item.img,
			command: command,
			folder: folder.id,
			flags: { "stylish-action-hud": { sourceId: item.uuid } },
		});
	}

		
	getWeapons(actor) {
		return [];
	}

	getSpells(actor) {
		return {};
	}

	
	getTrackableAttributes(actor) {
		const paths = [];
		if (!actor.system) return paths;

		const toReadableLabel = (key) => {
			const text = String(key || "");
			if (!text) return "Unknown";
			if (text.length <= 4) return text.toUpperCase();
			return text.charAt(0).toUpperCase() + text.slice(1);
		};

		const getTypedEntryKey = (entry) => {
			const candidates = [
				entry?.type,
				entry?.slug,
				entry?.id,
				entry?.key,
				entry?.name,
				entry?.label,
				entry?.short,
				entry?.code,
				entry?.abbreviation,
			];
			return candidates.find((candidate) => typeof candidate === "string" && candidate.trim() !== "") || null;
		};

		const getTypedEntryValue = (entry) => {
			const byKey = [
				entry?.total,
				entry?.value,
				entry?.current,
				entry?.amount,
				entry?.points,
				entry?.used,
				entry?.remaining,
				entry?.speed,
				entry?.base,
				entry?.walk,
				entry?.run,
				entry?.modifier,
				entry?.mod,
				entry?.bonus,
				entry?.rank,
				entry?.level,
			];
			const direct = byKey.find((candidate) => typeof candidate === "number");
			if (typeof direct === "number") return direct;

			for (const [key, raw] of Object.entries(entry || {})) {
				if (
					typeof raw === "number" &&
					!key.toLowerCase().includes("sort") &&
					!key.toLowerCase().includes("order") &&
					!key.toLowerCase().includes("index")
				) {
					return raw;
				}
			}

			return undefined;
		};

		const flatten = (obj, prefix, depth) => {
			if (depth > 5) return;

			for (const [k, v] of Object.entries(obj)) {
			
			if (isNumericValue(v)) {
					paths.push({
						path: `${prefix}.${k}`,
						label: k.toUpperCase(),
					});
				}
				else if (typeof v === "object" && v !== null) {
					if (Array.isArray(v)) {
						v.forEach((entry) => {
							if (!entry || typeof entry !== "object") return;

							const typeKey = getTypedEntryKey(entry);
							const typedValue = getTypedEntryValue(entry);
							if (!typeKey || typeof typedValue !== "number") return;

							const normalizedType = String(typeKey).trim().replace(/\s+/g, "-").toLowerCase();
							const baseLabel = String(k || "").toLowerCase().includes("speed")
								? "Speed"
								: toReadableLabel(k);
							const typeLabel = toReadableLabel(typeKey);

							paths.push({
								path: `${prefix}.${k}.${normalizedType}`,
								label: `${baseLabel}: ${typeLabel}`,
							});
						});
						continue;
					}

				
				if ("value" in v && isNumericValue(v.value)) {
						const label = toReadableLabel(k);
						paths.push({
							path: `${prefix}.${k}.value`,
							label: label,
						});
					}
				else if ("max" in v && isNumericValue(v.max)) {
						const label = toReadableLabel(k);
						paths.push({
							path: `${prefix}.${k}`,
							label: label,
						});
					}
					
					else {
						flatten(v, `${prefix}.${k}`, depth + 1);
					}
				}
			}
		};

		try {
			flatten(actor.system, "system", 0);
		} catch (e) {
			console.warn("stylishActionHUD | Error scanning attributes:", e);
		}

		const uniquePaths = Array.from(
			new Map(paths.map((entry) => [entry.path, entry])).values(),
		);

		return uniquePaths.sort((a, b) => a.label.localeCompare(b.label));
	}

	
	getDefaultAttributes() {
		
		return [
			{
				path: "system.attributes.hp",
				label: "HP",
				color: "#e61c34",
				style: "bar",
			},
		];
	}

	 
	getDefaultStatusEffects() {
		return [
			{
				id: "dead",
				label: "Dead",
				filters: {
					grayscale: 100,
					brightness: 50,
					contrast: 120,
					blur: 0,
					saturate: 0,
					sepia: 0,
				},
				overlayPath: "icons/svg/skull.svg",
				overlayScale: 1.0,
				overlayX: 0,
				overlayY: 0,
				overlayOpacity: 0.8,
				overlayBlend: "normal",
				animation: "pulse",
				tintColor: "#000000",
				tintAlpha: 0.6,
				tintAnimation: "",
			},
		];
	}
}
