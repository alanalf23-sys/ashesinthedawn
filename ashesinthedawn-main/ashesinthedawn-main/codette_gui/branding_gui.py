"""Main DAW GUI with branding and theme support"""

import math
import random
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QColor, QPainterPath, QPen, QFont
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QFrame, QSlider, QScrollArea, QComboBox, QGraphicsScene, QGraphicsView
)

from .themes import ThemeManager


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
        self.setWindowTitle("Codette Quantum DAW GUI")
        self.resize(1600, 1000)
        self.move(100, 100)  # Position window

        self.theme_manager = ThemeManager()
        self.theme = self.theme_manager.THEMES[self.theme_manager.current]
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(4)

        # Header bar
        header = QHBoxLayout()
        header.setContentsMargins(8, 8, 8, 8)
        header.setSpacing(16)

        self.logo = QLabel("🎧  Codette Quantum DAW")
        self.logo.setFont(QFont("Segoe UI Semibold", 16))
        self.logo.setStyleSheet(f"color:{self.theme['accent']};")

        self.version = QLabel("v7.0")
        self.version.setStyleSheet(f"color:{self.theme['text']}; font-size:12px;")

        header.addWidget(self.logo)
        header.addWidget(self.version)
        header.addStretch()

        self.selector = QComboBox()
        self.selector.addItems(ThemeManager.THEMES.keys())
        self.selector.setCurrentText(self.theme_manager.current)
        self.selector.currentTextChanged.connect(self.change_theme)
        self.selector.setMaximumWidth(120)

        header.addWidget(QLabel("Theme:"))
        header.addWidget(self.selector)

        header_widget = QWidget()
        header_widget.setLayout(header)
        header_widget.setMaximumHeight(50)
        layout.addWidget(header_widget)

        # Timeline
        self.timeline = WaveformTimeline(self.theme)
        self.timeline.setMinimumHeight(180)
        self.timeline.setMaximumHeight(220)
        layout.addWidget(self.timeline)

        # Mixer label
        mixer_label = QLabel("🎚️  MIXER STRIPS")
        mixer_label.setStyleSheet(f"color:{self.theme['accent']}; font-weight:bold; padding:8px;")
        layout.addWidget(mixer_label)

        # Mixer
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet(f"background:{self.theme['background']}; border:none;")

        mixer_widget = QWidget()
        mixer_layout = QHBoxLayout(mixer_widget)
        mixer_layout.setSpacing(8)
        mixer_layout.setContentsMargins(8, 8, 8, 8)

        self.channels = [ChannelStrip(f"CH {i+1}", self.theme) for i in range(10)]
        for ch in self.channels:
            mixer_layout.addWidget(ch)
        mixer_layout.addStretch()

        scroll.setWidget(mixer_widget)
        scroll.setMinimumHeight(300)
        layout.addWidget(scroll, stretch=1)

        # Transport
        transport_label = QLabel("🎛️  TRANSPORT")
        transport_label.setStyleSheet(f"color:{self.theme['accent']}; font-weight:bold; padding:8px;")
        layout.addWidget(transport_label)

        self.transport = TransportBar(self.theme)
        self.transport.setMinimumHeight(60)
        layout.addWidget(self.transport)

        # Watermark
        self.watermark = QLabel("Codette Quantum • Prototype Visual GUI • Phase 3 Build")
        self.watermark.setStyleSheet("color:#666; font-size:9px; margin:4px; text-align:right;")
        layout.addWidget(self.watermark, alignment=Qt.AlignmentFlag.AlignRight)

        self.update_theme(self.theme)

    def change_theme(self, name):
        theme = self.theme_manager.THEMES[name]
        self.update_theme(theme)

    def update_theme(self, theme):
        self.theme = theme
        self.setStyleSheet(f"background:{theme['background']};")
        self.logo.setStyleSheet(f"color:{theme['accent']};")
        self.version.setStyleSheet(f"color:{theme['text']}; font-size:12px;")
        self.timeline.update_theme(theme)
        self.transport.update_theme(theme)
        for ch in self.channels:
            ch.update_theme(theme)
        self.watermark.setStyleSheet("color:#777; font-size:9px; margin:4px;")
