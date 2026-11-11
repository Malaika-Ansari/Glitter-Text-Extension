# ✨ GlitterText - Chrome Extension (Manifest V3)

> A modern, elegant Google Chrome Extension that transforms webpage typography with realistic custom glitter particles, 2- & 3-colour blending, curated metallic presets, saved favourites, intensity & brightness tuning, particle density controls, shimmer animation customization, and a premium collapsible customization dashboard.

---

## 📁 Project Architecture & Folder Structure

```
Glitter Text Extension/
├── manifest.json              # Extension manifest (Chrome Manifest V3)
├── icons/                     # Extension branding icons (16, 32, 48, 128px)
├── popup/                     # Premium customization dashboard
│   ├── popup.html             # Luxury dark dashboard with collapsible accordion cards & live preview
│   ├── popup.css              # Obsidian theme, gold accents, smooth chevron transitions & toast feedback
│   └── popup.js               # Dashboard controller, live preview sync, auto-save feedback & master reset
├── background/                # Background service worker
│   └── service-worker.js      # MV3 event-driven worker, lifecycle & multi-tab broadcaster
├── content/                   # Webpage content injection scripts & styles
│   ├── content.js             # Non-destructive text scanner, dynamic style injector & SPA observer
│   └── glitter.css            # Base glitter particle clipping & keyframe shimmer animations
├── shared/                    # Shared configurations & utilities
│   └── config.js              # Color & particle synthesis engine, density tiers, bounds & storage helpers
└── test/                      # Interactive verification suite
    └── test-page.html         # Live test page with multi-background contrast tests & telemetry
```

---

## 🗂️ Luxury Customization Dashboard Architecture

The extension popup has been redesigned into a **high-end, organized, user-friendly customization dashboard**:

1. **GlitterText Branding & Live Status Indicator**:
   - Metallic gold gradient typography with glinting SVG sparkle logo.
   - Header status badge (`ACTIVE` / `DISABLED`) with pulsing live indicator dot.
   - Active webpage monitor displaying the current domain.

2. **Global Master ON/OFF Card**:
   - Prominent luxury toggle switch with smooth gold glow and active state transitions.
   - Zero-trace teardown: completely restores native styling when turned OFF.

3. **Featured Live Glitter Text Preview**:
   - Pinned right under the master card for instant visual feedback as any control is adjusted.
   - Displays Heading, Paragraph, Button, and Link, updating in real time with the identical CSS particle layers as the active webpage.
   - Live summary pills indicate active palette name, text-size scale, and animation duration.

4. **Organized Collapsible Accordion Sections**:
   - **🎨 Colour & Blending**:
     - 1, 2, or 3 color blending tabs + Rainbow chromatic spectrum.
     - Native HTML color pickers for Primary, Secondary, and Accent slots.
     - 9 Curated Metallic Presets (*Metallic Gold*, *Rose Gold*, *Silver*, *Pink*, *Purple*, *Royal Blue*, *Ruby Red*, *Emerald Green*, *Rainbow*).
     - Reusable Saved Favourites chips with one-click application and deletion.
     - Quick "↺ Default Gold" reset.
   - **✨ Intensity & Sparkle**:
     - Glitter Intensity continuous slider (0–100%) + Low (25%), Med (65%), High (100%) quick presets.
     - Sparkle Brightness continuous slider (0–100%).
   - **🎬 Density & Motion**:
     - Particle Density segmented selector (*Sparse*, *Normal*, *Dense*).
     - Shimmer Animation ON/OFF luxury mini switch (*Active Shimmer* vs *Static Texture*).
     - Animation Speed segmented selector (*Slow 8.5s*, *Normal 5.5s*, *Fast 3.0s*).
   - **🔤 Text Size Scaling**:
     - Stepper controls: `-1px` button, `+1px` button, slider (10px–50px), and "Reset Size" button.

5. **Dynamic Summary Badges & Accessible Chevrons**:
   - Every accordion header displays a live summary badge (e.g. `Metallic Gold`, `75% • 80% Bright`, `Normal • 5.5s`, `16px`) even when collapsed, allowing quick bird's-eye review without opening every card.
   - Smooth 180° chevron rotation with zero layout shift.

6. **Instant Auto-Save Feedback Toast**:
   - Floating notification (`✓ Settings Saved`, `✓ Restored 24K Classic Gold`, etc.) reassuring users that Chrome Storage synchronized.

7. **Master Reset to Default Settings**:
   - Dedicated "↺ Reset to Default Settings" button restoring all extension parameters to factory defaults across all open tabs.

---

## 💎 Advanced Glitter Intensity & Animation Customization

1. **Glitter Intensity (0–100%)**:
   - Continuous 0–100% slider modulating micro-shadow facet depth, drop-shadow specularity, and particle stroke contrast.
   - Quick presets: **Low (25%)**, **Med (65%)**, and **High (100%)** for one-click intensity setting.

