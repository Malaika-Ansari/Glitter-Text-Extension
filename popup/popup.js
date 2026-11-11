/**
 * GlitterText Extension - Customization Dashboard Controller
 * 
 * Manages the luxury dark dashboard, collapsible accordion cards, live preview,
 * custom color synthesis, 2/3-color blending, presets, intensity, density,
 * brightness, animation controls, text sizing, and auto-save feedback toasts.
 */

(function () {
  'use strict';

  const config = window.GlitterConfig || {};
  const {
    TEXT_SIZE_LIMITS,
    PRESETS,
    DEFAULT_SETTINGS,
    STORAGE_KEYS,
    MESSAGE_ACTIONS,
    sanitizeSettings,
    isRestrictedUrl,
    getStorageSettings,
    setStorageSettings,
    GlitterColorEngine
  } = config;

  let currentSettings = { ...DEFAULT_SETTINGS };
  let activeTab = null;
  let liveBroadcastThrottleTimer = null;
  let toastTimer = null;

  // DOM Elements
  const elements = {
    // Header & Status
    statusBadge: document.getElementById('statusBadge'),
    statusDot: document.getElementById('statusDot'),
    restrictedAlert: document.getElementById('restrictedAlert'),
    saveToast: document.getElementById('saveToast'),
    saveToastText: document.getElementById('saveToastText'),

    // Master Switch
    globalToggle: document.getElementById('globalToggle'),
    masterHeading: document.getElementById('masterHeading'),
    masterSubtext: document.getElementById('masterSubtext'),
    controlsPanel: document.getElementById('controlsPanel'),

    // Live Preview
    previewCard: document.getElementById('previewCard'),
    previewHeading: document.getElementById('previewHeading'),
    previewParagraph: document.getElementById('previewParagraph'),
    previewButton: document.getElementById('previewButton'),
    previewLink: document.getElementById('previewLink'),
    previewScaleTag: document.getElementById('previewScaleTag'),
    previewColorPill: document.getElementById('previewColorPill'),
    previewSpeedPill: document.getElementById('previewSpeedPill'),

    // Accordion 1: Palette & Blending
    accordionPaletteCard: document.getElementById('accordionPaletteCard'),
    accordionPaletteHeader: document.getElementById('accordionPaletteHeader'),
    paletteSummaryBadge: document.getElementById('paletteSummaryBadge'),
    blendModeTabs: document.getElementById('blendModeTabs'),
    slotWrap1: document.getElementById('slotWrap1'),
    slotWrap2: document.getElementById('slotWrap2'),
    slotWrap3: document.getElementById('slotWrap3'),
    colorPicker1: document.getElementById('colorPicker1'),
    colorPicker2: document.getElementById('colorPicker2'),
    colorPicker3: document.getElementById('colorPicker3'),
    colorHex1: document.getElementById('colorHex1'),
    colorHex2: document.getElementById('colorHex2'),
    colorHex3: document.getElementById('colorHex3'),
    presetsGrid: document.getElementById('presetsGrid'),
    btnResetGold: document.getElementById('btnResetGold'),
    btnSaveFavourite: document.getElementById('btnSaveFavourite'),
    favouritesChips: document.getElementById('favouritesChips'),

    // Accordion 2: Intensity & Sparkle
    accordionEffectsCard: document.getElementById('accordionEffectsCard'),
    accordionEffectsHeader: document.getElementById('accordionEffectsHeader'),
    effectsSummaryBadge: document.getElementById('effectsSummaryBadge'),
    intensitySlider: document.getElementById('intensitySlider'),
    intensityValueBadge: document.getElementById('intensityValueBadge'),
    intensityPresets: document.getElementById('intensityPresets'),
    brightnessSlider: document.getElementById('brightnessSlider'),
    brightnessValueBadge: document.getElementById('brightnessValueBadge'),

    // Accordion 3: Density & Motion
    accordionMotionCard: document.getElementById('accordionMotionCard'),
    accordionMotionHeader: document.getElementById('accordionMotionHeader'),
    motionSummaryBadge: document.getElementById('motionSummaryBadge'),
    densitySelector: document.getElementById('densitySelector'),
    animationToggle: document.getElementById('animationToggle'),
    animStatusText: document.getElementById('animStatusText'),
    speedSubgroup: document.getElementById('speedSubgroup'),
    speedSelector: document.getElementById('speedSelector'),

    // Accordion 4: Text Size Scaling
    accordionSizeCard: document.getElementById('accordionSizeCard'),
    accordionSizeHeader: document.getElementById('accordionSizeHeader'),
    sizeSummaryBadge: document.getElementById('sizeSummaryBadge'),
    textSizeSlider: document.getElementById('textSizeSlider'),
    sizeValueBadge: document.getElementById('sizeValueBadge'),
    btnDecreaseSize: document.getElementById('btnDecreaseSize'),
    btnIncreaseSize: document.getElementById('btnIncreaseSize'),
    btnResetSize: document.getElementById('btnResetSize'),

    // Master Reset & Active Tab
    btnResetAllDefaults: document.getElementById('btnResetAllDefaults'),
    tabStatusIndicator: document.getElementById('tabStatusIndicator'),
    tabUrlText: document.getElementById('tabUrlText')
  };

  /**
   * Initializes the dashboard.
   */
  async function init() {
    await inspectActiveTab();
    await loadPersistedSettings();
    renderUI();
    bindEvents();
  }

  /**
   * Inspects the active tab to detect restricted URLs.
   */
  async function inspectActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
          activeTab = null;
          resolve();
          return;
        }

        activeTab = tabs[0];
        const url = activeTab.url || '';

        if (isRestrictedUrl(url)) {
          elements.restrictedAlert.style.display = 'flex';
          elements.tabStatusIndicator.textContent = 'Restricted';
          elements.tabUrlText.textContent = getCleanUrlDisplay(url);
        } else {
          elements.restrictedAlert.style.display = 'none';
          elements.tabUrlText.textContent = getCleanUrlDisplay(url);
        }

        resolve();
      });
    });
  }

  function getCleanUrlDisplay(rawUrl) {
    if (!rawUrl) return 'Unknown page';
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'chrome:' || parsed.protocol === 'chrome-extension:') {
        return parsed.href;
      }
      if (parsed.protocol === 'file:') {
        const parts = parsed.pathname.split('/');
        return 'Local: ' + (parts[parts.length - 1] || 'file');
      }
      return parsed.hostname;
    } catch {
      return rawUrl.substring(0, 35);
    }
  }

  /**
   * Loads persisted settings from Chrome Storage API.
   */
  async function loadPersistedSettings() {
    try {
      const data = await getStorageSettings();
      currentSettings = sanitizeSettings(data);
    } catch (err) {
      console.warn('[GlitterText:Popup] Storage read error:', err);
      currentSettings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Renders the complete dashboard interface.
   */
  function renderUI() {
    const isEnabled = Boolean(currentSettings.isEnabled);
    const size = currentSettings.textSize || 16;

    // 1. Master Toggle & Body Class
    elements.globalToggle.checked = isEnabled;
    document.body.classList.toggle('is-active', isEnabled);

    if (isEnabled) {
      elements.statusBadge.textContent = 'ACTIVE';
      elements.masterHeading.textContent = 'GlitterText is Active';
      elements.masterSubtext.textContent = 'Transforming typography on supported websites.';
    } else {
      elements.statusBadge.textContent = 'DISABLED';
      elements.masterHeading.textContent = 'GlitterText is OFF';
      elements.masterSubtext.textContent = 'Original webpage text appearance is preserved.';
    }

    if (activeTab && !isRestrictedUrl(activeTab.url)) {
      elements.tabStatusIndicator.textContent = isEnabled ? 'Engaged' : 'Standby';
    }

    // 2. Blend Mode Tabs
    const tabs = elements.blendModeTabs.querySelectorAll('.blend-tab');
    tabs.forEach(tab => {
      const isSel = tab.dataset.mode === currentSettings.colorMode;
      tab.classList.toggle('active', isSel);
      tab.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });

    // 3. Color Slots Visibility & Values
    const mode = currentSettings.colorMode;
    const colors = currentSettings.colors || ['#e5b842'];

    if (mode === 'rainbow') {
      elements.slotWrap1.style.display = 'none';
      elements.slotWrap2.style.display = 'none';
      elements.slotWrap3.style.display = 'none';
    } else {
      elements.slotWrap1.style.display = 'flex';
      elements.slotWrap2.style.display = (mode === 'dual' || mode === 'triple') ? 'flex' : 'none';
      elements.slotWrap3.style.display = (mode === 'triple') ? 'flex' : 'none';
    }

    elements.colorPicker1.value = colors[0] || '#e5b842';
    elements.colorHex1.textContent = (colors[0] || '#e5b842').toUpperCase();

    if (colors[1]) {
      elements.colorPicker2.value = colors[1];
      elements.colorHex2.textContent = colors[1].toUpperCase();
    }
    if (colors[2]) {
      elements.colorPicker3.value = colors[2];
      elements.colorHex3.textContent = colors[2].toUpperCase();
    }

    // 4. Presets Grid Active State
    const presetPills = elements.presetsGrid.querySelectorAll('.preset-pill');
    presetPills.forEach(pill => {
      const isAct = pill.dataset.preset === currentSettings.activePreset;
      pill.classList.toggle('active', isAct);
    });

    // 5. Saved Favourites List
    renderFavouritesList();

    // 6. Intensity & Brightness
    const intensity = (typeof currentSettings.intensity === 'number') ? currentSettings.intensity : 75;
    elements.intensitySlider.value = intensity;
    elements.intensityValueBadge.textContent = `${intensity}%`;

    const presetBtns = elements.intensityPresets.querySelectorAll('.btn-intensity-preset');
    presetBtns.forEach(btn => {
      const pVal = parseInt(btn.dataset.intensity, 10);
      btn.classList.toggle('active', pVal === intensity);
    });

    const brightness = (typeof currentSettings.sparkleBrightness === 'number') ? currentSettings.sparkleBrightness : 80;
    elements.brightnessSlider.value = brightness;
    elements.brightnessValueBadge.textContent = `${brightness}%`;

    // 7. Particle Density
    const density = currentSettings.particleDensity || 'normal';
    const densityBtns = elements.densitySelector.querySelectorAll('.segment-btn');
    densityBtns.forEach(btn => {
      const isAct = btn.dataset.density === density;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-checked', isAct ? 'true' : 'false');
    });

    // 8. Animation Switch & Speed
    const isAnim = (typeof currentSettings.isAnimationEnabled === 'boolean') ? currentSettings.isAnimationEnabled : true;
    elements.animationToggle.checked = isAnim;
    if (isAnim) {
      elements.animStatusText.textContent = 'Active shimmering sweep';
      elements.speedSubgroup.classList.remove('speed-disabled');
    } else {
      elements.animStatusText.textContent = 'Static glitter texture';
      elements.speedSubgroup.classList.add('speed-disabled');
    }

    const speed = currentSettings.animationSpeed || 'normal';
    const speedBtns = elements.speedSelector.querySelectorAll('.segment-btn');
    speedBtns.forEach(btn => {
      const isAct = btn.dataset.speed === speed;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-checked', isAct ? 'true' : 'false');
    });

    // 9. Text Size Controls
    elements.textSizeSlider.value = size;
    elements.sizeValueBadge.textContent = `${size}px`;

    const minVal = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MIN) || 10;
    const maxVal = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MAX) || 50;
    elements.btnDecreaseSize.disabled = (size <= minVal);
    elements.btnIncreaseSize.disabled = (size >= maxVal);

    // Synchronize slider progress fills
    updateSliderProgress(elements.intensitySlider, 0, 100, intensity);
    updateSliderProgress(elements.brightnessSlider, 0, 100, brightness);
    updateSliderProgress(elements.textSizeSlider, minVal, maxVal, size);

    // 10. Update Accordion Summary Badges
    updateAccordionBadges();

    // 11. Live Preview
    renderLivePreview(size);
  }

  /**
   * Updates summary badges on collapsible accordion headers.
   */
  function updateAccordionBadges() {
    // Palette badge
    let paletteText = 'Metallic Gold';
    if (currentSettings.colorMode === 'rainbow') {
      paletteText = 'Rainbow';
    } else if (currentSettings.activePreset && PRESETS[currentSettings.activePreset]) {
      paletteText = PRESETS[currentSettings.activePreset].name;
    } else if (currentSettings.colorMode === 'dual') {
      paletteText = 'Dual Blend';
    } else if (currentSettings.colorMode === 'triple') {
      paletteText = 'Triple Blend';
    } else if (currentSettings.colors && currentSettings.colors[0]) {
      paletteText = currentSettings.colors[0].toUpperCase();
    }
    elements.paletteSummaryBadge.textContent = paletteText;
    elements.previewColorPill.textContent = paletteText;

    // Effects badge
    elements.effectsSummaryBadge.textContent = `${currentSettings.intensity}% • ${currentSettings.sparkleBrightness}% Bright`;

    // Motion badge
    const densityCap = currentSettings.particleDensity.charAt(0).toUpperCase() + currentSettings.particleDensity.slice(1);
    const speedCap = currentSettings.animationSpeed.charAt(0).toUpperCase() + currentSettings.animationSpeed.slice(1);
    if (currentSettings.isAnimationEnabled) {
      elements.motionSummaryBadge.textContent = `${densityCap} • ${speedCap}`;
      elements.previewSpeedPill.textContent = `${speedCap} (${currentSettings.animationSpeed === 'slow' ? '8.5s' : currentSettings.animationSpeed === 'fast' ? '3.0s' : '5.5s'})`;
    } else {
      elements.motionSummaryBadge.textContent = `${densityCap} • Static`;
      elements.previewSpeedPill.textContent = 'Static Texture';
    }

    // Size badge
    elements.sizeSummaryBadge.textContent = `${currentSettings.textSize}px`;
  }

  /**
   * Displays the auto-save feedback toast.
   */
  function showSaveFeedback(message = 'Settings Saved') {
    if (!elements.saveToast) return;
    elements.saveToastText.textContent = message;
    elements.saveToast.classList.add('visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.saveToast.classList.remove('visible');
    }, 1400);
  }

  /**
   * Updates CSS range fill track progress.
   */
  function updateSliderProgress(slider, min, max, val) {
    if (!slider) return;
    const clamped = Math.min(max, Math.max(min, val));
    const percent = ((clamped - min) / (max - min)) * 100;
    slider.style.setProperty('--fill-percent', `${percent}%`);
  }

  /**
   * Renders saved favourite color combinations.
   */
  function renderFavouritesList() {
    elements.favouritesChips.textContent = '';
    const favs = currentSettings.favourites || [];

    if (favs.length === 0) {
      const emptyWrap = document.createElement('div');
      emptyWrap.className = 'empty-favourites-wrap';
      emptyWrap.setAttribute('role', 'status');

      const star = document.createElement('span');
      star.className = 'empty-star-icon';
      star.textContent = '★';
      star.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      text.className = 'empty-text';
      text.textContent = 'No saved favourites yet. Click "★ Save Favourite" to store your blend.';

      emptyWrap.appendChild(star);
      emptyWrap.appendChild(text);
      elements.favouritesChips.appendChild(emptyWrap);
      return;
    }

    favs.forEach((fav, index) => {
      const chip = document.createElement('div');
      chip.className = 'fav-chip';
      chip.title = `Apply ${fav.name}`;

      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'fav-dots';

      if (fav.mode === 'rainbow') {
        const dot = document.createElement('span');
        dot.className = 'fav-dot rainbow-swatch';
        dotsContainer.appendChild(dot);
      } else {
        (fav.colors || ['#e5b842']).forEach(col => {
          const dot = document.createElement('span');
          dot.className = 'fav-dot';
          dot.style.backgroundColor = col;
          dotsContainer.appendChild(dot);
        });
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'fav-name';
      nameSpan.textContent = fav.name || `Fav #${index + 1}`;

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-del-fav';
      delBtn.textContent = '×';
      delBtn.title = 'Delete favourite';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentSettings.favourites.splice(index, 1);
        renderFavouritesList();
        persistAndBroadcast('Favourite Removed');
      });

      chip.appendChild(dotsContainer);
      chip.appendChild(nameSpan);
      chip.appendChild(delBtn);

      chip.addEventListener('click', () => {
        currentSettings.colorMode = fav.mode || 'single';
        currentSettings.colors = [...fav.colors];
        currentSettings.activePreset = 'custom';
        renderUI();
        persistAndBroadcast(`Applied ${fav.name}`);
      });

      elements.favouritesChips.appendChild(chip);
    });
  }

  /**
   * Updates the Live Preview box with dynamic glitter particles and size.
   */
  function renderLivePreview(baseSize) {
    const minVal = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MIN) || 10;
    const maxVal = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MAX) || 50;

    const ratio = baseSize / 16;
    const headingSize = Math.min(maxVal, Math.max(minVal, Math.round(18 * ratio)));
    const paragraphSize = Math.min(maxVal, Math.max(minVal, Math.round(12.5 * ratio)));
    const btnSize = Math.min(maxVal, Math.max(minVal, Math.round(11 * ratio)));

    elements.previewHeading.style.fontSize = `${headingSize}px`;
    elements.previewParagraph.style.fontSize = `${paragraphSize}px`;
    elements.previewButton.style.fontSize = `${btnSize}px`;
    elements.previewLink.style.fontSize = `${btnSize}px`;

    if (currentSettings.isEnabled) {
      elements.previewScaleTag.textContent = `Scale: ${baseSize}px (H1: ${headingSize}px, P: ${paragraphSize}px)`;
    } else {
      elements.previewScaleTag.textContent = 'Standby (Original Preview)';
    }

    // Inject dynamic styles for preview
    updatePopupPreviewGlitterStyle();
  }

  /**
   * Injects dynamic CSS rules for popup preview elements.
   */
  function updatePopupPreviewGlitterStyle() {
    if (!GlitterColorEngine || !GlitterColorEngine.generateGlitterCss) return;

    let styleEl = document.getElementById('glitter-popup-preview-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'glitter-popup-preview-style';
      document.head.appendChild(styleEl);
    }

    const previewSelector = 'body.is-active .preview-heading, body.is-active .preview-paragraph, body.is-active .preview-link, body.is-active .preview-btn';
    const cssRules = GlitterColorEngine.generateGlitterCss(
      currentSettings,
      previewSelector
    );
    styleEl.textContent = cssRules;
  }

  /**
   * Binds interaction events for all controls.
   */
  function bindEvents() {
    const minVal = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MIN) || 10;
    const maxVal = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.MAX) || 50;

    // 1. Accordion Toggles
    const setupAccordion = (headerEl, cardEl) => {
      headerEl.addEventListener('click', () => {
        const isOpen = cardEl.classList.contains('open');
        cardEl.classList.toggle('open', !isOpen);
        headerEl.setAttribute('aria-expanded', (!isOpen).toString());
      });
    };

    setupAccordion(elements.accordionPaletteHeader, elements.accordionPaletteCard);
    setupAccordion(elements.accordionEffectsHeader, elements.accordionEffectsCard);
    setupAccordion(elements.accordionMotionHeader, elements.accordionMotionCard);
    setupAccordion(elements.accordionSizeHeader, elements.accordionSizeCard);

    // 2. Master Global ON/OFF Toggle
    elements.globalToggle.addEventListener('change', async (e) => {
      currentSettings.isEnabled = e.target.checked;
      currentSettings.lastToggledAt = Date.now();
      renderUI();
      await persistAndBroadcast(currentSettings.isEnabled ? 'GlitterText Enabled' : 'GlitterText Disabled');
    });

    // 3. Blend Mode Tabs
    elements.blendModeTabs.addEventListener('click', async (e) => {
      const tab = e.target.closest('.blend-tab');
      if (!tab || !tab.dataset.mode) return;

      const mode = tab.dataset.mode;
      currentSettings.colorMode = mode;
      currentSettings.activePreset = (mode === 'rainbow') ? 'rainbow' : 'custom';

      if (mode === 'single') {
        currentSettings.colors = [currentSettings.colors[0] || '#e5b842'];
      } else if (mode === 'dual') {
        currentSettings.colors = [
          currentSettings.colors[0] || '#e5b842',
          currentSettings.colors[1] || '#00b894'
        ];
      } else if (mode === 'triple') {
        currentSettings.colors = [
          currentSettings.colors[0] || '#e5b842',
          currentSettings.colors[1] || '#00b894',
          currentSettings.colors[2] || '#d63031'
        ];
      }

      renderUI();
      await persistAndBroadcast('Blend Mode Updated');
    });

    // 4. Native Color Pickers
    const setupColorPicker = (inputEl, hexEl, index) => {
      inputEl.addEventListener('input', (e) => {
        const val = e.target.value;
        currentSettings.colors[index] = val;
        currentSettings.activePreset = 'custom';
        hexEl.textContent = val.toUpperCase();

        const presetPills = elements.presetsGrid.querySelectorAll('.preset-pill');
        presetPills.forEach(pill => pill.classList.remove('active'));

        updateAccordionBadges();
        updatePopupPreviewGlitterStyle();
        throttleActiveTabUpdate();
      });

      inputEl.addEventListener('change', async () => {
        await persistAndBroadcast('Custom Colour Applied');
      });
    };

    setupColorPicker(elements.colorPicker1, elements.colorHex1, 0);
    setupColorPicker(elements.colorPicker2, elements.colorHex2, 1);
    setupColorPicker(elements.colorPicker3, elements.colorHex3, 2);

    // 5. Presets Grid
    elements.presetsGrid.addEventListener('click', async (e) => {
      const pill = e.target.closest('.preset-pill');
      if (!pill || !pill.dataset.preset) return;

      const presetId = pill.dataset.preset;
      const preset = PRESETS[presetId];
      if (!preset) return;

      currentSettings.activePreset = presetId;
      currentSettings.colorMode = preset.mode;
      currentSettings.colors = [...preset.colors];

      renderUI();
      await persistAndBroadcast(`Preset: ${preset.name}`);
    });

    // 6. Reset to Default Gold
    elements.btnResetGold.addEventListener('click', async () => {
      currentSettings.activePreset = 'metallic-gold';
      currentSettings.colorMode = 'single';
      currentSettings.colors = ['#e5b842'];

      renderUI();
      await persistAndBroadcast('Restored 24K Classic Gold');
    });

    // 7. Save Favourite Button
    elements.btnSaveFavourite.addEventListener('click', async () => {
      const mode = currentSettings.colorMode;
      const count = (currentSettings.favourites || []).length + 1;
      let defaultName = `Custom ${mode.toUpperCase()} #${count}`;

      if (currentSettings.activePreset && currentSettings.activePreset !== 'custom') {
        const p = PRESETS[currentSettings.activePreset];
        if (p) defaultName = p.name;
      }

      const name = prompt('Name your favourite colour combination:', defaultName);
      if (!name || !name.trim()) return;

      if (!Array.isArray(currentSettings.favourites)) {
        currentSettings.favourites = [];
      }

      currentSettings.favourites.push({
        id: 'fav_' + Date.now(),
        name: name.trim().substring(0, 25),
        mode: currentSettings.colorMode,
        colors: [...currentSettings.colors]
      });

      renderFavouritesList();
      await persistAndBroadcast('Favourite Saved');
    });

    // 8. Intensity Slider & Presets
    elements.intensitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      currentSettings.intensity = Math.min(100, Math.max(0, val));
      elements.intensityValueBadge.textContent = `${currentSettings.intensity}%`;
      updateSliderProgress(elements.intensitySlider, 0, 100, currentSettings.intensity);

      const presetBtns = elements.intensityPresets.querySelectorAll('.btn-intensity-preset');
      presetBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.intensity, 10) === currentSettings.intensity);
      });

      updateAccordionBadges();
      updatePopupPreviewGlitterStyle();
      throttleActiveTabUpdate();
    });

    elements.intensitySlider.addEventListener('change', async () => {
      await persistAndBroadcast('Intensity Updated');
    });

    elements.intensityPresets.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-intensity-preset');
      if (!btn || !btn.dataset.intensity) return;

      currentSettings.intensity = parseInt(btn.dataset.intensity, 10);
      renderUI();
      await persistAndBroadcast(`Intensity: ${btn.textContent.trim()}`);
    });

    // 9. Sparkle Brightness Slider
    elements.brightnessSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      currentSettings.sparkleBrightness = Math.min(100, Math.max(0, val));
      elements.brightnessValueBadge.textContent = `${currentSettings.sparkleBrightness}%`;
      updateSliderProgress(elements.brightnessSlider, 0, 100, currentSettings.sparkleBrightness);

      updateAccordionBadges();
      updatePopupPreviewGlitterStyle();
      throttleActiveTabUpdate();
    });

    elements.brightnessSlider.addEventListener('change', async () => {
      await persistAndBroadcast('Brightness Updated');
    });

    // 10. Particle Density Selector
    elements.densitySelector.addEventListener('click', async (e) => {
      const btn = e.target.closest('.segment-btn');
      if (!btn || !btn.dataset.density) return;

      currentSettings.particleDensity = btn.dataset.density;
      renderUI();
      await persistAndBroadcast(`Density: ${currentSettings.particleDensity}`);
    });

    // 11. Shimmer Animation Switch & Speed Selector
    elements.animationToggle.addEventListener('change', async (e) => {
      currentSettings.isAnimationEnabled = e.target.checked;
      renderUI();
      await persistAndBroadcast(currentSettings.isAnimationEnabled ? 'Shimmer Animation ON' : 'Static Texture (Animation OFF)');
    });

    elements.speedSelector.addEventListener('click', async (e) => {
      const btn = e.target.closest('.segment-btn');
      if (!btn || !btn.dataset.speed) return;

      currentSettings.animationSpeed = btn.dataset.speed;
      renderUI();
      await persistAndBroadcast(`Speed: ${currentSettings.animationSpeed}`);
    });

    // 12. Text Size Slider & Steppers
    elements.textSizeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      currentSettings.textSize = Math.min(maxVal, Math.max(minVal, val));
      currentSettings.isTextSizeCustomized = true;

      elements.sizeValueBadge.textContent = `${currentSettings.textSize}px`;
      elements.btnDecreaseSize.disabled = (currentSettings.textSize <= minVal);
      elements.btnIncreaseSize.disabled = (currentSettings.textSize >= maxVal);
      updateSliderProgress(elements.textSizeSlider, minVal, maxVal, currentSettings.textSize);

      updateAccordionBadges();
      renderLivePreview(currentSettings.textSize);
      throttleActiveTabUpdate();
    });

    elements.textSizeSlider.addEventListener('change', async () => {
      await persistAndBroadcast(`Text Size: ${currentSettings.textSize}px`);
    });

    elements.btnDecreaseSize.addEventListener('click', async () => {
      if (currentSettings.textSize > minVal) {
        currentSettings.textSize = Math.max(minVal, currentSettings.textSize - 1);
        currentSettings.isTextSizeCustomized = true;
        renderUI();
        await persistAndBroadcast(`Text Size: ${currentSettings.textSize}px`);
      }
    });

    elements.btnIncreaseSize.addEventListener('click', async () => {
      if (currentSettings.textSize < maxVal) {
        currentSettings.textSize = Math.min(maxVal, currentSettings.textSize + 1);
        currentSettings.isTextSizeCustomized = true;
        renderUI();
        await persistAndBroadcast(`Text Size: ${currentSettings.textSize}px`);
      }
    });

    elements.btnResetSize.addEventListener('click', async () => {
      currentSettings.textSize = (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.DEFAULT) || 16;
      currentSettings.isTextSizeCustomized = false;
      renderUI();

      if (activeTab && activeTab.id && !isRestrictedUrl(activeTab.url)) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: MESSAGE_ACTIONS.RESET_TEXT_SIZE
        }).catch(() => {});
      }

      await persistAndBroadcast('Restored Native Text Size');
    });

    // 13. Master Reset to Default Settings
    elements.btnResetAllDefaults.addEventListener('click', async () => {
      const confirmReset = confirm('Reset all GlitterText settings back to factory defaults?');
      if (!confirmReset) return;

      currentSettings = {
        ...DEFAULT_SETTINGS,
        isEnabled: currentSettings.isEnabled // Preserve user toggle state
      };

      renderUI();

      if (activeTab && activeTab.id && !isRestrictedUrl(activeTab.url)) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: MESSAGE_ACTIONS.RESET_ALL_DEFAULTS
        }).catch(() => {});
      }

      chrome.runtime.sendMessage({
        action: MESSAGE_ACTIONS.RESET_ALL_DEFAULTS
      }).catch(() => {});

      await persistAndBroadcast('Reset to Default Settings');
    });

    // 14. Cross-tab storage change listener
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (changes[STORAGE_KEYS.SETTINGS]) {
          const updated = sanitizeSettings(changes[STORAGE_KEYS.SETTINGS].newValue);
          currentSettings = updated;
          renderUI();
        }
      });
    }
  }

  /**
   * Throttles real-time updates to active tab during color picking or sliding.
   */
  function throttleActiveTabUpdate() {
    if (liveBroadcastThrottleTimer) return;

    liveBroadcastThrottleTimer = requestAnimationFrame(() => {
      liveBroadcastThrottleTimer = null;
      if (activeTab && activeTab.id && !isRestrictedUrl(activeTab.url) && currentSettings.isEnabled) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: MESSAGE_ACTIONS.SETTINGS_CHANGED,
          settings: currentSettings
        }).catch(() => {});
      }
    });
  }

  /**
   * Persists settings to storage, broadcasts to all tabs, and displays saved feedback.
   */
  async function persistAndBroadcast(toastMessage = 'Settings Saved') {
    try {
      await setStorageSettings(currentSettings);
      showSaveFeedback(toastMessage);

      if (activeTab && activeTab.id && !isRestrictedUrl(activeTab.url)) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: MESSAGE_ACTIONS.SETTINGS_CHANGED,
          settings: currentSettings
        }).catch(() => {});
      }

      chrome.runtime.sendMessage({
        action: MESSAGE_ACTIONS.UPDATE_SETTINGS,
        settings: currentSettings
      }).catch(() => {});
    } catch (err) {
      console.error('[GlitterText:Popup] Storage write error:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
