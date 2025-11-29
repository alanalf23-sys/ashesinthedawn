# Theme Colors & Layout Reference

## REAPER Default (Dark) Theme

### Background Colors
```
Primary:    #292929 (charcoal - main app)
Secondary:  #3d3d3d (darker gray - panels)
Tertiary:   #3c3c3c (controls)
Alt:        #2d2d2d (alternative backgrounds)
Hover:      #4a4a4a (hover state)
Selected:   #404040 (selected state)
```

### Text Colors
```
Primary:    #e0e0e0 (light gray - main text)
Secondary:  #b0b0b0 (secondary text)
Tertiary:   #808080 (dim text)
Accent:     #66bb6a (REAPER green - highlights)
```

### UI Control Colors
```
Mute:       #6b8cae (blue)
Solo:       #d4a574 (tan/yellow)
Record:     #c85a54 (red)
Play:       #66bb6a (green)
Stop:       #b0b0b0 (gray)
Armed:      #d4a574 (yellow)
Success:    #66bb6a (green)
Warning:    #ffa726 (orange)
Error:      #ef5350 (red)
```

### Meter Colors
```
Background: #1a1a1a (black)
Filled:     #4db84d (green)
Peak:       #ff6b6b (red)
Clipping:   #ff0000 (bright red)
RMS:        #88cc88 (light green)
```

### Fader Colors
```
Background: #2a2a2a (dark gray)
Thumb:      #5a5a5a (medium gray)
Hover:      #6a6a6a (light gray)
Zero Line:  #4db84d (green at 0dB)
```

---

## Layout Specifications

### TCP (Track Control Panel)
```
Width:           240px
Min Height:      74px
Folder Indent:   22px

Default Heights:
  - Super Collapsed: 24px
  - Small:          49px
  - Medium:         72px
  - Full:           150px
```

### MCP (Mixer Control Panel)
```
Min Height:      230px
Strip Width:     104px (Pro Tools standard)
Master Min H:    74px
```

### Transport Bar
```
Height:          48px
```

### Timeline/Arrange
```
Ruler Height:    32px
```

### Spacing Scale
```
XS:              2px
SM:              4px
MD:              8px
LG:              16px
```

### Border Radius
```
None:            0px
SM:              2px
MD:              4px
LG:              8px
```

### Shadows
```
SM:   0 1px 2px rgba(0, 0, 0, 0.5)
MD:   0 4px 6px rgba(0, 0, 0, 0.6)
LG:   0 10px 15px rgba(0, 0, 0, 0.8)
```

---

## REAPER Light Theme Colors

### Key Differences from Dark Theme
```
Primary BG:     #f5f5f5 (light)
Secondary BG:   #efefef (lighter)
Primary Text:   #1a1a1a (dark)
Accent:         #2e7d32 (forest green)

UI Colors:
  - Mute:       #1976d2 (blue)
  - Solo:       #f57c00 (orange)
  - Record:     #d32f2f (red)
  - Play:       #388e3c (green)
  - Success:    #4caf50 (green)
  - Warning:    #ff9800 (orange)
  - Error:      #f44336 (red)

Meter:
  - Filled:     #66bb6a (green)
  - Peak:       #ff5252 (red)
  - RMS:        #81c784 (light green)

Shadows (lighter):
  SM:   0 1px 2px rgba(0, 0, 0, 0.1)
  MD:   0 4px 6px rgba(0, 0, 0, 0.15)
  LG:   0 10px 15px rgba(0, 0, 0, 0.2)
```

---

## High Contrast Theme Colors

### Maximum Accessibility
```
Primary BG:     #000000 (pure black)
Primary Text:   #ffffff (pure white)
Accent:         #ffff00 (bright yellow)

UI Colors (Neon):
  - Mute:       #00ccff (cyan)
  - Solo:       #ffff00 (yellow)
  - Record:     #ff0000 (red)
  - Play:       #00ff00 (green)
  - Armed:      #ffff00 (yellow)
  - Error:      #ff0000 (red)

Meter:
  - Filled:     #00ff00 (bright green)
  - Peak:       #ff0000 (red)
  - Clipping:   #ff00ff (magenta)
  - RMS:        #00ffff (cyan)

Font Sizes (Larger):
  XS:           11px
  SM:           12px
  Base:         13px
  LG:           14px
  XL:           15px

Strip Width:    120px (wider than default 104px)
```

---

## CSS Custom Properties Reference