2. **Particle Density (Sparse, Normal, Dense)**:
   - **Sparse**: Open flake distribution with spaced-out particles (23px–71px repeat tiles, 1.6px–5.0px radii) creating negative foil space.
   - **Normal**: Balanced luxury glitter density (11px–43px repeat tiles, 1.2px–4.0px radii).
   - **Dense**: Packed micro-dust and tight micro-facets (7px–31px repeat tiles, 0.9px–3.2px radii) with sparkling pinpoint distribution.

3. **Sparkle Brightness (0–100%)**:
   - Independent brightness slider controlling pinpoint diamond sparkle dust alphas, specular star glints, and ambient light reflectivity.

4. **Separate Shimmer Animation ON/OFF Switch**:
   - **ON**: Smooth specular light sweep across letterforms using `@keyframes glitterParticleShimmer`.
   - **OFF**: Retains the rich physical metallic glitter foil texture inside text letters while pausing motion (`animation: none !important;`).
   - Respects `prefers-reduced-motion: reduce` automatically.

5. **Animation Speed (Slow, Normal, Fast)**:
   - **Slow**: 8.5 seconds gentle, non-distracting ambient gleam.
   - **Normal**: 5.5 seconds balanced luxury shimmer.
   - **Fast**: 3.0 seconds vibrant, high-energy glimmer.

6. **Popup Live Preview**:
   - Real-time interactive preview box rendered with the identical CSS particle layers, reflecting chosen colors, density, intensity, brightness, and animation speed live.

7. **Zero-Trace Master ON/OFF Toggle**:
   - Master toggle instantly tears down all glitter effects and font-size overrides, leaving 0% residual styles.
   - Strict non-destructive design: never alters font families, font weights, images, or webpage layouts.

---

## 🎨 Custom Glitter Colour Picker & Blending System

1. **Native HTML Colour Pickers**:
   - Integrated `<input type="color">` slots allowing any hexadecimal color to be chosen.
   - Throttled real-time updates via `requestAnimationFrame` update the active webpage live **without page reloads**.

2. **Multi-Colour Particle Blending (2 or 3 Colours)**:
   - **1 Colour**: Classic monochrome metallic glitter with diamond highlights, midtones, and deep shadow facets.
   - **2 Blend**: Alternating layers of Color 1 and Color 2 micro-flakes with blended metallic foil underlay.
   - **3 Blend**: Interleaved tri-colour particle distribution (Primary, Secondary, Accent) creating rich mixed-foil glitter textures.
   - **Rainbow**: Full chromatic spectrum (Red, Gold, Emerald, Sapphire, Purple) with multi-stop rainbow foil underlay.

3. **Nine Curated Luxury Metallic Presets**:
   - **Metallic Gold** (`#e5b842`): Signature 24K yellow gold foil.
   - **Rose Gold** (`#b76e79`): Blush copper and peach champagne flakes.
   - **Silver** (`#d8d8d8`): Platinum silver and diamond dust.
   - **Pink** (`#ff69b4`): Vivid sparkling hot pink.
   - **Purple** (`#9b59b6`): Royal amethyst purple.
   - **Royal Blue** (`#1e3799`): Deep sapphire blue.
   - **Ruby Red** (`#d63031`): Saturated ruby red foil.
   - **Emerald Green** (`#00b894`): Luminous emerald green.
   - **Rainbow**: Full chromatic spectrum.

4. **Saved Favourites & Reusable Combinations**:
   - **"★ Save Favourite"**: Prompt to name and store the current color combination.
   - **Reusable Favourites Chips**: Displays custom swatch dots and names; one-click re-application; `(x)` to delete.
   - Persisted in `chrome.storage.sync` across browser restarts and devices.

5. **"↺ Default Gold" Quick Reset**:
   - One-click restore button that reverts back to the signature 24K Classic Gold with default intensity and animation parameters.

---

## 🌐 Website Compatibility, Safe DOM Handling & Visual Preservation

GlitterText has been engineered to customize **only readable typography** while leaving all website containers, layouts, media, and interactive controls 100% native:

1. **Major Website Compatibility**:
   * **Google Search**: Targets search result headings (`h3`), URLs, snippet text, and navigation tabs. Search inputs, magnifying glass SVGs, and knowledge carousels are strictly protected.
   * **YouTube**: Video titles, channel headers, descriptions, and comments receive glitter text. Video players (`.html5-video-player`, `<video>`, `<canvas>`), controls, avatars, and the red Subscribe button background & bell icon remain 100% native.
   * **Gmail**: Subject lines, sender names, and reading-pane email bodies sparkle. Compose dialogs, message body editing (`[contenteditable="true"]`, `.editable`, `[role="textbox"]`), toolbar action icons (archive, delete, star), and inputs are completely untouched.
   * **Facebook, Instagram & LinkedIn**: Post headlines, captions, and article text sparkle. Image feeds, reels, stories, reaction SVGs, and comment input fields are 100% excluded.
   * **Wikipedia & Educational Sites**: Page titles, section headings, body paragraphs, and blockquotes sparkle. Math formulas (`.mwe-math-element`, `<math>`), edit links, and media players are strictly preserved.
   * **Blogs & Technical News (Medium, Dev.to, BBC, CNN)**: Monospace code blocks (`<pre>`, `<code>`, `<kbd>`, `.hljs`), author avatars, and subscription inputs remain untouched.

