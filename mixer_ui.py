from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout,
    QSlider, QLabel, QPushButton, QFrame, QScrollArea,
    QGraphicsDropShadowEffect, QProgressBar
)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QColor, QPalette, QFont
import sys
import random

class AnalogFader(QFrame):
    """High-end analog-style channel strip with warmth and glow"""
    def __init__(self, channel_name="CH 1"):
        super().__init__()
        self.setFixedWidth(90)
        self.setStyleSheet("""
            QFrame {
                background: qlineargradient(
                    spread:pad, x1:0, y1:0, x2:0, y2:1,
                    stop:0 #333, stop:1 #111);
                border: 2px solid #666;
                border-radius: 8px;
            }
            QLabel { color: #ccc; font-size: 11px; }
        """)
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.label = QLabel(channel_name)
        self.slider = QSlider(Qt.Orientation.Vertical)
        self.slider.setMinimum(0)
        self.slider.setMaximum(100)
        self.slider.setValue(random.randint(20, 80))
        self.slider.setStyleSheet("""
            QSlider::groove:vertical {
                background: #222;
                width: 8px;
                border-radius: 4px;
            }
            QSlider::handle:vertical {
                background: qradialgradient(
                    cx:0.4, cy:0.4, radius:0.6,
                    fx:0.4, fy:0.4,
                    stop:0 #f6f6f6, stop:1 #999);
                border: 1px solid #333;
                height: 20px;
                margin: -2px 0;
                border-radius: 6px;
            }
        """)
        self.vu = QProgressBar()
        self.vu.setOrientation(Qt.Orientation.Vertical)
        self.vu.setTextVisible(False)
        self.vu.setRange(0, 100)
        self.vu.setValue(random.randint(10, 70))
        self.vu.setStyleSheet("""
            QProgressBar {
                background: #222;
                border: 1px solid #000;
                border-radius: 4px;
            }
            QProgressBar::chunk {
                background: qlineargradient(x1:0,y1:0,x2:1,y2:0,
                    stop:0 #0f0, stop:1 #ff0);
            }
        """)
        layout.addWidget(self.label)
        layout.addWidget(self.slider)
        layout.addWidget(self.vu)

        # subtle glow
        glow = QGraphicsDropShadowEffect()
        glow.setBlurRadius(20)
        glow.setColor(QColor(255, 200, 100))
        glow.setOffset(0)
        self.setGraphicsEffect(glow)


class TransportBar(QFrame):
    """Clean futuristic transport with glassy interface"""
    def __init__(self):
        super().__init__()
        self.setFixedHeight(80)
        self.setStyleSheet("""
            QFrame {
                background: qlineargradient(
                    x1:0, y1:0, x2:0, y2:1,
                    stop:0 rgba(40,40,50,230),
                    stop:1 rgba(10,10,15,240));
                border-top: 1px solid #888;
            }
            QPushButton {
                color: white; background: #222;
                border: 1px solid #555;
                padding: 6px 12px;
                border-radius: 6px;
            }
            QPushButton:hover {
                background: #444;
            }
        """)
        layout = QHBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        for label in ["⏮", "▶", "⏸", "⏹", "⏭"]:
            btn = QPushButton(label)
            btn.setFont(QFont("Segoe UI Symbol", 18))
            layout.addWidget(btn)

        self.timer_label = QLabel("00:00:00")
        self.timer_label.setFont(QFont("Consolas", 16))
        self.timer_label.setStyleSheet("color: cyan; margin-left:20px;")
        layout.addWidget(self.timer_label)

        self.timer = QTimer()
        self.seconds = 0
        self.timer.timeout.connect(self.update_time)
        self.timer.start(1000)

    def update_time(self):
        self.seconds += 1
        h, m, s = self.seconds // 3600, (self.seconds % 3600)//60, self.seconds % 60
        self.timer_label.setText(f"{h:02}:{m:02}:{s:02}")


class TrackTimeline(QFrame):
    """High-tech clean track timeline with LED grid"""
    def __init__(self):
        super().__init__()
        self.setStyleSheet("""
            QFrame {
                background: qlineargradient(
                    x1:0, y1:0, x2:1, y2:0,
                    stop:0 #101010, stop:1 #202020);
                border-bottom: 1px solid #555;
            }
        """)
        layout = QVBoxLayout(self)
        for i in range(4):
            track = QLabel(f"Track {i+1}  ▓▓▓▓▓▓▓░░░░░░░▓▓▓▓░░")
            track.setStyleSheet("color: #0f0; font-family: Consolas; font-size: 13px;")
            layout.addWidget(track)


class MixerWindow(QWidget):
    """Main mixer view blending analog and digital worlds"""
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Codette Quantum DAW Mixer")
        self.resize(1400, 800)

        palette = self.palette()
        palette.setColor(QPalette.ColorRole.Window, QColor(15, 15, 20))
        self.setPalette(palette)

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0,0,0,0)

        self.timeline = TrackTimeline()
        main_layout.addWidget(self.timeline)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        mixer_widget = QWidget()
        hbox = QHBoxLayout(mixer_widget)
        hbox.setAlignment(Qt.AlignmentFlag.AlignCenter)

        for i in range(12):
            hbox.addWidget(AnalogFader(f"CH {i+1}"))

        scroll.setWidget(mixer_widget)
        main_layout.addWidget(scroll)

        self.transport = TransportBar()
        main_layout.addWidget(self.transport)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    daw = MixerWindow()
    daw.show()
    sys.exit(app.exec())
