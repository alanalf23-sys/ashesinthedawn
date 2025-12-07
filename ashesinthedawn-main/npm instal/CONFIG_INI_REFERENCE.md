# CoreLogic Studio Configuration - INI Reference
# Version 7.0 (Phase 3 - GUI Integration)
# This file documents all configuration options in INI format for reference

# ==========================================
# SYSTEM CONFIGURATION
# ==========================================

[System]
# Application identification and window settings
APP_NAME = CoreLogic Studio
VERSION = 7.0
BUILD_NUMBER = 0
DEFAULT_THEME = Graphite
SPLASH_ENABLED = true
SPLASH_FADE_DURATION_MS = 1000
SPLASH_LOAD_SIMULATION = true
FPS_LIMIT = 60
WINDOW_WIDTH = 1600
WINDOW_HEIGHT = 900
MIN_WINDOW_WIDTH = 640
MIN_WINDOW_HEIGHT = 480

# ==========================================
# DISPLAY CONFIGURATION
# ==========================================

[Display]
# Analog console view and visual element settings
CHANNEL_COUNT = 10
CHANNEL_WIDTH = 120
CHANNEL_MIN_WIDTH = 80
CHANNEL_MAX_WIDTH = 200
VU_REFRESH_MS = 150
RACK_COLLAPSED_DEFAULT = false
RACK_WIDTH_EXPANDED = 300
RACK_WIDTH_COLLAPSED = 60
SHOW_WATERMARK = true
SHOW_GRID = true
GRID_SIZE = 8

# ==========================================
# THEME CONFIGURATION
# ==========================================

[Themes]
# Color theme and UI styling settings
AVAILABLE = Dark, Light, Graphite, Neon
DEFAULT = Graphite
ROTARY_CENTER = 0.5
ROTARY_MIN = -1
ROTARY_MAX = 1
TRANSITION_DURATION_MS = 200
HOVER_TRANSITION_MS = 100

# Color Palettes
[Theme.Dark]
PRIMARY = #1f2937
SECONDARY = #111827
ACCENT = #3b82f6
TEXT = #f3f4f6
TEXT_SECONDARY = #d1d5db
BORDER = #374151

[Theme.Light]
PRIMARY = #f3f4f6
SECONDARY = #ffffff
ACCENT = #2563eb
TEXT = #1f2937
TEXT_SECONDARY = #4b5563
BORDER = #e5e7eb

[Theme.Graphite]
PRIMARY = #2a2a2a
SECONDARY = #1a1a1a
ACCENT = #ffaa00
TEXT = #e0e0e0
TEXT_SECONDARY = #b0b0b0
BORDER = #404040

[Theme.Neon]
PRIMARY = #0a0e27
SECONDARY = #050812
ACCENT = #00ff88
TEXT = #00ffff
TEXT_SECONDARY = #ff00ff
BORDER = #00ff88

# ==========================================
# BEHAVIOR CONFIGURATION
# ==========================================

[Behavior]
# Control sync and interaction settings
REAPER_TRACK_FOLLOWS = REAPER
DEVICE_TRACK_FOLLOWS = DEVICE
DEVICE_TRACK_BANK_FOLLOWS = DEVICE
DEVICE_FX_FOLLOWS = LAST_TOUCHED
DEVICE_EQ_MODE = INSERT
AUTO_SAVE_ENABLED = true
AUTO_SAVE_INTERVAL_MS = 60000
UNDO_STACK_SIZE = 100
REDO_ENABLED = true

# ==========================================
# OSC CONFIGURATION (Optional)
# ==========================================

[OSC]
# Open Sound Control bridge for hardware control
ENABLED = false
HOST = localhost
PORT = 9000
DEVICE_TRACK_COUNT = 8
DEVICE_SEND_COUNT = 4
DEVICE_RECEIVE_COUNT = 4
DEVICE_FX_COUNT = 8
DEVICE_FX_PARAM_COUNT = 16
DEVICE_MARKER_COUNT = 0
DEVICE_REGION_COUNT = 0

# ==========================================
# MIDI CONFIGURATION (Optional)
# ==========================================

