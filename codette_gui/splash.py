"""Animated splash screen for Codette Quantum DAW"""

import random
from PyQt6.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QLabel, QProgressBar

from .themes import ThemeManager


class SplashScreen(QWidget):
    """Professional animated splash screen with loading simulation"""

    def __init__(self, app):
        super().__init__()
        self.app = app
        self.main_window = None

        # Window setup
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.resize(600, 400)

        # Set center position
        screen = app.primaryScreen()
        screen_geo = screen.geometry()
        self.move(screen_geo.center().x() - 300, screen_geo.center().y() - 200)

        # Theme
        self.theme_manager = ThemeManager()
        self.theme = self.theme_manager.THEMES[self.theme_manager.current]

        # Layout
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(12)
        layout.setContentsMargins(20, 20, 20, 20)

        # Logo
        self.logo = QLabel("🎧  Codette Quantum DAW")
        self.logo.setFont(QFont("Segoe UI Semibold", 24))
        self.logo.setStyleSheet(f"color:{self.theme['accent']};")
        layout.addWidget(self.logo, alignment=Qt.AlignmentFlag.AlignCenter)

        # Subtitle
        self.subtitle = QLabel("Phase 3 • Quantum Interface Engine")
        self.subtitle.setFont(QFont("Segoe UI", 12))
        self.subtitle.setStyleSheet(f"color:{self.theme['text']};")
        layout.addWidget(self.subtitle, alignment=Qt.AlignmentFlag.AlignCenter)

        # Progress bar
        self.progress = QProgressBar()
        self.progress.setRange(0, 100)
        self.progress.setValue(0)
        self.progress.setStyleSheet(f"""
            QProgressBar {{
                background-color: {self.theme['panel']};
                border: 1px solid #444;
                border-radius: 8px;
                height: 10px;
            }}
            QProgressBar::chunk {{
                background-color: {self.theme['accent']};
                border-radius: 8px;
            }}
        """)
        self.progress.setMaximumWidth(300)
        layout.addWidget(self.progress, alignment=Qt.AlignmentFlag.AlignCenter)

        # Status label
        self.status = QLabel("Initializing quantum engine...")
        self.status.setFont(QFont("Consolas", 10))
        self.status.setStyleSheet(f"color:{self.theme['text']};")
        layout.addWidget(self.status, alignment=Qt.AlignmentFlag.AlignCenter)

        # Footer
        self.footer = QLabel("Codette Quantum • © 2025 Phase 3 Build")
        self.footer.setFont(QFont("Consolas", 9))
        self.footer.setStyleSheet("color:#777;")
        layout.addWidget(self.footer, alignment=Qt.AlignmentFlag.AlignCenter)

        # Fade in animation
        self.fade_in = QPropertyAnimation(self, b"windowOpacity")
        self.fade_in.setDuration(1000)
        self.fade_in.setStartValue(0)
        self.fade_in.setEndValue(1)
        self.fade_in.setEasingCurve(QEasingCurve.Type.InOutQuad)
        self.fade_in.start()

        # Loading simulation
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_progress)
        self.progress_value = 0
        self.timer.start(40)

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
        """Update progress bar and status messages"""
        self.progress_value += random.randint(1, 4)
        self.progress.setValue(min(self.progress_value, 100))

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
        """Fade out and launch main window"""
        fade = QPropertyAnimation(self, b"windowOpacity")
        fade.setDuration(1000)
        fade.setStartValue(1)
        fade.setEndValue(0)
        fade.setEasingCurve(QEasingCurve.Type.InOutQuad)
        fade.finished.connect(self.launch_main)
        fade.start()

    def launch_main(self):
        """Close splash and launch main DAW window"""
        self.close()
        # Lazy import to avoid circular dependency
        from .branding_gui import CodetteDAWGUI
        self.main_window = CodetteDAWGUI()
        self.main_window.show()
