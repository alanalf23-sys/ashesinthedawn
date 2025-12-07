# REAPER-Inspired Theme System

CoreLogic Studio now features a comprehensive, REAPER-inspired theming system that allows you to:

1. **Switch between professional themes** - Dark, Light, and High Contrast
2. **Create custom themes** - Save your perfect color scheme
3. **Export/Import themes** - Share themes with team members
4. **Dynamic theme application** - Changes apply instantly with CSS custom properties

## Architecture

### File Structure

```
src/themes/
├── types.ts              # Theme type definitions
├── presets.ts            # Default theme presets
└── ThemeContext.tsx      # Theme provider and hook

src/components/
└── ThemeSwitcher.tsx     # Theme switching UI panel
```

### Core Types

**Theme Interface:**
```typescript
interface Theme {
  id: string;              // Unique identifier
  name: string;            // Display name
  description: string;     // Short description
  version: string;         // Theme version
  author: string;          // Theme author
  category: 'dark' | 'light' | 'custom';
  
  colors: ThemeColors;     // All color definitions
  fonts: ThemeFonts;       // Typography settings
  layout: ThemeLayout;     // Layout dimensions
  
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  isCustom: boolean;       // Whether user-created
}
```

### Color Namespaces

Each theme defines colors organized by purpose:

- **bg**: Background colors (primary, secondary, tertiary, hover, selected)
- **text**: Text colors (primary, secondary, tertiary, accent)
- **border**: Border/divider colors
- **ui**: Control colors (mute, solo, record, play, etc.)
- **meter**: VU meter colors (background, filled, peak, clipping, rms)
- **fader**: Fader UI colors (track, thumb, hover, zeroLine)
- **waveform**: Waveform visualization colors
- **track**: Track strip colors
- **automation**: Automation line/point colors

### Layout Configuration

Each theme defines professional DAW layout parameters:

- **tcp**: Track Control Panel (track list) dimensions
- **mcp**: Mixer Control Panel dimensions
- **transport**: Transport bar height
- **arrange**: Timeline ruler height
- **spacing**: Consistent spacing scale (xs, sm, md, lg)
- **radius**: Border radius values
- **shadow**: Drop shadow definitions

## Using the Theme System

### Basic Setup

```tsx
// In App.tsx
import { ThemeProvider } from './themes/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';

function App() {
  return (
    <ThemeProvider>
      <DAWProvider>
        <AppContent />
        <ThemeSwitcher />
      </DAWProvider>
    </ThemeProvider>
  );
}
```

### Accessing Current Theme

```tsx
import { useTheme } from '../themes/ThemeContext';

export default function MyComponent() {
  const { currentTheme, switchTheme, themes } = useTheme();
  
  return (
    <div style={{ backgroundColor: currentTheme.colors.bg.primary }}>
      {/* Uses theme colors */}
    </div>
  );
}
```

### CSS Custom Properties

The theme system applies all colors as CSS custom properties to the document root:

```css
/* Automatically available */
background-color: var(--color-bg-primary);
color: var(--color-text-primary);
border-color: var(--color-border-primary);
```

## Preset Themes

### REAPER Default (Dark)
- Professional dark theme matching REAPER 7.x
- Green accents (#66bb6a) for status and meters
- Charcoal backgrounds (#292929, #3d3d3d)
- Perfect for extended studio sessions

### REAPER Light
- Bright professional theme
- Green for active states, orange for solo
- High contrast for bright environments
- Reduces eye strain in daylight

### High Contrast
- Maximum contrast for accessibility
- Bright neon colors
- Larger font sizes
- Thicker shadows and borders

## Creating Custom Themes

### Method 1: Theme Switcher UI

1. Click the palette icon (bottom-right) to open Theme Switcher
2. Click "Save Current as Custom"
3. Enter a name and confirm
4. Theme is saved to localStorage and available immediately

### Method 2: Programmatic

```tsx
import { useTheme } from '../themes/ThemeContext';
import { Theme } from '../themes/types';

const { createCustomTheme } = useTheme();

const myTheme: Theme = {
  id: 'my-theme',
  name: 'My Custom Theme',
  // ... all theme properties
};

createCustomTheme(myTheme);
```

## Exporting & Importing

### Export a Theme
1. Open Theme Switcher panel
2. Click the download icon next to custom theme
3. JSON file downloaded (e.g., `my-theme.theme.json`)

### Import a Theme
1. Open Theme Switcher panel
2. Click "Import Theme"
3. Select a `.json` theme file
4. Theme is loaded and available

## Customizing Components

### Use Theme Colors in Components

```tsx
export default function MyButton() {
  const { currentTheme } = useTheme();
  
  return (
    <button style={{
      backgroundColor: currentTheme.colors.ui.play,
      color: currentTheme.colors.text.primary,
    }}>
      Play
    </button>
  );
}
```

### Use Layout Values

```tsx
export default function TrackPanel() {
  const { currentTheme } = useTheme();
  
  return (
    <div style={{
      width: currentTheme.layout.tcp.width,
      gap: currentTheme.layout.spacing.md,
    }}>
      {/* Content */}
    </div>
  );
}
```

## Storage & Persistence

- **Default Themes**: Always available, read-only
- **Custom Themes**: Stored in localStorage under `corelogic_theme_config`
- **Auto-Save**: Theme preference saved automatically when switched
- **Export/Import**: Share themes as `.json` files

## REAPER Design Philosophy

This system implements REAPER's professional approach to theming:

1. **Color-Coded Functions**: Mute (blue), Solo (yellow), Record (red), Play (green)
2. **Professional Metering**: Proper meter graphics with peak indicators
3. **Consistent Layout**: TCP/MCP/Transport hierarchy mirroring REAPER
4. **Accessibility**: High contrast theme with larger sizes
5. **Customization**: Power users can create exact color schemes

## Future Enhancements

- [ ] Theme editor UI (color picker, live preview)
- [ ] Preset theme variants (compact, wide strip, etc.)
- [ ] Community theme sharing
- [ ] Per-component theme overrides
- [ ] Animation/transition customization
- [ ] Dark mode auto-detection

## Files Reference

### src/themes/types.ts
Defines all TypeScript interfaces for themes, colors, fonts, and layout.

### src/themes/presets.ts
Exports three default themes:
- `reaper_default` - REAPER Dark
- `reaper_light` - Light theme
- `high_contrast` - Accessibility theme

### src/themes/ThemeContext.tsx
React Context provider managing:
- Current theme state
- Theme switching
- Custom theme CRUD
- Export/Import functionality
- CSS variable application

### src/components/ThemeSwitcher.tsx
Floating UI panel for:
- Viewing all themes
- Switching themes
- Creating custom themes from current
- Exporting/importing themes
