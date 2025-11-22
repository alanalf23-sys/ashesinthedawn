"""
Codette Quantum DAW GUI v4.0
Visual-only edition
- Analog mixer
- Quantum transport
- Animated waveform + automation
- Collapsible plugin racks
"""

import sys
import math
import random
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QColor, QPainterPath, QPen, QFont
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QFrame, QSlider, QScrollArea, QGraphicsDropShadowEffect, QGraphicsScene, QGraphicsView
)

# ---------------------------------------------------------
#  🎞️ Waveform Timeline
# ---------------------------------------------------------
class WaveformTimeline(QGraphicsView):
    def __init__(self):
        super().__init__()
        self.scene = QGraphicsScene()
        self.setScene(self.scene)
        self.setStyleSheet("background-color:#111; border-bottom:1px solid #333;")
        self.phase = 0
        self.automation_phase = 0
        self.timer = QTimer()
        self.timer.timeout.connect(self.animate)
        self.timer.start(60)
        self.waveform = self.scene.addPath(QPainterPath(), QPen(QColor("#00ffaa"), 2))
        self.automation_curve = self.scene.addPath(QPainterPath(), QPen(QColor("#ffcc00"), 1.5, Qt.PenStyle.DashLine))

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
#  🎚️ Collapsible Plugin Rack
# ---------------------------------------------------------
class PluginRack(QFrame):
    """Visual-only plugin rack with knobs & meters"""
    def __init__(self):
        super().__init__()
        self.setStyleSheet("""
            QFrame {
                background:#1b1b1b;
                border:1px solid #333;
                border-radius:6px;
            }
            QLabel { color:#aaa; font-size:11px; }
        """)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(4, 4, 4, 4)
        self.knobs = []

        # Plugin placeholder knobs/meters
        for fx in ["EQ", "Compressor", "Reverb"]:
            fx_row = QHBoxLayout()
            label = QLabel(fx)
            label.setFixedWidth(70)
            knob = QSlider(Qt.Orientation.Horizontal)
            knob.setRange(0, 100)
            knob.setValue(random.randint(30, 70))
            knob.setStyleSheet("""
                QSlider::groove:horizontal { background:#222; height:4px; border-radius:2px; }
                QSlider::handle:horizontal {
                    background:#888; border:1px solid #444;
                    width:12px; margin:-4px 0; border-radius:6px;
                }
            """)
            fx_row.addWidget(label)
            fx_row.addWidget(knob)
            self.layout.addLayout(fx_row)
            self.knobs.append(knob)

    def set_visible(self, visible: bool):
        self.setVisible(visible)