2. **Nested Elements Anti-Duplication Guard**:
   * Eliminates the classic `background-clip: text` duplicate stacking bug.
   * When an element has an ancestor already tagged with `.glitter-text-applied`, the child element is skipped in JavaScript and protected via CSS (`.glitter-text-applied .glitter-text-applied { background-image: none !important; ... }`).
   * One single, continuous, unified particle gradient sweeps across paragraphs, spans, and links with zero desynchronized animations or muddy drop-shadows.

3. **Strict Box Model & Layout Preservation**:
   * Zero `display: inline` forcing: elements retain their native `block`, `inline-block`, `flex`, `grid`, and `list-item` display properties, preserving margins, padding, line heights, and container dimensions.
   * Replaced non-text media (`<img>`, `<svg>`, `<canvas>`, `<video>`, `<picture>`, `<iframe>`, `[role="img"]`) is explicitly reset to `-webkit-text-fill-color: initial !important; background-clip: border-box !important;`.

4. **100% Reliable Restoration on OFF & Navigation**:
   * Master OFF or Reset completely removes the root marker class, unbinds the dynamic stylesheet, clears all `.glitter-text-applied` markers, and restores pre-existing inline font sizes via `data-glitter-initial-inline-size`.
   * Zero residual styling or attributes left behind in the DOM.

5. **High-Performance Batched MutationObserver for SPAs**:
   * Replaces unthrottled subtree rescans with a debounced `requestAnimationFrame` micro-batch queue.
   * Ignores irrelevant mutations inside scripts, styles, SVGs, canvas, and editable containers, ensuring butter-smooth 60fps scrolling on heavy feeds.
   * Automatically handles SPA navigation transitions (`yt-navigate-finish`, `popstate`, `hashchange`).

---

## 🧪 Manual Testing Verification Guide

Open [`test/test-page.html`](file:///c:/Users/IIS\OneDrive\Desktop\Glitter%20Text%20Extension\test\test-page.html) in Google Chrome:

```
+---------------------------------------------------------------------------------------------------------+
|  TELEMETRY:  Extension: ON  |  Glitter Elements: 14  |  H1: 30px  |  Shimmer: Active (5.5s)             |
+---------------------------------------------------------------------------------------------------------+
```

### 1. Test Glitter Intensity (Slider & Presets)
1. Turn Global Toggle **ON**.
2. Drag the **Glitter Intensity** slider from 0% to 100%. Observe text particle depth, stroke contrast, and shadow specularity scale smoothly.
3. Click **Low (25%)**, **Med (65%)**, and **High (100%)** presets to verify quick intensity snaps.

### 2. Test Particle Density (Sparse, Normal, Dense)
1. In the popup, click **Sparse** &mdash; observe wider particle spacing with open flake facets.
2. Click **Normal** &mdash; observe balanced distribution.
3. Click **Dense** &mdash; observe tightly packed micro-dust particles embedded inside letters.

### 3. Test Sparkle Brightness (0–100%)
1. Drag the **Sparkle Brightness** slider down to 0% and up to 100%.
2. Notice the diamond pinpoint sparkles and specular star highlights increase in luminance and brilliance.

### 4. Test Shimmer Animation Switch & Speed
1. Toggle the **Shimmer Animation** switch **OFF**.
2. Check the active webpage & popup preview &mdash; verify letters retain realistic static glitter texture while motion is completely paused (`animation: none !important;`).
3. Toggle the switch **ON** &mdash; verify shimmer light sweep resumes.
4. Test **Slow (8.5s)**, **Normal (5.5s)**, and **Fast (3.0s)** speeds and observe the smooth pace change.

### 5. Test Custom Colours, Blending & Presets
1. Select 1, 2, or 3 colors or Rainbow mode.
2. Test presets (*Rose Gold*, *Emerald Green*, *Royal Blue*, etc.) and saved favourites.
3. Click **↺ Default Gold** to reset to signature 24K gold with default intensity and animation settings.

### 6. Test Text-Size Stepper & Master OFF
1. Adjust text-size slider between **10px** and **50px** &mdash; verify proportional scaling.
2. Turn the Global Toggle **OFF** &mdash; verify all glitter styling and font-size overrides are immediately stripped, restoring 100% native appearance.
