"""
Codette Quantum DAW GUI v6.0
Visual-only edition with global themes, branding, and watermark
"""

import sys
import math
import random
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QColor, QPainterPath, QPen, QFont, QPalette
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QFrame, QSlider, QScrollArea, QComboBox, QGraphicsScene, QGraphicsView
)

# ---------------------------------------------------------
#  🎨 Theme Manager
# ---------------------------------------------------------
class ThemeManager:
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
    }

    def __init__(self):
        self.current = "Graphite"

    def apply(self, app, window):
        theme = self.THEMES[self.current]
        palette = app.palette()
        palette.setColor(QPalette.ColorRole.Window, QColor(theme["background"]))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(theme["text"]))
        app.setPalette(palette)
        window.update_theme(theme)


# ---------------------------------------------------------
#  🎞️ Waveform Timeline
# ---------------------------------------------------------
class WaveformTimeline(QGraphicsView):
    def __init__(self, theme):
        super().__init__()
        self.scene = QGraphicsScene()
        self.setScene(self.scene)
        self.theme = theme
        self.phase = 0
        self.automation_phase = 0
        self.timer = QTimer()
        self.timer.timeout.connect(self.animate)
        self.timer.start(60)
        self.waveform = self.scene.addPath(QPainterPath(), QPen(QColor(theme["wave"]), 2))
        self.automation_curve = self.scene.addPath(QPainterPath(), QPen(QColor(theme["auto"]), 1.5, Qt.PenStyle.DashLine))
        self.setStyleSheet(f"background-color:{theme['background']}; border-bottom:1px solid #444;")

    def update_theme(self, theme):
        self.theme = theme
        self.waveform.setPen(QPen(QColor(theme["wave"]), 2))
        self.automation_curve.setPen(QPen(QColor(theme["auto"]), 1.5, Qt.PenStyle.DashLine))
        self.setStyleSheet(f"background-color:{theme['background']}; border-bottom:1px solid #444;")

    def animate(self):
        w, h = 1200, 200
        path = QPainterPath()
        path.moveTo(0, h/2)
        for x in range(0, w, 5):
            y = h/2 + math.sin(x/50 + self.phase) * 40 * math.sin(self.phase/2)
            path.lineTo(x, y)
        self.waveform.setPath(path)
        self.phase += 0.15

        auto = QPainterPath()
        auto.moveTo(0, h/2)
        for x in range(0, w, 20):
            y = h/2 + math.sin((x/100) + self.automation_phase) * 80
            auto.lineTo(x, y)
        self.automation_curve.setPath(auto)
        self.automation_phase += 0.05


# ---------------------------------------------------------
#  🎚️ Plugin Rack
# ---------------------------------------------------------
class PluginRack(QFrame):
    def __init__(self, theme):
        super().__init__()
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(4, 4, 4, 4)
        self.update_theme(theme)
        for fx in ["EQ", "Compressor", "Reverb"]:
            row = QHBoxLayout()
            label = QLabel(fx)
            knob = QSlider(Qt.Orientation.Horizontal)
            knob.setRange(0, 100)
            knob.setValue(random.randint(30, 70))
            row.addWidget(label)
            row.addWidget(knob)
            self.layout.addLayout(row)

    def update_theme(self, theme):
        self.setStyleSheet(f"""
            QFrame {{ background:{theme['panel']}; border:1px solid #444; border-radius:6px; }}
            QLabel {{ color:{theme['text']}; font-size:11px; }}
            QSlider::groove:horizontal {{ background:{theme['accent']}; height:4px; border-radius:2px; }}
            QSlider::handle:horizontal {{
                background:{theme['text']}; border:1px solid #333;
                width:10px; margin:-4px 0; border-radius:6px;
            }}
        """)


# ---------------------------------------------------------
#  🎚️ Channel Strip
# ---------------------------------------------------------
class ChannelStrip(QFrame):
    def __init__(self, label, theme):
        super().__init__()
        self.theme = theme
        self.setFixedWidth(120)
        self.layout = QVBoxLayout(self)
        self.layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.name = QLabel(label)
        self.layout.addWidget(self.name)
        self.fader = QSlider(Qt.Orientation.Vertical)
        self.fader.setRange(0, 100)
        self.fader.setValue(random.randint(30, 70))
        self.layout.addWidget(self.fader)
        self.pan = QSlider(Qt.Orientation.Horizontal)
        self.pan.setRange(-50, 50)
        self.pan.setValue(0)
        self.layout.addWidget(self.pan)
        self.vu = QLabel("▁▂▃▄▅▆▇█")
        self.layout.addWidget(self.vu)
        self.toggle = QPushButton("▼ Plugins")
        self.layout.addWidget(self.toggle)
        self.rack = PluginRack(theme)
        self.layout.addWidget(self.rack)
        self.rack.setVisible(False)
        self.toggle.clicked.connect(self.toggle_rack)
        self.update_theme(theme)
        self.timer = QTimer()
        self.timer.timeout.connect(self.animate_vu)
        self.timer.start(150)

    def toggle_rack(self):
        vis = not self.rack.isVisible()
        self.rack.setVisible(vis)
        self.toggle.setText("▲ Hide" if vis else "▼ Plugins")

    def animate_vu(self):
        level = random.randint(1, 8)
        bar = "▁▂▃▄▅▆▇█"[level-1:]
        self.vu.setText(bar)
        self.vu.setStyleSheet(f"color:{self.theme['vu']}; font-family:Consolas;")

    def update_theme(self, theme):
        self.theme = theme
        self.setStyleSheet(f"""
            QFrame {{ background:{theme['panel']}; border:1px solid #333; border-radius:8px; }}
            QLabel {{ color:{theme['text']}; font-size:11px; }}
            QPushButton {{
                background:{theme['panel']}; color:{theme['text']};
                border:1px solid #444; border-radius:4px; font-size:11px;
            }}
            QPushButton:hover {{ background:{theme['accent']}; color:black; }}
        """)
        self.rack.update_theme(theme)


