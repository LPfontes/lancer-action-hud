import { LANCER_CUSTOM_ICONS } from './icon-config-custom.js';

const BASE_ICONS = {
  'strike':               'strike',
  'btn-damage':           'btn-damage',
  'btn-damage-critical':  'btn-damage-critical',
  'menu-action-skill':    'menu-action-skill',
  'menu-checks':          'menu-checks',
  'menu-feat':            'menu-feat',
  'menu-inventory':       'menu-inventory',
};

export const LANCER_ICONS = { ...BASE_ICONS, ...LANCER_CUSTOM_ICONS };

export const ICON_BASE_PATH = 'modules/lancer-action-hud/assets/icons/actions-symbols';

export const getIconPath = (key) => `${ICON_BASE_PATH}/${LANCER_ICONS[key] || key}.svg`;

export function getIconHtml(key, { size = '1.1em', color = 'currentColor', margin = '0', extraStyle = '' } = {}) {
  const path = getIconPath(key);
  // Default fallback style to render masks
  return `<span class="lancer-local-icon" style="-webkit-mask-image: url('${path}'); mask-image: url('${path}'); width: ${size}; height: ${size}; background-color: ${color}; display: inline-block; margin: ${margin}; ${extraStyle}"></span>`;
}
