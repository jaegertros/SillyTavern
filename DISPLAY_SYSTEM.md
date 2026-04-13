# SillyTavern Display & Overlay Architecture

Reference document for understanding the UI layering system, drawer panels, z-index
hierarchy, popup stack, and how extensions should (and should not) interact with all of it.

---

## 1. Top-Level DOM Layout

The entire SillyTavern UI lives inside `public/index.html` (8054 lines). The top-level
structure is:

```
<body>
    #character_context_menu          ← right-click context menu
    #top-bar                         ← top nav bar (drawer toggle icons)
    #top-settings-holder             ← CONTAINER for both side panels
        #ai-config-button.drawer     ← LEFT drawer wrapper
            #leftNavDrawerIcon       ← toggle icon (sliders)
            #left-nav-panel          ← LEFT panel (AI config)
        ...middle drawers...         ← extensions, persona, WI, etc.
        #rightNavHolder.drawer       ← RIGHT drawer wrapper
            #rightNavDrawerIcon      ← toggle icon (address card)
            #right-nav-panel         ← RIGHT panel (character list)
    #sheld                           ← main chat area container
    #movingDivs                      ← draggable floating panels (MovingUI)
    #shadow_popup                    ← modal backdrop overlay
    <popups>                         ← dynamically appended to <body>
```

### Key Containers

| Element | Role | Position |
|---------|------|----------|
| `#top-bar` | Thin bar at very top, holds drawer toggle icons | `fixed`, top of viewport |
| `#top-settings-holder` | Parent of all drawers. Fixed at top, spans full width | `fixed`, top, width 100% |
| `#sheld` | Main chat view — message list + input area | Static/relative, fills viewport below top-bar |
| `#movingDivs` | Container for floating/draggable panels (MovingUI feature) | Child divs are `position: fixed` |
| `#shadow_popup` | Full-screen backdrop for modal popups | `position: absolute`, z-index 9999 |

---

## 2. The Drawer System

Drawers are the primary panel mechanism. Each drawer consists of:

```html
<div class="drawer">                           ← wrapper
    <div class="drawer-toggle drawer-header">  ← clickable header with icon
        <div class="drawer-icon fa-solid fa-X closedIcon"></div>
    </div>
    <div class="drawer-content closedDrawer">  ← the panel itself
        <div class="scrollableInner">          ← scrollable content area
            <!-- panel content here -->
        </div>
    </div>
</div>
```

### Open/Close Toggle

Handled in `public/script.js` (~line 10490). When a drawer icon is clicked:

1. Icon toggles classes: `closedIcon` ↔ `openIcon`
2. Panel toggles classes: `closedDrawer` ↔ `openDrawer`
3. CSS does the rest (see below)

### Drawer CSS (`public/style.css`, lines 5452-5554)

```css
/* CLOSED state (default) */
.drawer-content {
    display: none;
    position: absolute;
    top: var(--topBarBlockSize);
    left: 0; right: 0;
    margin: 0 auto;
    height: 0;
    min-width: 450px;
    width: var(--sheldWidth);
    overflow-y: hidden;
    background-color: var(--SmartThemeBlurTintColor);
    backdrop-filter: blur(var(--SmartThemeBlurStrength));
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 10px;
    transition: height var(--animation-duration-2x) ease-in-out;
}

/* OPEN state */
.drawer-content.openDrawer {
    display: block;
    height: auto;
    overflow-y: auto;
}
```

### Fill-Side Panels

The left and right panels have additional `fillLeft` / `fillRight` classes that override
the centered positioning:

```css
.fillLeft, .fillRight {
    width: calc((100vw - var(--sheldWidth) - 2px) / 2);   /* half the non-chat width */
    max-height: calc(100vh - var(--topBarBlockSize));
    height: 0;
    position: fixed;
    top: 0;
    margin: 0;
}

.fillLeft  { left: 0;  right: auto; }
.fillRight { right: 0; left: calc(...); z-index: 3000; }

.fillLeft.openDrawer, .fillRight.openDrawer {
    display: flex;
    height: 100%;                    /* full viewport height when open */
}
```

### The Two Main Panels

| Panel | ID | CSS Classes | Toggle Icon | Content |
|-------|----|-------------|-------------|---------|
| LEFT  | `#left-nav-panel` | `drawer-content fillLeft closedDrawer` | `#leftNavDrawerIcon` | AI response config, samplers, presets |
| RIGHT | `#right-nav-panel` | `drawer-content fillRight closedDrawer` | `#rightNavDrawerIcon` | Character list, group management |

### Middle Drawers

Between the two fill panels, several drawers open as center-screen overlays:

