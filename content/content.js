/**
 * GlitterText Extension - Content Script
 * 
 * Manages the realistic glitter typography engine, dynamic color/blending injection,
 * and non-destructive text-size scaling.
 * 
 * Strict non-destructive design & modern SPA compatibility:
 * - Compatible with Google Search, YouTube, Facebook, Instagram, LinkedIn, Gmail, Wikipedia, news & blogs.
 * - Safely targets readable text: headings, paragraphs, links, lists, labels, and buttons.
 * - Strictly excludes images, SVGs, icons, logos, canvas, video, hidden elements, and editable content.
 * - Completely avoids duplicate effects on nested elements via ancestor clipping checks and CSS guards.
 * - Preserves website backgrounds, dimensions, positioning, margins, padding, borders, shadows, and fonts.
 * - Efficiently supports dynamic text using a batched MutationObserver and SPA navigation listeners.
 * - 100% reliably restores original styling when OFF or reset, leaving zero residual styles behind.
 */

(function () {
  'use strict';

  // Guard against duplicate injection
  if (window.__glitterTextInitialized) {
    return;
  }
  window.__glitterTextInitialized = true;

  const config = window.GlitterConfig || {};
  const {
    DEFAULT_SETTINGS,
    TEXT_SIZE_LIMITS,
    STORAGE_KEYS,
    MESSAGE_ACTIONS,
    getStorageSettings,
    GlitterColorEngine
  } = config;

  /**
   * Current active settings state
   */
  let state = {
    isEnabled: DEFAULT_SETTINGS ? DEFAULT_SETTINGS.isEnabled : false,
    textSize: DEFAULT_SETTINGS ? DEFAULT_SETTINGS.textSize : 16,
    isTextSizeCustomized: false,
    colorMode: 'single',
    activePreset: 'metallic-gold',
    colors: ['#e5b842'],
    intensity: 75,
    particleDensity: 'normal',
    sparkleBrightness: 80,
    animationSpeed: 'normal',
    isAnimationEnabled: true
  };

  /**
   * SPA MutationObserver instance & queue
   */
  let domObserver = null;
  let observerBatchTimer = null;
  let pendingMutatedNodes = new Set();

  /**
   * Protected tags that must NEVER be modified or scanned
   */
  const EXCLUDED_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT',
    'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'SVG', 'PATH', 'CANVAS',
    'VIDEO', 'AUDIO', 'IMG', 'PICTURE', 'OBJECT', 'IFRAME', 'EMBED',
    'MATH', 'MAP', 'AREA', 'TRACK', 'SOURCE', 'PORTAL'
  ]);

  /**
   * CSS selector targeting readable text elements: headings, paragraphs,
   * buttons, links, lists, blockquotes, labels, and text containers.
   */
  const TARGET_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, a, button, [role="button"], label, blockquote, caption, figcaption, cite, summary, span, b, strong, em, i, mark, small, time';

  /**
   * Dynamic Color Stylesheet ID
   */
  const DYNAMIC_STYLE_ID = 'glitter-dynamic-colors';

  /**
   * Bootstraps the content script.
   */
  async function init() {
    try {
      const persisted = await getStorageSettings();
      state = { ...state, ...persisted };

      if (state.isEnabled) {
        applyGlitterSystem();
      } else {
        restoreOriginalState();
      }
    } catch (err) {
      console.warn('[GlitterText:Content] Initialization warning:', err);
    }

    // Direct messaging listener (popup / background service worker)
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    // Multi-tab sync via Chrome Storage API
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // SPA Navigation Listeners (YouTube, Facebook, Twitter, GitHub, general HTML5 pushState)
    window.addEventListener('popstate', handleSpaNavigation, { passive: true });
    window.addEventListener('hashchange', handleSpaNavigation, { passive: true });
    document.addEventListener('yt-navigate-finish', handleSpaNavigation, { passive: true });
  }

  /**
   * Handles incoming runtime messages.
   */
  function handleRuntimeMessage(message, sender, sendResponse) {
    if (!message || !message.action) {
      return false;
    }

    switch (message.action) {
      case MESSAGE_ACTIONS.SETTINGS_CHANGED:
      case MESSAGE_ACTIONS.UPDATE_SETTINGS:
        if (message.settings) {
          syncState(message.settings);
          sendResponse({ success: true, state });
        }
        break;

      case MESSAGE_ACTIONS.TOGGLE_STATE:
        state.isEnabled = !state.isEnabled;
        if (state.isEnabled) {
          applyGlitterSystem();
        } else {
          restoreOriginalState();
        }
        sendResponse({ success: true, isEnabled: state.isEnabled });
        break;

      case MESSAGE_ACTIONS.RESET_TEXT_SIZE:
        state.textSize = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.DEFAULT) || 16;
        state.isTextSizeCustomized = false;
        clearAllFontSizeOverrides();
        sendResponse({ success: true, state });
        break;

      case MESSAGE_ACTIONS.RESET_DEFAULT_GOLD:
        state.colorMode = 'single';
        state.activePreset = 'metallic-gold';
        state.colors = ['#e5b842'];
        state.intensity = 75;
        state.particleDensity = 'normal';
        state.sparkleBrightness = 80;
        state.animationSpeed = 'normal';
        state.isAnimationEnabled = true;
        updateDynamicGlitterStyle();
        sendResponse({ success: true, state });
        break;

      case MESSAGE_ACTIONS.RESET_ALL_DEFAULTS:
        state = {
          ...DEFAULT_SETTINGS,
          isEnabled: state.isEnabled,
          lastToggledAt: state.lastToggledAt
        };
        clearAllFontSizeOverrides();
        updateDynamicGlitterStyle();
        sendResponse({ success: true, state });
        break;

      case MESSAGE_ACTIONS.GET_SETTINGS:
        sendResponse({ success: true, settings: state });
        break;

      default:
        break;
    }

    return true;
  }

  /**
   * Multi-tab storage sync handler.
   */
  function handleStorageChange(changes) {
    if (changes && changes[STORAGE_KEYS.SETTINGS]) {
      const updated = changes[STORAGE_KEYS.SETTINGS].newValue;
      if (updated) {
        syncState(updated);
      }
    }
  }

  /**
   * Synchronizes local state and triggers DOM updates.
   */
  function syncState(newSettings) {
    state = { ...state, ...newSettings };

    if (state.isEnabled) {
      applyGlitterSystem();
    } else {
      restoreOriginalState();
    }
  }

  /**
   * Injects or updates the dynamic glitter color stylesheet in document.head.
   */
  function updateDynamicGlitterStyle() {
    if (!GlitterColorEngine || !GlitterColorEngine.generateGlitterCss) return;

    let styleEl = document.getElementById(DYNAMIC_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = DYNAMIC_STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }

    const cssRules = GlitterColorEngine.generateGlitterCss(
      state,
      '.glitter-text-active .glitter-text-applied'
    );
    styleEl.textContent = cssRules;
  }

  /**
   * Removes the dynamic glitter color stylesheet.
   */
  function removeDynamicGlitterStyle() {
    const styleEl = document.getElementById(DYNAMIC_STYLE_ID);
    if (styleEl) {
      styleEl.remove();
    }
  }

  /**
   * Calculates the appropriate proportional target font-size.
   */
  function calculateTargetSize(originalSize, baseTargetSize) {
    const minLimit = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MIN) || 10;
    const maxLimit = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MAX) || 50;
    const defaultBase = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.DEFAULT) || 16;

    const ratio = baseTargetSize / defaultBase;
    const scaled = Math.round(originalSize * ratio);

    return Math.min(maxLimit, Math.max(minLimit, scaled));
  }

  /**
   * Activates the realistic glitter typography engine and applies text sizes.
   */
  function applyGlitterSystem() {
    const root = document.documentElement;
    if (!root) return;

    root.classList.add('glitter-text-active');

    // 1. Inject or update dynamic color palette
    updateDynamicGlitterStyle();

    // 2. Process typography elements across the page
    scanAndApplyGlitter(document.body);

    // 3. Watch for dynamically loaded content (SPAs)
    startDomObserver();
  }

  /**
   * Evaluates whether an element is an editable input or technical block.
   */
  function isEditableOrInput(el) {
    if (el.isContentEditable) return true;
    if (el.getAttribute('contenteditable') === 'true') return true;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;

    // Social media comments, Gmail compose, Google Docs editors
    if (el.closest('[contenteditable="true"], [role="textbox"], [role="combobox"], .editable, [g_editable="true"], .kix-appview, .docs-texteventtarget-iframe, .msg-form__contenteditable')) {
      return true;
    }
    return false;
  }

  /**
   * Evaluates whether an element is an icon, SVG, logo, badge, avatar or media.
   */
  function isMediaOrIconElement(el) {
    if (EXCLUDED_TAGS.has(el.tagName)) return true;

    // Check icon classes (FontAwesome, Material Icons, Bootstrap, etc.)
    const cls = typeof el.className === 'string' ? el.className.toLowerCase() : '';
    if (
      cls.includes('material-icons') ||
      cls.includes('fa-') ||
      cls.includes('glyphicon') ||
      cls.includes('feather') ||
      cls.includes('emoji') ||
      cls.includes('symbol') ||
      cls.includes('badge') ||
      cls.includes('avatar')
    ) {
      return true;
    }

    // Check aria-hidden with short symbol text
    if (el.getAttribute('aria-hidden') === 'true' && el.textContent.trim().length <= 3) {
      return true;
    }

    return false;
  }

  /**
   * Evaluates whether an element is inside code, math or preformatted technical blocks.
   */
  function isCodeOrMath(el) {
    return Boolean(el.closest('pre, code, kbd, samp, var, math, .mwe-math-element, .hljs, [class*="highlight"]'));
  }

  /**
   * Evaluates whether an element is visually visible in layout.
   */
  function isElementVisible(el) {
    if (el.offsetWidth === 0 && el.offsetHeight === 0) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluates whether a container element (like button or a) directly houses media.
   * If true, we avoid tagging the container itself so its background color & icon remain 100% native.
   */
  function hasMediaChild(el) {
    return Boolean(el.querySelector('svg, img, picture, canvas, video, audio, iframe'));
  }

  /**
   * Checks if an ancestor element is already tagged with glitter.
   * Crucial for eliminating duplicate gradient stacking on nested elements.
   */
  function hasGlitterAncestor(el) {
    return Boolean(el.parentElement && el.parentElement.closest('.glitter-text-applied'));
  }

  /**
   * Scans a container for readable text elements, tags them for glitter clipping,
   * caches native font sizes once, and applies text-size adjustments if customized.
   */
  function scanAndApplyGlitter(container) {
    if (!container || !state.isEnabled) return;
    if (container.nodeType !== Node.ELEMENT_NODE) return;

    // Check if container itself is excluded
    if (EXCLUDED_TAGS.has(container.tagName)) return;
    if (isEditableOrInput(container)) return;
    if (isCodeOrMath(container)) return;

    const descendants = container.querySelectorAll(TARGET_SELECTOR);
    const elements = (container.matches && container.matches(TARGET_SELECTOR))
      ? [container, ...descendants]
      : descendants;
    const targetBase = state.textSize;
    const isCustomSize = Boolean(state.isTextSizeCustomized || targetBase !== 16);

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      // 1. Exclude protected non-text, media, icon, code, or math tags
      if (EXCLUDED_TAGS.has(el.tagName)) continue;
      if (isEditableOrInput(el)) continue;
      if (isCodeOrMath(el)) continue;
      if (isMediaOrIconElement(el)) continue;

      // 2. Exclude hidden elements
      if (!isElementVisible(el)) continue;

      // 3. Avoid duplicate effects on nested elements:
      // If an ancestor is already tagged with .glitter-text-applied, skip this child!
      if (hasGlitterAncestor(el)) continue;

      // 4. If container (e.g. button or a) holds an SVG or image, do NOT tag the container!
      // Its text child elements will receive the glitter tag while the container preserves native backgrounds & icons.
      if ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') && hasMediaChild(el)) {
        continue;
      }

      // 5. Check text readability
      const text = el.textContent;
      if (!text || !text.trim()) continue;

      // 6. Cache untouched native font-size once to prevent cumulative scaling
      if (!el.dataset.glitterOrigSize) {
        const computed = window.getComputedStyle(el).fontSize;
        const parsed = parseFloat(computed) || 16;
        el.dataset.glitterOrigSize = parsed.toString();

        // Preserve original inline font-size if website had one
        if (el.style.fontSize) {
          el.dataset.glitterInitialInlineSize = el.style.fontSize;
        }
      }

      // 7. Attach glitter particle marker class
      if (!el.classList.contains('glitter-text-applied')) {
        el.classList.add('glitter-text-applied');
      }

      // 8. Apply text-size scaling if customized
      if (isCustomSize) {
        const origSize = parseFloat(el.dataset.glitterOrigSize) || 16;
        const targetPx = calculateTargetSize(origSize, targetBase);
        const targetStr = targetPx + 'px';

        if (el.style.fontSize !== targetStr) {
          el.style.setProperty('font-size', targetStr, 'important');
        }
      } else {
        if (el.dataset.glitterInitialInlineSize) {
          if (el.style.fontSize !== el.dataset.glitterInitialInlineSize) {
            el.style.fontSize = el.dataset.glitterInitialInlineSize;
          }
        } else if (el.style.fontSize) {
          el.style.removeProperty('font-size');
        }
      }
    }
  }

  /**
   * Completely restores original native appearance across the entire webpage.
   * Guarantees zero residual styles or DOM modifications left behind.
   */
  function restoreOriginalState() {
    const root = document.documentElement;
    if (root) {
      root.classList.remove('glitter-text-active');
    }

    stopDomObserver();
    removeDynamicGlitterStyle();
    removeAllGlitterMarkers();
    clearAllFontSizeOverrides();
  }

  /**
   * Removes glitter marker classes from all elements.
   */
  function removeAllGlitterMarkers() {
    const tagged = document.querySelectorAll('.glitter-text-applied');
    for (let i = 0; i < tagged.length; i++) {
      tagged[i].classList.remove('glitter-text-applied');
    }
  }

  /**
   * Removes all inline font-size overrides from tagged elements and restores initial inline styles.
   */
  function clearAllFontSizeOverrides() {
    const tagged = document.querySelectorAll('[data-glitter-orig-size]');
    for (let i = 0; i < tagged.length; i++) {
      const el = tagged[i];
      if (el.dataset.glitterInitialInlineSize) {
        el.style.fontSize = el.dataset.glitterInitialInlineSize;
        delete el.dataset.glitterInitialInlineSize;
      } else {
        el.style.removeProperty('font-size');
      }
      delete el.dataset.glitterOrigSize;
    }
  }

  /**
   * Batched MutationObserver for SPAs (YouTube, Facebook, Google Search, etc.).
   * Efficiently handles high-frequency DOM additions without main-thread blocking.
   */
  function startDomObserver() {
    if (domObserver || !document.body) return;

    domObserver = new MutationObserver((mutations) => {
      if (!state.isEnabled) return;

      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.type === 'childList') {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (EXCLUDED_TAGS.has(node.tagName)) continue;
              if (isEditableOrInput(node)) continue;
              pendingMutatedNodes.add(node);
            }
          }
        }
      }

      if (pendingMutatedNodes.size > 0 && !observerBatchTimer) {
        observerBatchTimer = requestAnimationFrame(() => {
          observerBatchTimer = null;
          if (!state.isEnabled) {
            pendingMutatedNodes.clear();
            return;
          }

          const nodesToScan = Array.from(pendingMutatedNodes);
          pendingMutatedNodes.clear();

          for (let k = 0; k < nodesToScan.length; k++) {
            const node = nodesToScan[k];
            if (node.isConnected) {
              scanAndApplyGlitter(node);
            }
          }
        });
      }
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Stops the MutationObserver and clears pending queues when OFF.
   */
  function stopDomObserver() {
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }
    if (observerBatchTimer) {
      cancelAnimationFrame(observerBatchTimer);
      observerBatchTimer = null;
    }
    pendingMutatedNodes.clear();
  }

  /**
   * SPA Navigation Handler (YouTube video transitions, Facebook/Twitter page updates).
   */
  function handleSpaNavigation() {
    if (!state.isEnabled) return;

    // Small delay allows SPA router to mount new DOM
    setTimeout(() => {
      if (state.isEnabled && document.body) {
        scanAndApplyGlitter(document.body);
      }
    }, 120);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