# ---------------------------------------------------------
#  🚀 Transport Bar
# ---------------------------------------------------------
class TransportBar(QFrame):
    def __init__(self, theme):
        super().__init__()
        layout = QHBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.play = QPushButton("▶")
        self.stop = QPushButton("■")
        self.rec = QPushButton("●")
        for b in [self.play, self.stop, self.rec]:
            layout.addWidget(b)
        self.time_label = QLabel("00:00:00")
        layout.addWidget(self.time_label)
        self.seconds = 0
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_time)
        self.play.clicked.connect(lambda: self.timer.start(1000))
        self.stop.clicked.connect(lambda: self.timer.stop())
        self.update_theme(theme)

    def update_theme(self, theme):
        self.setStyleSheet(f"""
            QFrame {{ background:{theme['panel']}; border-top:1px solid #666; }}
            QPushButton {{
                color:{theme['text']}; font-size:14px;
                background:{theme['background']};
                border:1px solid #555; padding:6px 12px; border-radius:6px;
            }}
            QPushButton:hover {{ background:{theme['accent']}; color:black; }}
        """)
        self.time_label.setStyleSheet(f"color:{theme['accent']}; font-size:16px; font-family:Consolas;")

    def update_time(self):
        self.seconds += 1
        h, m, s = self.seconds // 3600, (self.seconds % 3600)//60, self.seconds % 60
        self.time_label.setText(f"{h:02}:{m:02}:{s:02}")


# ---------------------------------------------------------
#  🧠 Main Window
# ---------------------------------------------------------
class CodetteDAWGUI(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Codette Quantum DAW GUI (Branded)")
        self.resize(1600, 900)
        self.theme_manager = ThemeManager()
        self.theme = self.theme_manager.THEMES[self.theme_manager.current]
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Header bar
        header = QHBoxLayout()
        self.logo = QLabel("🎧  Codette Quantum DAW")
        self.logo.setFont(QFont("Segoe UI Semibold", 16))
        self.logo.setStyleSheet(f"color:{self.theme['accent']};")
        self.version = QLabel("v6.0")
        self.version.setStyleSheet(f"color:{self.theme['text']}; font-size:12px; margin-left:8px;")
        header.addWidget(self.logo)
        header.addWidget(self.version)
        header.addStretch()
        self.selector = QComboBox()
        self.selector.addItems(ThemeManager.THEMES.keys())
        self.selector.setCurrentText(self.theme_manager.current)
        self.selector.currentTextChanged.connect(self.change_theme)
        header.addWidget(QLabel("Theme:"))
        header.addWidget(self.selector)
        layout.addLayout(header)

        # Timeline
        self.timeline = WaveformTimeline(self.theme)
        self.timeline.setFixedHeight(250)
        layout.addWidget(self.timeline)

        # Mixer
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        mixer_widget = QWidget()
        mixer_layout = QHBoxLayout(mixer_widget)
        self.channels = [ChannelStrip(f"CH {i+1}", self.theme) for i in range(10)]
        for ch in self.channels:
            mixer_layout.addWidget(ch)
        scroll.setWidget(mixer_widget)
        layout.addWidget(scroll)

        # Transport
        self.transport = TransportBar(self.theme)
        layout.addWidget(self.transport)

        # Watermark
        self.watermark = QLabel("Codette Quantum • Prototype Visual GUI")
        self.watermark.setStyleSheet(f"color:{self.theme['text']}; font-size:10px; margin:4px;")
        layout.addWidget(self.watermark, alignment=Qt.AlignmentFlag.AlignRight)

    def change_theme(self, name):
        theme = self.theme_manager.THEMES[name]
        self.update_theme(theme)

    def update_theme(self, theme):
        self.theme = theme
        self.logo.setStyleSheet(f"color:{theme['accent']};")
        self.version.setStyleSheet(f"color:{theme['text']};")
        self.timeline.update_theme(theme)
        self.transport.update_theme(theme)
        for ch in self.channels:
            ch.update_theme(theme)
        self.watermark.setStyleSheet(f"color:{theme['text']}; font-size:10px; margin:4px;")


# ---------------------------------------------------------
#  🪩 Run App
# ---------------------------------------------------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    daw = CodetteDAWGUI()
    daw.show()
    sys.exit(app.exec())