- **Extensions** drawer — contains `#extensions_settings` and `#extensions_settings2`
  - These are two-column flex containers
  - `#extensions_settings` = left column (expressions, TTS, SD, etc.)
  - `#extensions_settings2` = right column (QR, translate, vectors, etc.)
  - Extension HTML is appended here by `renderExtensionTemplateAsync()`
- **Persona** drawer — user persona management
- **World Info** drawer — `#WorldInfo`

### Lock/Pin Feature

Each panel has a pin checkbox (`#lm_button_panel_pin`, `#rm_button_panel_pin`).
When pinned, clicking another drawer won't close the pinned panel. Without pin,
only one panel opens at a time (the old one auto-closes).

---

## 3. Z-Index Hierarchy

This is the most critical thing to get right. Conflicts here are what break the UI.

```
Layer                           z-index    Element / Selector
─────────────────────────────────────────────────────────────────
Background                          -100   #bgtest
Chat messages                         30   #chat, .mes, #form_sheld
Chat scrollbar                        30   .mes_text, .last_mes
───────── normal content ─────────────────────────────────────────
Inline UI elements                  2000   .mes_buttons, #mes_stop
Popover menus                       2001   .mes_reasoning_details_button,
                                           .extraMesButtons
Extensions menu                     2058   #extensionsMenu (when floating)
Left panel                          3000   #left-nav-panel
Right panel                         3000   .fillRight
───────── panels ─────────────────────────────────────────────────
Top bar                             3001   .topbar_button_icon (some)
Top bar overlay                     3005   #top-bar (when pinned or active)
───────── top bar ────────────────────────────────────────────────
MovingUI container                  4000   #movingDivs
MovingUI child panels               4000   #movingDivs > div
MovingUI extensions menu            4001   #extensionsMenu (inside movingDivs)
MovingUI maximized                  4100   .maximized inside movingDivs
───────── floating panels ────────────────────────────────────────
Popup backdrop (#shadow_popup)      9999   #shadow_popup
Popup dialogs                       9999   .dialogue_popup, .popup
───────── modals ─────────────────────────────────────────────────
Toast notifications                10000   .toast-notification
Popper tooltips                    10000   .tippy-box, autocomplete
Popup nested modal                 29999   .popup .popper-modal
───────── toast / tooltip ────────────────────────────────────────
```

### Critical Rules for Extensions

1. **Never use z-index ≥ 3000** for persistent UI elements — you'll cover the panels
2. **Never use z-index ≥ 9999** unless you're creating a true modal popup
3. **Safe range for extension UI:** 1000–2500
4. **If you need to appear above panels** (rare): use the popup system (`callGenericPopup`), don't fight with z-index
5. **`#shadow_popup` at 9999** is the modal backdrop — nothing should sit between it and the popup dialog content unless intentionally layered

### NemoPresetExt Discord Theme Override

When the Nemo Discord theme is active (`body.nemo-theme-discord`), it overrides:

```css
#top-settings-holder {
    z-index: 10000 !important;    /* pushed ABOVE everything */
    position: fixed !important;
    width: 72px !important;       /* narrow Discord-style server bar */
    height: 100vh !important;
}
```

This means **any element below z-index 10000 is covered by the Discord sidebar**.
If your extension needs to work with the Discord theme, either:
- Place your element inside `#top-settings-holder` (it inherits the high z-index)
- Or match the z-index: 10000+ (dangerous — will fight with popups)

---

## 4. The Popup System

**File:** `public/scripts/popup.js`

All modal dialogs use the `Popup` class. Key behavior:

1. Popup elements are appended directly to `document.body` (line 493)
2. `#shadow_popup` provides the backdrop blur + dark overlay (z-index 9999)
3. Popups use their own internal stacking (multiple popups can nest)
4. `callGenericPopup(content, type, ...)` is the standard way to show a dialog

### Popup Types (`POPUP_TYPE`)

| Type | Use |
|------|-----|
| `TEXT` | Informational, with OK button |
| `CONFIRM` | Yes/No decision |
| `INPUT` | Text input with OK/Cancel |
| `DISPLAY` | Content-only, no buttons |

### Toast Notifications

Toasts are appended to a container at z-index 10000 and auto-dismiss. Created via:
```js
toastr.info('message');
toastr.warning('message');
toastr.error('message');
toastr.success('message');
```

---

## 5. The Extensions Cabinet

Extensions settings UI lives inside the middle "Extensions" drawer:

```
#top-settings-holder
  └─ drawer (Extensions)
       └─ drawer-content
            └─ scrollableInner
                 ├─ #extensions_settings   (left column)
                 │    ├─ #expressions_container
                 │    ├─ #sd_container
                 │    ├─ #tts_container
                 │    └─ ... (named containers)
                 │
                 └─ #extensions_settings2  (right column)
                      ├─ #qr_container
                      ├─ #translation_container
                      └─ ... (named containers + dynamically appended)
```