### Color Variables
```css
/* Background */
--color-bg-primary
--color-bg-secondary
--color-bg-tertiary
--color-bg-alt
--color-bg-hover
--color-bg-selected

/* Text */
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-text-accent

/* Border */
--color-border-primary
--color-border-secondary
--color-border-divider

/* UI Controls */
--color-ui-mute
--color-ui-solo
--color-ui-record
--color-ui-play
--color-ui-stop
--color-ui-armed
--color-ui-success
--color-ui-warning
--color-ui-error

/* Meter */
--color-meter-background
--color-meter-filled
--color-meter-peak
--color-meter-clipping
--color-meter-rms

/* Fader */
--color-fader-background
--color-fader-thumb
--color-fader-hover
--color-fader-zeroLine

/* Waveform */
--color-waveform-background
--color-waveform-foreground
--color-waveform-peak
--color-waveform-rms
--color-waveform-selection

/* Track */
--color-track-background
--color-track-backgroundSelected
--color-track-nameBackground
--color-track-border

/* Automation */
--color-automation-line
--color-automation-point
--color-automation-envelope
```

### Typography Variables
```css
--font-family-ui
--font-family-mono
--font-size-xs
--font-size-sm
--font-size-base
--font-size-lg
--font-size-xl
--font-weight-normal
--font-weight-semibold
--font-weight-bold
```

### Layout Variables
```css
--tcp-width
--mcp-min-height
--transport-height
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg
--radius-none
--radius-sm
--radius-md
--radius-lg
--shadow-sm
--shadow-md
--shadow-lg
```

---

## Usage Examples

### Color Application
```css
.button {
  background-color: var(--color-ui-play);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.muted-button {
  background-color: var(--color-ui-mute);
}

.track-panel {
  background-color: var(--color-track-background);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.meter {
  background: linear-gradient(to right,
    var(--color-meter-background) 0%,
    var(--color-meter-filled) 50%,
    var(--color-meter-peak) 100%);
}
```

### Responsive Layout
```css
.mixer-strip {
  width: 104px;  /* or from theme.layout.mcp.stripWidth */
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
}

.track-control-panel {
  width: 240px;  /* or from theme.layout.tcp.width */
  padding: var(--spacing-md);
}
```

---

## Color Harmony Matrix

### Semantic Color Combinations

**Play State**
- Primary: `colors.ui.play` (#66bb6a green)
- Background: `colors.bg.primary`
- Text: `colors.text.primary`

**Record State**
- Primary: `colors.ui.record` (#c85a54 red)
- Background: `colors.bg.primary`
- Text: `colors.text.accent`

**Solo State**
- Primary: `colors.ui.solo` (#d4a574 tan)
- Background: `colors.bg.primary`
- Text: `colors.text.primary`

**Mute State**
- Primary: `colors.ui.mute` (#6b8cae blue)
- Background: `colors.bg.secondary`
- Text: `colors.text.tertiary`

---

## Professional Usage Patterns

### Track Strip Layout
```
┌─────────────────┐
│ Track Name      │  bg.track.nameBackground
├─────────────────┤
│ M  S  R  [----] │  icons + fader
│ 50 50 50 (Vol)  │  status + level display
├─────────────────┤
│  [effects]      │  effect list
└─────────────────┘
Width: 104px (TCP standard)
Padding: spacing.md (8px)
Spacing: spacing.sm (4px)
```

### Meter Display
```
┌──────────────┐
│ ██░░░░░░░░░░ │  meter.filled, meter.background
│ Peak: 3dB   │  text.secondary
│ [C] Clipping │  ui.error (if active)
└──────────────┘
Peak indicator: meter.peak
Zero line: fader.zeroLine (green)
```

### Button Grid (3x3)
```
┌──────┬──────┬──────┐
│  M   │  S   │  R   │  button size: 24-32px
│ blue │ tan  │ red  │  ui colors
├──────┼──────┼──────┤
│  FX  │  PAN │ VUL  │
│ icon │ icon │ icon │
└──────┴──────┴──────┘
Gaps: spacing.xs (2px)
Padding: spacing.sm (4px)
Border radius: radius.sm (2px)
```

---

## Accessibility Considerations

### Contrast Ratios (WCAG AA Minimum 4.5:1)

**REAPER Default Dark:**
- Text primary (#e0e0e0) on BG primary (#292929): 13.8:1 ✓
- Text secondary (#b0b0b0) on BG primary: 8.5:1 ✓
- Text tertiary (#808080) on BG primary: 3.1:1 ✗ (use sparingly)

**REAPER Light:**
- Text primary (#1a1a1a) on BG primary (#f5f5f5): 16.4:1 ✓
- Text secondary (#4a4a4a) on BG primary: 6.3:1 ✓

**High Contrast:**
- Text primary (#ffffff) on BG primary (#000000): 21:1 ✓
- All color combinations: 8:1+ ✓

### Accessibility Best Practices
- Don't rely on color alone for state (use icons too)
- Use High Contrast theme for visually impaired users
- Ensure meter displays have text labels
- Test with color-blind simulator
- Use sufficient font sizes (min 11px on High Contrast)
