import PyInstaller.__main__
import sys
import os

# Get the absolute path of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Define the icon path (you can add an .ico file later)
# icon_path = os.path.join(current_dir, 'codette_icon.ico')

# Define PyInstaller arguments
args = [
    'codette_gui.py',  # Your main script
    '--onefile',  # Create a single executable
    '--noconsole',  # Don't show console window
    '--name=Codette_Quantum',  # Name of the executable
    # '--icon=' + icon_path,  # Icon for the executable (uncomment when you have an icon)
    '--add-data=codette_quantum_simplified.py;.',  # Include the Codette class file
]

# Run PyInstaller
PyInstaller.__main__.run(args)

print("Executable creation completed! Check the 'dist' folder for Codette_Quantum.exe")
