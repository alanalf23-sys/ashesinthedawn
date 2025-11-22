"""
Codette Quantum GUI package
Importable launcher for the visual-only DAW interface.
"""

import sys
from PyQt6.QtWidgets import QApplication
from .splash import SplashScreen

__version__ = "7.0"
__all__ = ["launch_codette_gui"]


def launch_codette_gui():
    """Launch the Codette Quantum DAW GUI with splash screen"""
    app = QApplication.instance() or QApplication(sys.argv)

    # Import main window after app creation
    from .branding_gui import CodetteDAWGUI
    from .splash import SplashScreen
    from PyQt6.QtCore import QTimer

    # Create splash screen
    splash = SplashScreen(app)
    splash.show()
    app.processEvents()

    # Create main window in advance
    main_window = CodetteDAWGUI()

    # Schedule showing main window and closing splash
    def show_main():
        try:
            splash.close()
            main_window.show()
            main_window.raise_()
            main_window.activateWindow()
        except Exception as e:
            print(f"Error showing main window: {e}")

    QTimer.singleShot(2500, show_main)

    return app.exec()
