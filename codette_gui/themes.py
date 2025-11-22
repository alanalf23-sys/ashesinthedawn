"""Theme management system for Codette Quantum DAW"""

from PyQt6.QtGui import QColor, QPalette
from PyQt6.QtWidgets import QApplication


class ThemeManager:
    """Centralized theme management for consistent styling"""

    THEMES = {
        "Dark": {
            "background": "#111",
            "panel": "#1e1e1e",
            "accent": "#00ffaa",
            "text": "#ccc",
            "vu": "#0f0",
            "wave": "#00ffaa",
            "auto": "#ffcc00",
        },
        "Light": {
            "background": "#f5f5f5",
            "panel": "#e0e0e0",
            "accent": "#0099cc",
            "text": "#222",
            "vu": "#0a0",
            "wave": "#0077aa",
            "auto": "#ff6600",
        },
        "Graphite": {
            "background": "#2a2a2a",
            "panel": "#3b3b3b",
            "accent": "#ffaa00",
            "text": "#ddd",
            "vu": "#0f0",
            "wave": "#ffaa00",
            "auto": "#00ccff",
        },
        "Neon": {
            "background": "#0a0a0f",
            "panel": "#151522",
            "accent": "#ff00ff",
            "text": "#f0f0f0",
            "vu": "#0ff",
            "wave": "#00ffff",
            "auto": "#ff33cc",
        },
        "Twilight": {
            "background": "#1a1a2e",
            "panel": "#16213e",
            "accent": "#e94560",
            "text": "#eaeaea",
            "vu": "#00ff88",
            "wave": "#e94560",
            "auto": "#00d4ff",
        },
        "Sunset": {
            "background": "#2d1b1b",
            "panel": "#3d2626",
            "accent": "#ff6b35",
            "text": "#e8ddd4",
            "vu": "#ffaa00",
            "wave": "#ff6b35",
            "auto": "#ffd700",
        },
    }

    def __init__(self):
        self.current = "Graphite"

    def theme(self):
        """Get current theme dictionary"""
        return self.THEMES[self.current]

    def apply(self, app: QApplication, window=None):
        """Apply current theme to application"""
        theme = self.theme()
        palette = app.palette()
        palette.setColor(QPalette.ColorRole.Window, QColor(theme["background"]))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(theme["text"]))
        app.setPalette(palette)
        if window and hasattr(window, "update_theme"):
            window.update_theme(theme)

    def get_theme(self, name: str = None):
        """Get theme dictionary by name"""
        if name is None:
            return self.theme()
        return self.THEMES.get(name, self.THEMES["Graphite"])

    def set_theme(self, name: str):
        """Set current theme by name"""
        if name in self.THEMES:
            self.current = name
            return True
        return False

    def get_available_themes(self):
        """Get list of available theme names"""
        return list(self.THEMES.keys())

    def verify_theme(self, name: str) -> dict:
        """Verify theme exists and return color info"""
        if name not in self.THEMES:
            return {"valid": False, "error": f"Theme '{name}' not found"}

        theme = self.THEMES[name]
        required_keys = {"background", "panel", "accent", "text", "vu", "wave", "auto"}
        missing = required_keys - set(theme.keys())

        if missing:
            return {
                "valid": False,
                "error": f"Missing keys: {missing}",
                "theme": name
            }

        return {
            "valid": True,
            "theme": name,
            "colors": theme
        }

    def verify_all_themes(self) -> list:
        """Verify all themes are valid"""
        results = []
        for theme_name in self.get_available_themes():
            results.append(self.verify_theme(theme_name))
        return results

    def print_theme_palette(self, name: str = None):
        """Print theme colors for verification"""
        if name is None:
            name = self.current

        if name not in self.THEMES:
            print(f"Theme '{name}' not found")
            return

        theme = self.THEMES[name]
        print(f"\n{'='*50}")
        print(f"Theme: {name}")
        print(f"{'='*50}")
        for key, color in theme.items():
            print(f"  {key:12} : {color}")
        print(f"{'='*50}\n")
