"""
Codette Quantum DAW GUI v7.0
Visual-only edition
- Animated splash screen
- Global theme support
- Branding + watermark
"""

import sys
import random
from PyQt6.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel, QProgressBar,
)

# import your main DAW GUI
from codette_daw_v6 import CodetteDAWGUI, ThemeManager


# ---------------------------------------------------------
#  ✨ Splash Screen
# ---------------------------------------------------------
class SplashScreen(QWidget):
    def __init__(self, app):
        super().__init__()
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.resize(600, 400)

        self.theme = ThemeManager.THEMES["Graphite"]

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(12)

        # Logo
        self.logo = QLabel("🎧  Codette Quantum DAW")
        self.logo.setFont(QFont("Segoe UI Semibold", 24))
        self.logo.setStyleSheet("color:#ffaa00;")
        layout.addWidget(self.logo, alignment=Qt.AlignmentFlag.AlignCenter)

        # Subtitle
        self.subtitle = QLabel("Phase 3 • Quantum Interface Engine")
        self.subtitle.setFont(QFont("Segoe UI", 12))
        self.subtitle.setStyleSheet("color:#ccc; margin-bottom:10px;")
        layout.addWidget(self.subtitle, alignment=Qt.AlignmentFlag.AlignCenter)

        # Progress bar
        self.progress = QProgressBar()
        self.progress.setRange(0, 100)
        self.progress.setValue(0)
        self.progress.setStyleSheet("""
            QProgressBar {
                background-color: #222;
                border: 1px solid #444;
                border-radius: 8px;
                height: 10px;
            }
            QProgressBar::chunk {
                background-color: #ffaa00;
                border-radius: 8px;
            }
        """)
        self.progress.setMaximumWidth(300)
        layout.addWidget(self.progress, alignment=Qt.AlignmentFlag.AlignCenter)

        # Status label
        self.status = QLabel("Initializing quantum engine...")
        self.status.setFont(QFont("Consolas", 10))
        self.status.setStyleSheet("color:#aaa;")
        layout.addWidget(self.status, alignment=Qt.AlignmentFlag.AlignCenter)

        # Footer
        self.footer = QLabel("Codette Quantum • © 2025 Phase 3 Build")
        self.footer.setFont(QFont("Consolas", 9))
        self.footer.setStyleSheet("color:#777; margin-top:8px;")
        layout.addWidget(self.footer, alignment=Qt.AlignmentFlag.AlignCenter)

        # Fade animation
        self.fade_in = QPropertyAnimation(self, b"windowOpacity")
        self.fade_in.setDuration(1000)
        self.fade_in.setStartValue(0)
        self.fade_in.setEndValue(1)
        self.fade_in.setEasingCurve(QEasingCurve.Type.InOutQuad)
        self.fade_in.start()

        # Simulated loading
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_progress)
        self.progress_value = 0
        self.timer.start(40)
        self.app = app

        # Loading messages
        self.messages = [
            "Initializing quantum engine...",
            "Loading theme system...",
            "Configuring audio engine...",
            "Setting up transport clock...",
            "Initializing mixer strips...",
            "Rendering waveform display...",
            "Launching interface...",
        ]
        self.message_index = 0

    def update_progress(self):
        self.progress_value += random.randint(1, 4)
        self.progress.setValue(self.progress_value)

        # Update message based on progress
        msg_index = (self.progress_value // 15) % len(self.messages)
        if msg_index != self.message_index:
            self.message_index = msg_index
            self.status.setText(self.messages[msg_index])

        if self.progress_value >= 100:
            self.timer.stop()
            self.status.setText("Complete! Launching interface...")
            QTimer.singleShot(500, self.fade_out_and_launch)

    def fade_out_and_launch(self):
        fade = QPropertyAnimation(self, b"windowOpacity")
        fade.setDuration(1000)
        fade.setStartValue(1)
        fade.setEndValue(0)
        fade.setEasingCurve(QEasingCurve.Type.InOutQuad)
        fade.finished.connect(self.launch_main)
        fade.start()

    def launch_main(self):
        self.close()
        self.main_window = CodetteDAWGUI()
        self.main_window.show()


# ---------------------------------------------------------
#  🪩 Run App
# ---------------------------------------------------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    splash = SplashScreen(app)
    splash.show()
    sys.exit(app.exec())