# ---------------------------------------------------------
#  🎚️ Channel Strip
# ---------------------------------------------------------
class ChannelStrip(QFrame):
    def __init__(self, label="CH 1", color=QColor("#ffcc66")):
        super().__init__()
        self.setFixedWidth(120)
        self.setStyleSheet("""
            QFrame {
                background:qlineargradient(x1:0, y1:0, x2:0, y2:1,
                    stop:0 #2a2a2a, stop:1 #101010);
                border:1px solid #444; border-radius:8px;
            }
            QLabel { color:#ccc; font-size:11px; }
        """)

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        name = QLabel(label)
        name.setStyleSheet("font-weight:bold; color:#bbb;")
        layout.addWidget(name)

        # Fader
        self.fader = QSlider(Qt.Orientation.Vertical)
        self.fader.setRange(0, 100)
        self.fader.setValue(random.randint(30, 70))
        self.fader.setStyleSheet("""
            QSlider::groove:vertical { background:#111; width:8px; border-radius:4px; }
            QSlider::handle:vertical {
                background:qradialgradient(cx:0.4,cy:0.4,radius:0.6,fx:0.4,fy:0.4,
                    stop:0 #fff, stop:1 #aaa);
                border:1px solid #333; height:18px; border-radius:6px;
            }
        """)
        layout.addWidget(self.fader)

        # Pan knob
        self.pan = QSlider(Qt.Orientation.Horizontal)
        self.pan.setRange(-50, 50)
        self.pan.setValue(0)
        self.pan.setStyleSheet("QSlider::groove:horizontal{background:#333;height:4px;}")
        layout.addWidget(self.pan)

        # VU meter (fake animation)
        self.vu = QLabel("▁▂▃▄▅▆▇█")
        self.vu.setStyleSheet("color:#0f0; font-family:Consolas; font-size:14px;")
        layout.addWidget(self.vu)

        # Plugin rack toggle
        self.toggle_btn = QPushButton("▼ Plugins")
        self.toggle_btn.setStyleSheet("color:#bbb; background:#222; border:1px solid #444; border-radius:4px; font-size:11px;")
        layout.addWidget(self.toggle_btn)

        # Rack container
        self.rack = PluginRack()
        layout.addWidget(self.rack)
        self.rack.setVisible(False)

        self.toggle_btn.clicked.connect(self.toggle_rack)

        glow = QGraphicsDropShadowEffect()
        glow.setColor(color)
        glow.setBlurRadius(25)
        glow.setOffset(0)
        self.setGraphicsEffect(glow)

        # Animate fake VU
        self.timer = QTimer()
        self.timer.timeout.connect(self.animate_vu)
        self.timer.start(150)

    def toggle_rack(self):
        vis = not self.rack.isVisible()
        self.rack.set_visible(vis)
        self.toggle_btn.setText("▲ Hide" if vis else "▼ Plugins")

    def animate_vu(self):
        level = random.randint(1, 8)
        bar = "▁▂▃▄▅▆▇█"[level-1:]
        self.vu.setText(bar)


# ---------------------------------------------------------
#  🚀 Transport Bar
# ---------------------------------------------------------
class TransportBar(QFrame):
    def __init__(self):
        super().__init__()
        self.setFixedHeight(80)
        self.setStyleSheet("""
            QFrame {
                background:qlineargradient(x1:0,y1:0,x2:0,y2:1,
                    stop:0 rgba(35,35,40,240), stop:1 rgba(10,10,15,255));
                border-top:1px solid #666;
            }
            QPushButton {
                color:white; font-size:14px; background:#111;
                border:1px solid #555; padding:6px 12px; border-radius:6px;
            }
            QPushButton:hover { background:#333; }
        """)
        layout = QHBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.play = QPushButton("▶")
        self.stop = QPushButton("■")
        self.rec = QPushButton("●")
        self.rec.setStyleSheet("color:red;font-weight:bold;")
        for b in [self.play, self.stop, self.rec]:
            layout.addWidget(b)
        self.timer_label = QLabel("00:00:00")
        self.timer_label.setFont(QFont("Consolas", 16))
        self.timer_label.setStyleSheet("color:cyan;margin-left:20px;")
        layout.addWidget(self.timer_label)
        self.seconds = 0
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_time)
        self.play.clicked.connect(lambda: self.timer.start(1000))
        self.stop.clicked.connect(lambda: self.timer.stop())

    def update_time(self):
        self.seconds += 1
        h, m, s = self.seconds // 3600, (self.seconds % 3600)//60, self.seconds % 60
        self.timer_label.setText(f"{h:02}:{m:02}:{s:02}")


# ---------------------------------------------------------
#  🧠 Main Window
# ---------------------------------------------------------
class CodetteDAWGUI(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Codette Quantum DAW GUI (Visual + Plugin Racks)")
        self.resize(1600, 900)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Timeline
        self.timeline = WaveformTimeline()
        self.timeline.setFixedHeight(250)
        layout.addWidget(self.timeline)

        # Mixer (scrollable)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        mixer_widget = QWidget()
        hbox = QHBoxLayout(mixer_widget)
        for i in range(10):
            hue = (i * 36) % 360
            hbox.addWidget(ChannelStrip(f"CH {i+1}", QColor.fromHsv(hue, 255, 255)))
        scroll.setWidget(mixer_widget)
        layout.addWidget(scroll)

        # Transport
        layout.addWidget(TransportBar())


# ---------------------------------------------------------
#  🪩 Run App
# ---------------------------------------------------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    daw = CodetteDAWGUI()
    daw.show()
    sys.exit(app.exec())