Extensions append their settings HTML to `#extensions_settings2` via:
```js
const html = await renderExtensionTemplateAsync('my-extension', 'index');
$('#extensions_settings2').append(html);
```

### Why Extensions Can Break Each Other

1. **DOM conflicts**: If two extensions append to the same named container or use
   the same element IDs, they collide
2. **CSS leaking**: Unscoped styles affect other extensions. Use unique class prefixes
3. **Z-index wars**: An extension that sets high z-index on its settings panel
   can cover other drawers or the popup system
4. **Drawer state interference**: Extensions that programmatically open/close
   drawers can fight with user actions or other extensions
5. **MutationObserver cascades**: NemoPresetExt watches `#left-nav-panel` with a
   MutationObserver — DOM changes there trigger re-initialization loops if not
   handled carefully

---

## 6. MovingUI System

When MovingUI is enabled (`body.movingUI`), drawer panels become draggable/resizable
floating windows:

- Panels are moved into `#movingDivs` container (z-index 4000)
- Each panel gets drag handles and can be repositioned
- Position/size is persisted in user settings
- `body:not(.movingUI) .drawer-content.maximized` handles the non-moving maximize case

**File:** `public/scripts/RossAscends-mods.js` — contains the drag/resize logic

---

## 7. CSS Variables That Control Layout

```css
--topBarBlockSize        /* height of the top bar */
--bottomFormBlockSize    /* height of the input area at bottom */
--sheldWidth             /* width of the main chat column */
--SmartThemeBlurTintColor   /* panel background color */
--SmartThemeBlurStrength    /* backdrop blur amount */
--SmartThemeBorderColor     /* panel border color */
--SmartThemeBodyColor        /* text color */
--animation-duration-2x     /* transition speed for drawer open/close */
```

---

## 8. Safe Patterns for Extension UI

### DO: Append to extensions panel
```js
$('#extensions_settings2').append(html);
```

### DO: Create independent body-level elements at low z-index
```js
const el = document.createElement('div');
el.style.zIndex = '1500';           // below panels (3000), above content (30)
el.style.position = 'fixed';
document.body.appendChild(el);
```

### DO: Use the popup system for dialogs
```js
import { callGenericPopup, POPUP_TYPE } from '../../popup.js';
await callGenericPopup(content, POPUP_TYPE.TEXT);
```

### DON'T: Inject into `#top-settings-holder` or `#top-bar`
These are managed by the core drawer system and NemoPresetExt's MutationObserver.
Injecting there can trigger infinite observer loops or break drawer toggle logic.

### DON'T: Modify `.drawer-content` classes directly
Use the existing toggle mechanism instead of manually adding/removing
`openDrawer`/`closedDrawer` — otherwise the icon state gets out of sync.

### DON'T: Use z-index > 9999 for non-modal elements
Toasts, tooltips, and the popup system live at 9999–29999. Putting persistent
UI there will cover modal dialogs.

---

## 9. Key Source Files

| File | Lines | What It Controls |
|------|-------|-----------------|
| `public/index.html` | 60–110 | Top-level layout containers, drawer HTML structure |
| `public/index.html` | 5630–5665 | Extensions settings containers |
| `public/index.html` | 5855–5870 | Right nav panel structure |
| `public/index.html` | 6100–6130 | Group settings (activation strategy dropdown) |
| `public/style.css` | 760–880 | Top bar styling |
| `public/style.css` | 2933–2951 | MovingUI + panel z-index definitions |
| `public/style.css` | 3826–3838 | `#shadow_popup` modal backdrop |
| `public/style.css` | 5452–5554 | All drawer CSS (open/close, fill-left/right) |
| `public/scripts/popup.js` | 490–500 | Popup DOM attachment |
| `public/scripts/popup.js` | 770–780 | Toast container creation |
| `public/script.js` | ~10490 | Drawer toggle click handler |
| `public/scripts/RossAscends-mods.js` | — | MovingUI drag/resize logic |

### NemoPresetExt Files (for understanding theme conflicts)

| File | What |
|------|------|
| `extensions/third-party/NemoPresetExt/content.js` | Main init, MutationObserver on `#left-nav-panel` |
| `extensions/third-party/NemoPresetExt/ui/global-ui.js` | Inline drawer conversion, panel reorganization |
| `extensions/third-party/NemoPresetExt/themes/discord-theme.css` | Discord UI override (z-index: 10000 on `#top-settings-holder`) |
| `extensions/third-party/NemoPresetExt/themes/discord-enhancements.js` | Modal overlay system for Discord theme |
| `extensions/third-party/NemoPresetExt/features/panel-toggle/panel-toggle.js` | Panel width toggle (50vw) |
