# Theme Integration Guide for Components

## Quick Start for Developers

### Step 1: Import the Hook

```tsx
import { useTheme } from '../themes/ThemeContext';
```

### Step 2: Access Current Theme

```tsx
const { currentTheme } = useTheme();
```

### Step 3: Use Colors

```tsx
// Option A: Inline styles
<div style={{ backgroundColor: currentTheme.colors.bg.primary }}>
  Content
</div>

// Option B: CSS with Tailwind
<div className="text-[var(--color-text-primary)]">
  Content
</div>

// Option C: CSS Module with custom properties
<div className={styles.container}>
  Content
</div>

/* styles.module.css */
.container {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

---

## Common Component Patterns

### Buttons with UI Colors

```tsx
export function MuteButton() {
  const { currentTheme } = useTheme();
  const [isMuted, setIsMuted] = useState(false);

  return (
    <button
      onClick={() => setIsMuted(!isMuted)}
      style={{
        backgroundColor: isMuted 
          ? currentTheme.colors.ui.mute 
          : currentTheme.colors.bg.tertiary,
        color: currentTheme.colors.text.primary,
      }}
    >
      M
    </button>
  );
}
```

### Track Panels with Theme Layout

```tsx
export function TrackPanel({ track }) {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        width: currentTheme.layout.tcp.width,
        backgroundColor: track.selected
          ? currentTheme.colors.track.backgroundSelected
          : currentTheme.colors.track.background,
        padding: currentTheme.layout.spacing.md,
        gap: currentTheme.layout.spacing.sm,
      }}
    >
      {/* Track content */}
    </div>
  );
}
```

### Meters with Theme Colors

```tsx
export function VUMeter({ level }) {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        background: `linear-gradient(to right, 
          ${currentTheme.colors.meter.background} 0%,
          ${currentTheme.colors.meter.filled} ${level}%,
          ${level > 95 ? currentTheme.colors.meter.peak : 'transparent'} 100%)`
      }}
    >
      {/* Meter display */}
    </div>
  );
}
```

### Text with Semantic Colors

```tsx
export function TrackLabel({ track }) {
  const { currentTheme } = useTheme();

  return (
    <label style={{ color: currentTheme.colors.text.primary }}>
      {track.name}
    </label>
  );
}
```

### Borders and Dividers

```tsx
export function TrackDivider() {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        height: 1,
        backgroundColor: currentTheme.colors.border.divider,
        margin: `${currentTheme.layout.spacing.md}px 0`,
      }}
    />
  );
}
```

### Fader Components

```tsx
export function VolumeFader({ value, onChange }) {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        background: currentTheme.colors.fader.background,
        borderRadius: currentTheme.layout.radius.sm,
      }}
    >
      <input
        type="range"
        value={value}
        onChange={onChange}
        style={{
          accentColor: currentTheme.colors.fader.thumb,
        }}
      />
    </div>
  );
}
```

### Automation with Theme

```tsx
export function AutomationCurve() {
  const { currentTheme } = useTheme();

  return (
    <svg>
      <line
        stroke={currentTheme.colors.automation.line}
        strokeWidth={2}
      />
      <circle
        fill={currentTheme.colors.automation.point}
        r={4}
      />
    </svg>
  );
}
```

### Status/Alert Colors

```tsx
export function StatusIndicator({ status }) {
  const { currentTheme } = useTheme();

  const colors = {
    recording: currentTheme.colors.ui.record,
    playing: currentTheme.colors.ui.play,
    armed: currentTheme.colors.ui.armed,
    error: currentTheme.colors.ui.error,
  };

  return (
    <div
      style={{
        backgroundColor: colors[status] || currentTheme.colors.ui.stop,
        borderRadius: '50%',
        width: 8,
        height: 8,
      }}
    />
  );
}
```

---

## Advanced Patterns

### Theme-Aware Responsive Layout

```tsx
export function MixerStrip() {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        width: currentTheme.layout.mcp.stripWidth,
        display: 'flex',
        flexDirection: 'column',
        gap: currentTheme.layout.spacing.sm,
      }}
    >
      {/* Strip content scales with theme strip width */}
    </div>
  );
}
```

### Nested Component Theme Consistency

```tsx
export function EffectRack() {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        background: currentTheme.colors.bg.secondary,
        padding: currentTheme.layout.spacing.md,
        borderRadius: currentTheme.layout.radius.md,
        boxShadow: currentTheme.layout.shadow.md,
      }}
    >
      {/* All child components use same currentTheme via useTheme() */}
    </div>
  );
}
```

### Theme-Aware Animation

```tsx
export function FadingLabel() {
  const { currentTheme } = useTheme();

  return (
    <style>
      {`
        @keyframes fadeColor {
          from { color: ${currentTheme.colors.text.primary}; }
          to { color: ${currentTheme.colors.text.tertiary}; }
        }
        .fading {
          animation: fadeColor 1s ease-in-out;
        }
      `}
    </style>
  );
}
```

---

## Color Reference Quick Lookup

### For Different Component Types

**Buttons & Controls:**
- Normal state: `colors.bg.tertiary`
- Hover state: `colors.bg.hover`
- Selected state: `colors.bg.selected`
- Active color: `colors.ui.play`

**Tracks & Panels:**
- Background: `colors.track.background`
- Selected: `colors.track.backgroundSelected`
- Name area: `colors.track.nameBackground`
- Border: `colors.track.border`

**Text:**
- Primary (main): `colors.text.primary`
- Secondary (labels): `colors.text.secondary`
- Tertiary (dim): `colors.text.tertiary`
- Accent (highlight): `colors.text.accent`

**Borders:**
- Main borders: `colors.border.primary`
- Secondary borders: `colors.border.secondary`
- Dividers: `colors.border.divider`

**Metering:**
- Background: `colors.meter.background`
- Normal level: `colors.meter.filled`
- Peak indicator: `colors.meter.peak`
- Clipping: `colors.meter.clipping`
- RMS: `colors.meter.rms`

**Faders:**
- Track background: `colors.fader.background`
- Thumb/handle: `colors.fader.thumb`
- Hover state: `colors.fader.hover`
- Zero line (0dB): `colors.fader.zeroLine`

**Status Indicators:**
- Mute: `colors.ui.mute`
- Solo: `colors.ui.solo`
- Record: `colors.ui.record`
- Play: `colors.ui.play`
- Armed: `colors.ui.armed`

---

## Migration Checklist

When updating existing components to use themes:

- [ ] Import `useTheme` hook
- [ ] Replace hardcoded colors with theme colors
- [ ] Use semantic color names (don't assign by appearance)
- [ ] Update hover/selected states
- [ ] Test with all 3 default themes
- [ ] Verify accessibility (contrast ratios)
- [ ] Check responsive behavior
- [ ] Remove old color constants

---

## Performance Notes

- `useTheme()` is a lightweight context hook (no render performance impact)
- Theme switching applies CSS variables (instant, no re-renders needed)
- Inline styles using `currentTheme.colors.X` ARE reactive
- CSS custom properties avoid re-renders on theme change
- Consider memoization if using expensive theme calculations

---

## Troubleshooting

**Q: Theme colors not applying?**
- A: Ensure component is within `<ThemeProvider>` in App.tsx

**Q: Colors not updating on theme switch?**
- A: Use `currentTheme` directly or CSS custom properties for reactivity

**Q: TypeScript errors on theme colors?**
- A: Import `Theme` type: `import { Theme } from '../themes/types'`

**Q: Custom theme not saving?**
- A: Check browser localStorage is enabled and not full

**Q: CSS custom properties not working?**
- A: Ensure they're accessed on document root (applied by ThemeContext)
