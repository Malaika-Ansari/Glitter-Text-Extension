/**
 * GlitterText Extension - Shared Configuration & Color Engine
 * 
 * Centralized state configuration, storage wrappers, security validators,
 * and realistic glitter particle color synthesis algorithm.
 */

(function (root, factory) {
  const config = factory();
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = config;
  } else {
    root.GlitterConfig = config;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Chrome Storage Keys
   */
  const STORAGE_KEYS = Object.freeze({
    SETTINGS: 'glitter_text_settings_v1'
  });

  /**
   * Text Size Bounds & Limits (Required: Min 10px, Max 50px)
   */
  const TEXT_SIZE_LIMITS = Object.freeze({
    MIN: 10,
    MAX: 50,
    DEFAULT: 16,
    STEP: 1
  });

  /**
   * Curated Luxury Metallic Glitter Presets
   */
  const PRESETS = Object.freeze({
    'metallic-gold': {
      id: 'metallic-gold',
      name: 'Metallic Gold',
      mode: 'single',
      colors: ['#e5b842']
    },
    'rose-gold': {
      id: 'rose-gold',
      name: 'Rose Gold',
      mode: 'single',
      colors: ['#b76e79']
    },
    'silver': {
      id: 'silver',
      name: 'Silver',
      mode: 'single',
      colors: ['#d8d8d8']
    },
    'pink': {
      id: 'pink',
      name: 'Pink',
      mode: 'single',
      colors: ['#ff69b4']
    },
    'purple': {
      id: 'purple',
      name: 'Purple',
      mode: 'single',
      colors: ['#9b59b6']
    },
    'royal-blue': {
      id: 'royal-blue',
      name: 'Royal Blue',
      mode: 'single',
      colors: ['#1e3799']
    },
    'ruby-red': {
      id: 'ruby-red',
      name: 'Ruby Red',
      mode: 'single',
      colors: ['#d63031']
    },
    'emerald-green': {
      id: 'emerald-green',
      name: 'Emerald Green',
      mode: 'single',
      colors: ['#00b894']
    },
    'rainbow': {
      id: 'rainbow',
      name: 'Rainbow',
      mode: 'rainbow',
      colors: ['#ff3b30', '#ffd700', '#00b894', '#0984e3', '#9b59b6']
    }
  });

  /**
   * Initial default favourites
   */
  const DEFAULT_FAVOURITES = Object.freeze([
    { id: 'fav_gold_emerald', name: 'Gold & Emerald', mode: 'dual', colors: ['#e5b842', '#00b894'] },
    { id: 'fav_rose_silver', name: 'Rose & Silver', mode: 'dual', colors: ['#b76e79', '#d8d8d8'] },
    { id: 'fav_royal_trio', name: 'Royal Trinity', mode: 'triple', colors: ['#d63031', '#e5b842', '#1e3799'] }
  ]);

  /**
   * Text Element Targeting Scopes
   */
  const TEXT_SCOPES = Object.freeze({
    ALL: 'all',
    HEADINGS: 'headings',
    INTERACTIVE: 'interactive',
    HEADINGS_INTERACTIVE: 'headings-interactive'
  });

  /**
   * Canonical default settings.
   */
  const DEFAULT_SETTINGS = Object.freeze({
    isEnabled: false,
    textSize: TEXT_SIZE_LIMITS.DEFAULT, // 16px
    isTextSizeCustomized: false,
    textScope: 'all',                   // 'all', 'headings', 'interactive', 'headings-interactive'
    excludedDomains: [],                // Array of excluded hostnames e.g. ['mail.google.com']
    colorMode: 'single',                // 'single', 'dual', 'triple', 'rainbow'
    activePreset: 'metallic-gold',      // 'metallic-gold' or null for custom
    colors: ['#e5b842'],                // 1, 2, or 3 hex colors
    favourites: [...DEFAULT_FAVOURITES],
    // Advanced Intensity & Animation Controls
    intensity: 75,                      // 0 - 100% (Glitter Intensity)
    particleDensity: 'normal',          // 'sparse', 'normal', 'dense'
    sparkleBrightness: 80,              // 0 - 100% (Sparkle Brightness)
    animationSpeed: 'normal',           // 'slow', 'normal', 'fast'
    isAnimationEnabled: true,           // boolean (Separate Animation ON/OFF switch)
    lastToggledAt: null,
    version: '1.0.0'
  });

  /**
   * Standardized Message Actions
   */
  const MESSAGE_ACTIONS = Object.freeze({
    GET_SETTINGS: 'GLITTER_GET_SETTINGS',
    UPDATE_SETTINGS: 'GLITTER_UPDATE_SETTINGS',
    SETTINGS_CHANGED: 'GLITTER_SETTINGS_CHANGED',
    TOGGLE_STATE: 'GLITTER_TOGGLE_STATE',
    RESET_TEXT_SIZE: 'GLITTER_RESET_TEXT_SIZE',
    RESET_DEFAULT_GOLD: 'GLITTER_RESET_DEFAULT_GOLD',
    RESET_ALL_DEFAULTS: 'GLITTER_RESET_ALL_DEFAULTS'
  });

  /**
   * Color Manipulation Utilities
   */
  function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return { r: 229, g: 184, b: 66 };
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return { r: 229, g: 184, b: 66 };
    const num = parseInt(c, 16);
    if (isNaN(num)) return { r: 229, g: 184, b: 66 };
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function lighten(rgb, percent) {
    return {
      r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percent)),
      g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percent)),
      b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percent))
    };
  }

  function darken(rgb, percent) {
    return {
      r: Math.max(0, Math.round(rgb.r * (1 - percent))),
      g: Math.max(0, Math.round(rgb.g * (1 - percent))),
      b: Math.max(0, Math.round(rgb.b * (1 - percent)))
    };
  }

  function toRgba(rgb, a = 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  function toHex(rgb) {
    return '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function isValidHex(hex) {
    return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex);
  }

  /**
   * Glitter Particle Engine: Generates multi-layered CSS for any color configuration,
   * incorporating particle density, intensity, sparkle brightness, and animation speed.
   */
  function generateGlitterCss(param1, param2, param3) {
    let colors, mode, selector, intensity, density, brightness, speed, isAnim;

    if (param1 && typeof param1 === 'object' && !Array.isArray(param1)) {
      colors = param1.colors;
      mode = param1.colorMode || param1.mode || 'single';
      intensity = typeof param1.intensity === 'number' ? param1.intensity : 75;
      density = param1.particleDensity || 'normal';
      brightness = typeof param1.sparkleBrightness === 'number' ? param1.sparkleBrightness : 80;
      speed = param1.animationSpeed || 'normal';
      isAnim = typeof param1.isAnimationEnabled === 'boolean' ? param1.isAnimationEnabled : true;
      selector = param2 || '.glitter-text-active .glitter-text-applied';
    } else {
      colors = param1;
      mode = param2 || 'single';
      selector = param3 || '.glitter-text-active .glitter-text-applied';
      intensity = 75;
      density = 'normal';
      brightness = 80;
      speed = 'normal';
      isAnim = true;
    }

    let effectiveColors = Array.isArray(colors) && colors.length > 0 ? colors.slice(0, 3) : ['#e5b842'];
    if (mode === 'rainbow') {
      effectiveColors = ['#ff3b30', '#ffd700', '#00b894', '#0984e3', '#9b59b6'];
    }

    const rgbs = effectiveColors.map(hexToRgb);
    const c1 = rgbs[0];
    const c2 = rgbs[1] || rgbs[0];
    const c3 = rgbs[2] || rgbs[0];

    // Normalized factors
    const I = Math.min(100, Math.max(0, intensity)) / 100;
    const B = Math.min(100, Math.max(0, brightness)) / 100;

    // Stroke and drop shadow scaled with intensity & brightness
    const strokeColor = toRgba(darken(c1, 0.65), 0.25 + I * 0.35);
    const shadow1 = `drop-shadow(0 0 0.8px ${toRgba(darken(c1, 0.7), 0.3 + I * 0.45)})`;
    const shadow2 = `drop-shadow(0 0 3px ${toRgba(c1, 0.08 + I * 0.45)})`;
    const filterBrightness = `brightness(${0.85 + B * 0.3})`;

    // Particle sizes and co-prime tile frequencies based on Particle Density
    let sizes = '';
    let r1 = '1.2px', r2 = '1.4px', r3 = '2px', r4 = '2.4px', r5 = '2.8px', r6 = '3.2px', r7 = '4px';

    if (density === 'sparse') {
      // Larger, more spaced-out glitter flakes with open negative space
      sizes = '23px 29px, 31px 37px, 41px 43px, 37px 41px, 53px 59px, 47px 53px, 67px 71px, 260% 260% !important;';
      r1 = '1.6px'; r2 = '1.9px'; r3 = '2.8px'; r4 = '3.2px'; r5 = '3.8px'; r6 = '4.2px'; r7 = '5.0px';
    } else if (density === 'dense') {
      // Packed micro-dust and tight micro-facets, high frequency
      sizes = '7px 9px, 11px 13px, 13px 17px, 15px 19px, 19px 23px, 23px 29px, 29px 31px, 260% 260% !important;';
      r1 = '0.9px'; r2 = '1.1px'; r3 = '1.5px'; r4 = '1.8px'; r5 = '2.2px'; r6 = '2.5px'; r7 = '3.2px';
    } else {
      // Normal balanced distribution
      sizes = '11px 13px, 17px 19px, 23px 29px, 19px 23px, 31px 37px, 29px 31px, 41px 43px, 260% 260% !important;';
    }

    // Sparkle diamond color scaled with brightness
    const diamondWhite = toRgba({ r: 255, g: 255, b: 255 }, 0.4 + B * 0.6);
    const starWhite = toRgba({ r: 255, g: 255, b: 255 }, 0.5 + B * 0.5);

    // 1. Diamond sparkle dust (pinpoints)
    const l1 = `repeating-radial-gradient(circle at 1.5px 2px, ${diamondWhite} 0px, ${toRgba(lighten(c1, 0.85), 0.7 + B * 0.3)} 0.6px, transparent ${r1})`;
    const l2 = `repeating-radial-gradient(circle at 6.5px 5.5px, ${diamondWhite} 0px, ${toRgba(lighten(c2, 0.8), 0.65 + B * 0.3)} 0.7px, transparent ${r2})`;

    // 2. Micro glitter flecks (dense colorful grains)
    const l3 = `repeating-radial-gradient(circle at 11px 8px, ${toRgba(lighten(c1, 0.45), 0.85 + I * 0.15)} 0px, ${toRgba(c1, 0.65 + I * 0.25)} 1px, transparent ${r3})`;
    const l4 = `repeating-radial-gradient(circle at 3.5px 12px, ${toRgba(lighten(c2, 0.45), 0.8 + I * 0.2)} 0px, ${toRgba(c2, 0.6 + I * 0.25)} 1.2px, transparent ${r4})`;

    // 3. Deep shadow cavity facets (particle depth and grit)
    const l5 = `repeating-radial-gradient(circle at 13px 3px, ${toRgba(darken(c1, 0.65), 0.65 + I * 0.3)} 0px, ${toRgba(darken(c1, 0.8), 0.5 + I * 0.3)} 1.4px, transparent ${r5})`;
    const l6 = `repeating-radial-gradient(circle at 8px 16px, ${toRgba(darken(c2, 0.65), 0.6 + I * 0.3)} 0px, ${toRgba(darken(c2, 0.8), 0.45 + I * 0.3)} 1.6px, transparent ${r6})`;

    // 4. Brilliant star glints (high-intensity sparkles)
    const l7 = `repeating-radial-gradient(circle at 18px 22px, ${starWhite} 0px, ${toRgba(lighten(c3, 0.85), 0.7 + B * 0.3)} 0.9px, ${toRgba(c3, 0.4 + I * 0.35)} 2.2px, transparent ${r7})`;

    // 5. Metallic foil underlay gradient ribbon
    let foilStops = '';
    if (mode === 'rainbow') {
      foilStops = '#ff3b30 0%, #ff9500 18%, #ffd700 35%, #00b894 52%, #0984e3 70%, #9b59b6 88%, #ff3b30 100%';
    } else if (effectiveColors.length === 1) {
      const pDark = toRgba(darken(c1, 0.45));
      const pMid = toRgba(c1);
      const pLight = toRgba(lighten(c1, 0.5));
      const pBright = toRgba(lighten(c1, 0.8));
      foilStops = `${pDark} 0%, ${pBright} 14%, ${pMid} 28%, ${pLight} 42%, ${pDark} 56%, ${pBright} 70%, ${pMid} 84%, ${pDark} 100%`;
    } else if (effectiveColors.length === 2) {
      const c1D = toRgba(darken(c1, 0.4));
      const c1L = toRgba(lighten(c1, 0.6));
      const c2D = toRgba(darken(c2, 0.4));
      const c2L = toRgba(lighten(c2, 0.6));
      foilStops = `${c1D} 0%, ${c1L} 25%, ${c2D} 50%, ${c2L} 75%, ${c1D} 100%`;
    } else {
      const c1D = toRgba(darken(c1, 0.4));
      const c1L = toRgba(lighten(c1, 0.6));
      const c2D = toRgba(darken(c2, 0.4));
      const c2L = toRgba(lighten(c2, 0.6));
      const c3D = toRgba(darken(c3, 0.4));
      const c3L = toRgba(lighten(c3, 0.6));
      foilStops = `${c1D} 0%, ${c1L} 17%, ${c2D} 34%, ${c2L} 51%, ${c3D} 68%, ${c3L} 85%, ${c1D} 100%`;
    }
    const foilLayer = `linear-gradient(135deg, ${foilStops})`;

    const layers = [l1, l2, l3, l4, l5, l6, l7, foilLayer].join(',\n    ');

    // Animation duration based on speed
    let speedDuration = '5.5s';
    if (speed === 'slow') speedDuration = '8.5s';
    else if (speed === 'fast') speedDuration = '3.0s';

    const animationRule = isAnim
      ? `animation: glitterParticleShimmer ${speedDuration} ease-in-out infinite alternate !important;\n`
      : `animation: none !important;\n`;

    return `${selector} {\n` +
      `  -webkit-text-stroke: 0.35px ${strokeColor};\n` +
      `  filter: ${shadow1} ${shadow2} ${filterBrightness};\n` +
      `  background-image:\n    ${layers} !important;\n` +
      `  background-size:\n    ${sizes}\n` +
      `  ${animationRule}` +
      `}\n`;
  }

  /**
   * Sanitizes input settings against the schema.
   */
  function sanitizeSettings(input) {
    if (!input || typeof input !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }

    const isEnabled = typeof input.isEnabled === 'boolean'
      ? input.isEnabled
      : DEFAULT_SETTINGS.isEnabled;

    let textSize = DEFAULT_SETTINGS.textSize;
    if (typeof input.textSize === 'number' && !isNaN(input.textSize)) {
      textSize = Math.min(TEXT_SIZE_LIMITS.MAX, Math.max(TEXT_SIZE_LIMITS.MIN, Math.round(input.textSize)));
    }

    const isTextSizeCustomized = typeof input.isTextSizeCustomized === 'boolean'
      ? input.isTextSizeCustomized
      : (textSize !== TEXT_SIZE_LIMITS.DEFAULT);

    const validModes = ['single', 'dual', 'triple', 'rainbow'];
    const colorMode = validModes.includes(input.colorMode)
      ? input.colorMode
      : DEFAULT_SETTINGS.colorMode;

    const activePreset = typeof input.activePreset === 'string' && (input.activePreset in PRESETS || input.activePreset === 'custom')
      ? input.activePreset
      : DEFAULT_SETTINGS.activePreset;

    let colors = DEFAULT_SETTINGS.colors;
    if (Array.isArray(input.colors) && input.colors.length > 0) {
      colors = input.colors
        .filter(isValidHex)
        .slice(0, 3);
      if (colors.length === 0) colors = ['#e5b842'];
    }

    let favourites = DEFAULT_SETTINGS.favourites;
    if (Array.isArray(input.favourites)) {
      favourites = input.favourites.filter(f => f && typeof f.id === 'string' && Array.isArray(f.colors));
    }

    // Advanced Intensity & Animation Controls
    const intensity = typeof input.intensity === 'number' && !isNaN(input.intensity)
      ? Math.min(100, Math.max(0, Math.round(input.intensity)))
      : DEFAULT_SETTINGS.intensity;

    const validDensities = ['sparse', 'normal', 'dense'];
    const particleDensity = validDensities.includes(input.particleDensity)
      ? input.particleDensity
      : DEFAULT_SETTINGS.particleDensity;

    const sparkleBrightness = typeof input.sparkleBrightness === 'number' && !isNaN(input.sparkleBrightness)
      ? Math.min(100, Math.max(0, Math.round(input.sparkleBrightness)))
      : DEFAULT_SETTINGS.sparkleBrightness;

    const validSpeeds = ['slow', 'normal', 'fast'];
    const animationSpeed = validSpeeds.includes(input.animationSpeed)
      ? input.animationSpeed
      : DEFAULT_SETTINGS.animationSpeed;

    const isAnimationEnabled = typeof input.isAnimationEnabled === 'boolean'
      ? input.isAnimationEnabled
      : DEFAULT_SETTINGS.isAnimationEnabled;

    const validScopes = ['all', 'headings', 'interactive', 'headings-interactive'];
    const textScope = validScopes.includes(input.textScope)
      ? input.textScope
      : DEFAULT_SETTINGS.textScope;

    let excludedDomains = DEFAULT_SETTINGS.excludedDomains;
    if (Array.isArray(input.excludedDomains)) {
      excludedDomains = input.excludedDomains
        .filter(d => typeof d === 'string' && d.trim().length > 0)
        .map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
        .slice(0, 100);
    }

    const lastToggledAt = typeof input.lastToggledAt === 'number'
      ? input.lastToggledAt
      : null;

    return {
      isEnabled,
      textSize,
      isTextSizeCustomized,
      textScope,
      excludedDomains,
      colorMode,
      activePreset,
      colors,
      favourites,
      intensity,
      particleDensity,
      sparkleBrightness,
      animationSpeed,
      isAnimationEnabled,
      lastToggledAt,
      version: DEFAULT_SETTINGS.version
    };
  }

  /**
   * Checks if URL is a restricted internal browser page.
   */
  function isRestrictedUrl(url) {
    if (!url || typeof url !== 'string') return true;
    const lower = url.trim().toLowerCase();
    return (
      lower.startsWith('chrome://') ||
      lower.startsWith('chrome-extension://') ||
      lower.startsWith('edge://') ||
      lower.startsWith('devtools://') ||
      lower.startsWith('about:') ||
      lower.startsWith('view-source:') ||
      lower.includes('chromewebstore.google.com') ||
      lower.includes('chrome.google.com/webstore')
    );
  }

  /**
   * Reads settings from Chrome storage with local fallback.
   */
  function getStorageSettings() {
    return new Promise((resolve) => {
      const storageArea = (chrome.storage && chrome.storage.sync)
        ? chrome.storage.sync
        : (chrome.storage && chrome.storage.local ? chrome.storage.local : null);

      if (!storageArea) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }

      storageArea.get(STORAGE_KEYS.SETTINGS, (result) => {
        if (chrome.runtime.lastError) {
          if (chrome.storage.local && storageArea !== chrome.storage.local) {
            chrome.storage.local.get(STORAGE_KEYS.SETTINGS, (localResult) => {
              if (chrome.runtime.lastError || !localResult || !localResult[STORAGE_KEYS.SETTINGS]) {
                resolve({ ...DEFAULT_SETTINGS });
              } else {
                resolve(sanitizeSettings(localResult[STORAGE_KEYS.SETTINGS]));
              }
            });
            return;
          }
          resolve({ ...DEFAULT_SETTINGS });
          return;
        }

        if (result && result[STORAGE_KEYS.SETTINGS]) {
          resolve(sanitizeSettings(result[STORAGE_KEYS.SETTINGS]));
        } else {
          resolve({ ...DEFAULT_SETTINGS });
        }
      });
    });
  }

  /**
   * Persists settings to Chrome storage with local fallback.
   */
  function setStorageSettings(newSettings) {
    return new Promise((resolve, reject) => {
      const sanitized = sanitizeSettings(newSettings);
      const payload = { [STORAGE_KEYS.SETTINGS]: sanitized };

      const tryLocalFallback = () => {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set(payload, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(sanitized);
            }
          });
        } else {
          resolve(sanitized);
        }
      };

      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set(payload, () => {
          if (chrome.runtime.lastError) {
            console.warn('[GlitterText:Storage] Sync write warning, falling back to local:', chrome.runtime.lastError);
            tryLocalFallback();
          } else {
            if (chrome.storage.local) {
              chrome.storage.local.set(payload, () => {});
            }
            resolve(sanitized);
          }
        });
      } else {
        tryLocalFallback();
      }
    });
  }

  return {
    TEXT_SIZE_LIMITS,
    PRESETS,
    DEFAULT_FAVOURITES,
    DEFAULT_SETTINGS,
    STORAGE_KEYS,
    MESSAGE_ACTIONS,
    sanitizeSettings,
    isRestrictedUrl,
    getStorageSettings,
    setStorageSettings,
    GlitterColorEngine: {
      hexToRgb,
      lighten,
      darken,
      toRgba,
      toHex,
      isValidHex,
      generateGlitterCss
    }
  };
});