[MIDI]
# MIDI controller integration and CC mapping
ENABLED = false
DEFAULT_PORT = 1
MAP_CC_VOLUME = 7
MAP_CC_PAN = 10
MAP_CC_MOD = 1
MAP_CC_EXPRESSION = 11
NOTE_MIN = 0
NOTE_MAX = 127

# ==========================================
# TRANSPORT CONFIGURATION
# ==========================================

[Transport]
# Timeline, playback, and automation settings
SHOW_TIMER = true
TIMER_COLOR = #00FFFF
TIMER_FORMAT = HH:MM:SS
ZOOM_MIN = 0.5
ZOOM_MAX = 3.0
ZOOM_STEP = 0.1
AUTOMATION_OVERLAY = true
AUTOMATION_DRAW_MODE = RAMP
CLICK_ENABLED = true
CLICK_VOLUME = 0.5
METRONOME_ENABLED = true
METRONOME_ACCENT = 120
METRONOME_BEAT = 60

# Automation Draw Modes
# RAMP = Linear ramp between points
# SQUARE = Immediate step changes
# TRIANGLE = Triangular interpolation
# SINE = Smooth sinusoidal curve
# EXPONENTIAL = Exponential curve

# Timer Formats
# HH:MM:SS = Hours:Minutes:Seconds (00:05:30)
# MM:SS = Minutes:Seconds (05:30)
# Measures = Measures.Beats.Ticks (001.002.000)

# ==========================================
# AUDIO CONFIGURATION
# ==========================================

[Audio]
# Audio engine and DSP settings
SAMPLE_RATE = 44100
BUFFER_SIZE = 256
MAX_CHANNELS = 64
MAX_TRACKS = 256
HEADROOM_DB = 6.0
NOMINAL_LEVEL_DBU = 0
METERING_RMS_WINDOW_MS = 300
METERING_PEAK_HOLD_MS = 3000

# Sample rates: 44100, 48000, 96000, 192000
# Buffer sizes: 64, 128, 256, 512, 1024, 2048, 4096, 8192

# ==========================================
# BRANDING CONFIGURATION
# ==========================================

[Branding]
# UI text, logos, and branding elements
LOGO_TEXT = 🎧 CoreLogic Studio
LOGO_COLOR = #ffaa00
VERSION_LABEL = v7.0
FOOTER_TEXT = CoreLogic Studio • Professional Audio Workstation
WEBSITE_URL = https://example.com
DOCUMENTATION_URL = https://docs.example.com
SUPPORT_EMAIL = support@example.com

# ==========================================
# DEBUG CONFIGURATION
# ==========================================

[Debug]
# Development and debugging options
ENABLED = (auto-detected: true in development, false in production)
LOG_LEVEL = warn
SHOW_PERFORMANCE_MONITOR = false
SHOW_LAYOUT_GUIDES = false
ENABLE_REDUX_DEVTOOLS = true
MOCK_AUDIO_ENGINE = false

# Log Levels (in order of severity)
# debug = Verbose debug information
# info = General informational messages
# warn = Warning messages (default)
# error = Only error messages

# ==========================================
# ENVIRONMENT VARIABLE MAPPING
# ==========================================

# Use these environment variable names to override defaults
# Prefix all with: REACT_APP_

[EnvironmentVariables]
# System
REACT_APP_APP_NAME = CoreLogic Studio
REACT_APP_VERSION = 7.0
REACT_APP_BUILD = 0
REACT_APP_DEFAULT_THEME = Graphite
REACT_APP_WINDOW_WIDTH = 1600
REACT_APP_WINDOW_HEIGHT = 900
REACT_APP_SPLASH_ENABLED = true
REACT_APP_SPLASH_DURATION = 1000
REACT_APP_FPS_LIMIT = 60

# Display
REACT_APP_CHANNEL_COUNT = 10
REACT_APP_CHANNEL_WIDTH = 120
REACT_APP_VU_REFRESH = 150
REACT_APP_SHOW_WATERMARK = true
REACT_APP_SHOW_GRID = true

# Transport
REACT_APP_ZOOM_MIN = 0.5
REACT_APP_ZOOM_MAX = 3.0
REACT_APP_TIMER_FORMAT = HH:MM:SS
REACT_APP_AUTOMATION_OVERLAY = true

