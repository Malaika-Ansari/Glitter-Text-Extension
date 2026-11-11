/**
 * GlitterText Extension - Background Service Worker (Manifest V3)
 * 
 * Manages extension lifecycle, coordinates global ON/OFF state persistence,
 * and broadcasts real-time state changes across all active browser tabs.
 */

// Import shared configuration and storage utilities
importScripts('../shared/config.js');

const {
  DEFAULT_SETTINGS,
  TEXT_SIZE_LIMITS,
  STORAGE_KEYS,
  MESSAGE_ACTIONS,
  sanitizeSettings,
  isRestrictedUrl,
  getStorageSettings,
  setStorageSettings
} = globalThis.GlitterConfig;

/**
 * Extension installation and upgrade lifecycle handler.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.info(`[GlitterText:Background] Lifecycle event: ${details.reason}`);

  try {
    const existing = await getStorageSettings();
    if (!existing || typeof existing.isEnabled !== 'boolean') {
      const initialized = { ...DEFAULT_SETTINGS };
      await setStorageSettings(initialized);
      console.info('[GlitterText:Background] Fresh default settings initialized:', initialized);
    } else {
      console.info('[GlitterText:Background] Persisted settings loaded. Active state:', existing.isEnabled ? 'ON' : 'OFF');
    }
  } catch (err) {
    console.error('[GlitterText:Background] Error during setup:', err);
  }
});

/**
 * Cross-environment message routing.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) {
    return false;
  }

  switch (message.action) {
    case MESSAGE_ACTIONS.GET_SETTINGS: {
      getStorageSettings()
        .then((settings) => sendResponse({ success: true, settings }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }

    case MESSAGE_ACTIONS.TOGGLE_STATE: {
      getStorageSettings()
        .then(async (current) => {
          const nextState = {
            ...current,
            isEnabled: !current.isEnabled,
            lastToggledAt: Date.now()
          };
          const saved = await setStorageSettings(nextState);
          await broadcastStateToAllTabs(saved);
          sendResponse({ success: true, settings: saved });
        })
        .catch((error) => {
          console.error('[GlitterText:Background] Toggle error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    case MESSAGE_ACTIONS.RESET_TEXT_SIZE: {
      getStorageSettings()
        .then(async (current) => {
          const nextState = {
            ...current,
            textSize: (TEXT_SIZE_LIMITS && TEXT_SIZE_LIMITS.DEFAULT) || 16,
            isTextSizeCustomized: false
          };
          const saved = await setStorageSettings(nextState);
          await broadcastStateToAllTabs(saved);
          sendResponse({ success: true, settings: saved });
        })
        .catch((error) => {
          console.error('[GlitterText:Background] Reset size error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    case MESSAGE_ACTIONS.RESET_DEFAULT_GOLD: {
      getStorageSettings()
        .then(async (current) => {
          const nextState = {
            ...current,
            colorMode: 'single',
            activePreset: 'metallic-gold',
            colors: ['#e5b842'],
            intensity: 75,
            particleDensity: 'normal',
            sparkleBrightness: 80,
            animationSpeed: 'normal',
            isAnimationEnabled: true
          };
          const saved = await setStorageSettings(nextState);
          await broadcastStateToAllTabs(saved);
          sendResponse({ success: true, settings: saved });
        })
        .catch((error) => {
          console.error('[GlitterText:Background] Reset gold error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    case MESSAGE_ACTIONS.RESET_ALL_DEFAULTS: {
      getStorageSettings()
        .then(async (current) => {
          const nextState = {
            ...DEFAULT_SETTINGS,
            isEnabled: current ? current.isEnabled : false,
            lastToggledAt: current ? current.lastToggledAt : null
          };
          const saved = await setStorageSettings(nextState);
          await broadcastStateToAllTabs(saved);
          sendResponse({ success: true, settings: saved });
        })
        .catch((error) => {
          console.error('[GlitterText:Background] Reset all defaults error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    case MESSAGE_ACTIONS.UPDATE_SETTINGS: {
      if (!message.settings) {
        sendResponse({ success: false, error: 'No settings provided' });
        return false;
      }

      setStorageSettings(message.settings)
        .then(async (saved) => {
          await broadcastStateToAllTabs(saved);
          sendResponse({ success: true, settings: saved });
        })
        .catch((error) => {
          console.error('[GlitterText:Background] Update error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    default:
      return false;
  }
});

/**
 * Broadcasts the updated toggle and configuration state to all open tabs.
 */
async function broadcastStateToAllTabs(updatedSettings) {
  try {
    const tabs = await chrome.tabs.query({});
    if (!tabs || tabs.length === 0) return;

    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;

      if (isRestrictedUrl(tab.url)) {
        continue;
      }

      chrome.tabs.sendMessage(tab.id, {
        action: MESSAGE_ACTIONS.SETTINGS_CHANGED,
        settings: updatedSettings
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[GlitterText:Background] Multi-tab broadcast warning:', err);
  }
}

/**
 * Listen for direct storage changes to ensure seamless cross-window sync.
 */
chrome.storage.onChanged.addListener((changes) => {
  if (changes[STORAGE_KEYS.SETTINGS]) {
    const newValue = sanitizeSettings(changes[STORAGE_KEYS.SETTINGS].newValue);
    broadcastStateToAllTabs(newValue);
  }
});