# Audio
REACT_APP_SAMPLE_RATE = 44100
REACT_APP_BUFFER_SIZE = 256
REACT_APP_MAX_TRACKS = 256

# ==========================================
# VALIDATION RULES
# ==========================================

[Validation]
# Configuration validation constraints

WINDOW_WIDTH >= MIN_WINDOW_WIDTH
WINDOW_HEIGHT >= MIN_WINDOW_HEIGHT
ZOOM_MIN < ZOOM_MAX
SAMPLE_RATE IN [8000, 44100, 48000, 96000, 192000]
BUFFER_SIZE IN [64, 128, 256, 512, 1024, 2048, 4096, 8192]
DEFAULT_THEME IN [Dark, Light, Graphite, Neon]
TIMER_FORMAT IN [HH:MM:SS, MM:SS, Measures]
LOG_LEVEL IN [debug, info, warn, error]
DEVICE_EQ_MODE IN [INSERT, MASTER, PARAMETRIC]
DEVICE_FX_FOLLOWS IN [LAST_TOUCHED, FIRST, CUSTOM]
CHANNEL_COUNT >= 1
CHANNEL_COUNT <= 128
HEADROOM_DB >= 0
HEADROOM_DB <= 20

# ==========================================
# CONFIGURATION PROFILES
# ==========================================

[Profile.Development]
# Development/debugging configuration
DEBUG_ENABLED = true
LOG_LEVEL = debug
SHOW_PERFORMANCE_MONITOR = true
SHOW_LAYOUT_GUIDES = false
WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 800
SPLASH_ENABLED = false

[Profile.Production]
# Production configuration
DEBUG_ENABLED = false
LOG_LEVEL = error
SHOW_PERFORMANCE_MONITOR = false
AUTO_SAVE_ENABLED = true
AUTO_SAVE_INTERVAL_MS = 30000
WINDOW_WIDTH = 1600
WINDOW_HEIGHT = 900

[Profile.LargeSession]
# Configuration for large sessions (16+ tracks)
CHANNEL_COUNT = 16
CHANNEL_WIDTH = 100
MAX_TRACKS = 512
UNDO_STACK_SIZE = 200
AUTO_SAVE_INTERVAL_MS = 30000

[Profile.HighResolution]
# Configuration for high-resolution displays
WINDOW_WIDTH = 1920
WINDOW_HEIGHT = 1200
CHANNEL_WIDTH = 150
GRID_SIZE = 16

[Profile.LowLatency]
# Configuration for low-latency audio
SAMPLE_RATE = 48000
BUFFER_SIZE = 64
METERING_RMS_WINDOW_MS = 150
METERING_PEAK_HOLD_MS = 1000

# ==========================================
# NOTES
# ==========================================

# Configuration Priority (Highest to Lowest):
# 1. Environment Variables (process.env.REACT_APP_*)
# 2. .env file (local override)
# 3. Default Values (in appConfig.ts)

# To use environment variables:
# - Set in .env file: REACT_APP_WINDOW_WIDTH=1920
# - Or in system environment before running: npm run dev
# - Restart dev server after changes

# Configuration is loaded once at application startup
# Changes to .env require restart to take effect

# For production builds, set variables before build:
# REACT_APP_VERSION=7.0 npm run build

# Development vs Production:
# - Development: NODE_ENV=development (auto-detect)
# - Production: NODE_ENV=production (auto-detect)
# - Debug mode auto-enabled in development

# Theme color codes are in hexadecimal format (#RRGGBB)
# Timer color must be hex (e.g., #00FFFF for cyan)
# All durations are in milliseconds

# For OSC and MIDI (currently disabled for future use):
# - Set REACT_APP_OSC_ENABLED=true to enable
# - Set REACT_APP_MIDI_ENABLED=true to enable
# - Configure ports and CC mappings accordingly

# ==========================================
# END OF CONFIGURATION REFERENCE
# ==========================================

# For actual configuration:
# 1. See .env.example for template
# 2. Create .env file from template
# 3. Edit .env with your settings
# 4. See CONFIGURATION_GUIDE.md for detailed help
