"""
Audio I/O Device Management with Configuration

Handles audio device configuration, query, and safe device switching.
Supports both default system audio and external USB interfaces (e.g., Scarlett 2i4, Line 6 Helix).

Usage:
    from daw_core.audio_io import AudioDeviceManager, AudioConfiguration

    manager = AudioDeviceManager()
    devices = manager.query_devices()

    # Configure device with sample rate and buffer size
    config = AudioConfiguration(sample_rate=48000, block_size=256, bit_depth=24)
    manager.configure_device('Scarlett 2i4 USB', config)
"""

import sounddevice as sd
from typing import List, Dict, Optional
import logging
import time

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

logger = logging.getLogger(__name__)


class AudioConfiguration:
    """Audio device configuration with standard DAW settings."""

    # Standard sample rates (Hz)
    SAMPLE_RATES = {
        'cd': 44100,
        'professional': 48000,
        'hi_res': 96000,
        'ultra_hi_res': 192000,
    }

    # Buffer sizes (samples) - lower = more responsive, higher = more stable
    BUFFER_SIZES = {
        'low_latency': 64,
        'responsive': 128,
        'balanced': 256,
        'stable': 512,
        'very_stable': 1024,
    }

    # Bit depths (bit resolution for audio samples)
    BIT_DEPTHS = {
        'cd_quality': 16,
        'standard': 24,
        'professional': 32,
    }

    def __init__(self, sample_rate: int = 48000, block_size: int = 256,
                 channels_in: int = 2, channels_out: int = 2, bit_depth: int = 24):
        """
        Initialize audio configuration.

        Args:
            sample_rate: Sample rate in Hz (44100, 48000, 96000, 192000)
            block_size: Buffer size in samples (64, 128, 256, 512, 1024)
            channels_in: Number of input channels
            channels_out: Number of output channels
            bit_depth: Bit depth (16, 24, 32) - higher = better quality, more CPU
        """
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.channels_in = channels_in
        self.channels_out = channels_out
        self.bit_depth = bit_depth

    def __repr__(self):
        return (f"AudioConfiguration(sr={self.sample_rate}Hz, "
                f"block={self.block_size}, "
                f"bit={self.bit_depth}, "
                f"in:{self.channels_in} out:{self.channels_out})")

    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            'sample_rate': self.sample_rate,
            'block_size': self.block_size,
            'bit_depth': self.bit_depth,
            'channels_in': self.channels_in,
            'channels_out': self.channels_out,
        }


class AudioDevice:
    """Represents an audio device with metadata."""

    def __init__(self, index: int, name: str, channels_in: int, channels_out: int,
                 sample_rate: float, hostapi: str, is_default: bool = False, is_safe: bool = True):
        self.index = index
        self.name = name
        self.channels_in = channels_in
        self.channels_out = channels_out
        self.sample_rate = sample_rate
        self.hostapi = hostapi
        self.is_default = is_default
        self.is_safe = is_safe  # OS-managed audio system

    def __repr__(self):
        default_marker = " [DEFAULT]" if self.is_default else ""
        safe_marker = " ✓" if self.is_safe else " ⚠️"
        return (f"AudioDevice('{self.name}'{default_marker}{safe_marker}, "
                f"in:{self.channels_in} out:{self.channels_out}, "
                f"{self.hostapi}, sr:{int(self.sample_rate)}Hz)")

    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            'index': self.index,
            'name': self.name,
            'channels_in': self.channels_in,
            'channels_out': self.channels_out,
            'sample_rate': self.sample_rate,
            'hostapi': self.hostapi,
            'is_default': self.is_default,
            'is_safe': self.is_safe,
        }


class AudioDeviceManager:
    """
    Manages audio device enumeration, selection, and configuration.

    Safe operations:
    - Query only OS-managed audio devices (CoreAudio, WASAPI, ASIO, ALSA, PulseAudio)
    - Get default device info
    - Set device by name (with validation)
    - Configure device with sample rate and buffer size
    - List USB audio interfaces

    Host APIs considered "safe" (OS-managed):
    - Core Audio (macOS)
    - WASAPI (Windows)
    - ASIO (Windows professional)
    - ALSA (Linux)
    - PulseAudio (Linux)
    """

    # Safe host APIs (OS-managed, stable, recommended)
    SAFE_HOSTAPIS = {'core audio', 'wasapi', 'asio', 'alsa', 'pulse'}

    def __init__(self, default_sample_rate: float = 44100, safe_only: bool = True):
        """
        Initialize audio device manager.

        Args:
            default_sample_rate: Default sample rate if device doesn't specify (Hz)
            safe_only: If True, only list OS-managed audio devices (recommended)
        """
        self.default_sample_rate = default_sample_rate
        self.safe_only = safe_only
        self.current_device = None
        self.current_config = AudioConfiguration()

    def query_devices(self) -> List[AudioDevice]:
        """
        Query available audio devices safely.

        By default, only returns OS-managed audio devices (CoreAudio, WASAPI, ASIO, ALSA, PulseAudio).
        These are the most stable and recommended for professional audio work.

        Returns:
            List of AudioDevice objects representing available devices
        """
        try:
            devices_raw = sd.query_devices()
            devices = []
            default_in, default_out = sd.default.device

            for i, dev_info in enumerate(devices_raw):
                name = dev_info['name']
                channels_in = dev_info['max_input_channels']
                channels_out = dev_info['max_output_channels']
                sr = dev_info.get('default_samplerate', self.default_sample_rate)

                # Get host API name
                try:
                    hostapi_info = sd.query_hostapis(dev_info['hostapi'])
                    hostapi = hostapi_info['name']
                except Exception as e:
                    logger.warning(f"Could not get hostapi for device {i}: {e}")
                    hostapi = "Unknown"

                # Check if device is "safe" (OS-managed)
                is_safe = hostapi.lower() in self.SAFE_HOSTAPIS

                # Skip unsafe devices if safe_only is True
                if self.safe_only and not is_safe:
                    continue

                is_default = (i == default_in or i == default_out)

                device = AudioDevice(
                    index=i,
                    name=name,
                    channels_in=channels_in,
                    channels_out=channels_out,
                    sample_rate=sr,
                    hostapi=hostapi,
                    is_default=is_default,
                    is_safe=is_safe
                )
                devices.append(device)

            count_str = f"{len(devices)} safe" if self.safe_only else f"{len(devices)}"
            logger.info(f"Queried {count_str} audio devices")
            return devices

        except Exception as e:
            logger.error(f"Error querying audio devices: {e}")
            return []

    def get_device_by_name(self, name: str) -> Optional[AudioDevice]:
        """
        Find audio device by name (case-insensitive partial match).

        Args:
            name: Device name or partial name to search for

        Returns:
            AudioDevice if found, None otherwise
        """
        devices = self.query_devices()
        name_lower = name.lower()

        # First try exact match
        for device in devices:
            if device.name.lower() == name_lower:
                logger.info(f"Found device (exact match): {device}")
                return device

        # Then try partial match
        for device in devices:
            if name_lower in device.name.lower():
                logger.info(f"Found device (partial match): {device}")
                return device

        logger.warning(f"No safe audio device found matching: {name}")
        return None

    def set_device(self, device_name: str) -> bool:
        """
        Set audio device by name (safe, with validation).

        Args:
            device_name: Name of device to use

        Returns:
            True if device was set successfully, False otherwise
        """
        device = self.get_device_by_name(device_name)
        if device is None:
            logger.error(f"Cannot set unknown device: {device_name}")
            return False

        try:
            # Set sounddevice default device
            sd.default.device = device.index
            self.current_device = device

            logger.info(f"Audio device set to: {device}")
            logger.info(f"Input channels: {device.channels_in}, "
                       f"Output channels: {device.channels_out}, "
                       f"Sample rate: {device.sample_rate}Hz")

            return True

        except Exception as e:
            logger.error(f"Error setting audio device '{device_name}': {e}")
            return False

    def configure_device(self, device_name: str, config: AudioConfiguration) -> bool:
        """
        Configure audio device with specific settings (sample rate, buffer size).

        Args:
            device_name: Name of device to configure
            config: AudioConfiguration object with desired settings

        Returns:
            True if configuration successful, False otherwise

        Example:
            >>> config = AudioConfiguration(sample_rate=48000, block_size=256)
            >>> manager.configure_device('Scarlett 2i4 USB', config)
        """
        # First set the device
        if not self.set_device(device_name):
            return False

        try:
            # Configure sounddevice settings
            sd.default.samplerate = config.sample_rate
            sd.default.blocksize = config.block_size
            sd.default.channels = (config.channels_in, config.channels_out)

            self.current_config = config

            logger.info(f"Audio configuration applied: {config}")
            logger.info(f"Sample rate: {config.sample_rate}Hz, "
                       f"Block size: {config.block_size} samples, "
                       f"Channels: {config.channels_in}in/{config.channels_out}out")

            return True

        except Exception as e:
            logger.error(f"Error configuring audio device: {e}")
            return False

    def get_recommended_config(self, device_name: str) -> AudioConfiguration:
        """
        Get recommended configuration for a device based on its capabilities.

        Args:
            device_name: Name of device to analyze

        Returns:
            AudioConfiguration with recommended settings
        """
        device = self.get_device_by_name(device_name)
        if not device:
            logger.warning(f"Device not found: {device_name}, using defaults")
            return AudioConfiguration()

        # Determine optimal sample rate
        if device.sample_rate >= 96000:
            sample_rate = 96000  # Pro interface, use high sample rate
        else:
            sample_rate = 48000  # Standard professional sample rate

        # Determine optimal buffer size (balance between latency and stability)
        block_size = 256  # Good for most cases

        # Use device's native channel count
        channels_in = min(device.channels_in, 2)  # Cap at stereo input
        channels_out = min(device.channels_out, 2)  # Cap at stereo output

        config = AudioConfiguration(
            sample_rate=int(sample_rate),
            block_size=block_size,
            channels_in=channels_in,
            channels_out=channels_out
        )

        logger.info(f"Recommended config for '{device.name}': {config}")
        return config

    def get_default_device(self) -> Optional[AudioDevice]:
        """Get current default audio device."""
        devices = self.query_devices()
        default_index = sd.default.device[1]  # Output device

        for device in devices:
            if device.index == default_index:
                self.current_device = device
                return device

        return None

    def get_usb_devices(self) -> List[AudioDevice]:
        """Get list of USB audio devices (safe, OS-managed only)."""
        all_devices = self.query_devices()
        usb_keywords = ['usb', 'scarlett', 'focusrite', 'interface', 'usb audio', 'presonus', 'helix']

        usb_devices = []
        for device in all_devices:
            device_name_lower = device.name.lower()
            if any(keyword in device_name_lower for keyword in usb_keywords):
                usb_devices.append(device)

        return usb_devices

    def get_device_info(self, device_index: int) -> Optional[Dict]:
        """Get detailed information about a specific device."""
        try:
            info = sd.query_devices(device_index)
            return dict(info)
        except Exception as e:
            logger.error(f"Error getting device info for index {device_index}: {e}")
            return None

    def get_device_capabilities(self, device_name: str) -> Optional[Dict]:
        """Get full capabilities of a device (channels, sample rates, latency)."""
        device = self.get_device_by_name(device_name)
        if device is None:
            return None

        return {
            'name': device.name,
            'index': device.index,
            'max_input_channels': device.channels_in,
            'max_output_channels': device.channels_out,
            'default_sample_rate': device.sample_rate,
            'hostapi': device.hostapi,
            'raw_info': self.get_device_info(device.index)
        }


class AudioDeviceSettingsMenu:
    """
    Interactive audio device settings menu for adjusting sample rate, bit depth, and buffer size.

    Provides a CLI interface for runtime configuration changes without restarting audio engine.
    """

    def __init__(self, manager: AudioDeviceManager):
        self.manager = manager
        self.running = False

    def display_current_settings(self):
        """Display current audio configuration."""
        device = self.manager.current_device
        config = self.manager.current_config

        print("\n" + "="*60)
        print("CURRENT AUDIO SETTINGS")
        print("="*60)
        if device:
            print(f"Device: {device.name}")
            print(f"Host API: {device.hostapi}")
        print(f"Sample Rate: {config.sample_rate} Hz")
        print(f"Bit Depth: {config.bit_depth}-bit")
        print(f"Buffer Size: {config.block_size} samples")
        print(f"Channels: {config.channels_in} in / {config.channels_out} out")
        print("="*60)

    def show_sample_rate_options(self):
        """Display available sample rates."""
        print("\nAvailable Sample Rates:")
        for i, (name, rate) in enumerate(AudioConfiguration.SAMPLE_RATES.items(), 1):
            current = "✓" if rate == self.manager.current_config.sample_rate else " "
            print(f"  [{current}] {i}. {name:20} {rate} Hz")

    def show_bit_depth_options(self):
        """Display available bit depths."""
        print("\nAvailable Bit Depths:")
        for i, (name, bits) in enumerate(AudioConfiguration.BIT_DEPTHS.items(), 1):
            current = "✓" if bits == self.manager.current_config.bit_depth else " "
            print(f"  [{current}] {i}. {name:20} {bits}-bit")

    def show_buffer_size_options(self):
        """Display available buffer sizes."""
        print("\nAvailable Buffer Sizes:")
        for i, (name, size) in enumerate(AudioConfiguration.BUFFER_SIZES.items(), 1):
            current = "✓" if size == self.manager.current_config.block_size else " "
            latency_ms = (size * 1000) / self.manager.current_config.sample_rate
            print(f"  [{current}] {i}. {name:20} {size:4} samples (~{latency_ms:.1f}ms)")

    def adjust_sample_rate(self):
        """Interactive sample rate adjustment."""
        self.show_sample_rate_options()
        try:
            choice = int(input("\nSelect sample rate (1-4): "))
            rates = list(AudioConfiguration.SAMPLE_RATES.values())
            if 1 <= choice <= len(rates):
                self.manager.current_config.sample_rate = rates[choice - 1]
                sd.default.samplerate = rates[choice - 1]
                print(f"✓ Sample rate changed to {rates[choice - 1]} Hz")
                return True
        except (ValueError, IndexError):
            pass
        print("✗ Invalid selection")
        return False

    def adjust_bit_depth(self):
        """Interactive bit depth adjustment."""
        self.show_bit_depth_options()
        try:
            choice = int(input("\nSelect bit depth (1-3): "))
            depths = list(AudioConfiguration.BIT_DEPTHS.values())
            if 1 <= choice <= len(depths):
                self.manager.current_config.bit_depth = depths[choice - 1]
                print(f"✓ Bit depth changed to {depths[choice - 1]}-bit")
                return True
        except (ValueError, IndexError):
            pass
        print("✗ Invalid selection")
        return False

    def adjust_buffer_size(self):
        """Interactive buffer size adjustment."""
        self.show_buffer_size_options()
        try:
            choice = int(input("\nSelect buffer size (1-5): "))
            sizes = list(AudioConfiguration.BUFFER_SIZES.values())
            if 1 <= choice <= len(sizes):
                self.manager.current_config.block_size = sizes[choice - 1]
                sd.default.blocksize = sizes[choice - 1]
                print(f"✓ Buffer size changed to {sizes[choice - 1]} samples")
                return True
        except (ValueError, IndexError):
            pass
        print("✗ Invalid selection")
        return False

    def show_menu(self):
        """Display interactive settings menu."""
        menu_options = {
            '1': ('Display current settings', self.display_current_settings),
            '2': ('Adjust sample rate', self.adjust_sample_rate),
            '3': ('Adjust bit depth', self.adjust_bit_depth),
            '4': ('Adjust buffer size', self.adjust_buffer_size),
            '5': ('Exit settings', lambda: False),
        }

        self.running = True
        while self.running:
            print("\n" + "="*60)
            print("AUDIO DEVICE SETTINGS MENU")
            print("="*60)
            for key, (desc, _) in menu_options.items():
                print(f"  {key}. {desc}")
            print("="*60)

            choice = input("Select option (1-5): ").strip()

            if choice in menu_options:
                desc, func = menu_options[choice]
                if choice == '5':
                    self.running = False
                    print("Exiting settings menu...")
                else:
                    func()
            else:
                print("✗ Invalid option")


class DSPPerformanceTimer:
    """
    Context manager for measuring DSP code execution time and buffer processing time.

    Helps identify performance bottlenecks in audio processing chains.

    Usage:
        >>> with DSPPerformanceTimer("EQ Processing") as timer:
        ...     # DSP code here
        ...     pass
        >>> timer.report()  # Print performance metrics
    """

    def __init__(self, name: str = "DSP Code", sample_rate: int = 48000,
                 block_size: int = 256, channels: int = 2):
        self.name = name
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.channels = channels
        self.start_time = None
        self.elapsed_ms = 0

    def __enter__(self):
        """Start performance timer."""
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Stop performance timer and calculate metrics."""
        if self.start_time:
            self.elapsed_ms = (time.perf_counter() - self.start_time) * 1000
        return False

    def get_buffer_duration(self) -> float:
        """Get duration of audio buffer in milliseconds."""
        return (self.block_size * 1000) / self.sample_rate

    def get_cpu_load(self) -> float:
        """Calculate CPU load percentage for this processing."""
        buffer_duration = self.get_buffer_duration()
        if buffer_duration > 0:
            return (self.elapsed_ms / buffer_duration) * 100
        return 0.0

    def report(self, verbose: bool = False) -> Dict:
        """
        Generate performance report.

        Args:
            verbose: If True, print detailed report

        Returns:
            Dictionary with performance metrics
        """
        buffer_duration = self.get_buffer_duration()
        cpu_load = self.get_cpu_load()

        report = {
            'name': self.name,
            'elapsed_ms': self.elapsed_ms,
            'buffer_duration_ms': buffer_duration,
            'cpu_load_percent': cpu_load,
            'sample_rate': self.sample_rate,
            'block_size': self.block_size,
            'channels': self.channels,
        }

        if verbose:
            print(f"\n{'='*60}")
            print(f"DSP PERFORMANCE: {self.name}")
            print(f"{'='*60}")
            print(f"Processing time: {self.elapsed_ms:.3f} ms per buffer")
            print(f"Buffer size: {self.block_size} samples ({buffer_duration:.2f}ms)")
            print(f"Sample rate: {self.sample_rate} Hz")
            print(f"Channels: {self.channels}")
            print(f"CPU load: {cpu_load:.1f}%")
            if cpu_load > 50:
                print(f"⚠️  WARNING: High CPU load detected!")
            print(f"{'='*60}\n")

        return report


# Module-level convenience functions
_default_manager: Optional[AudioDeviceManager] = None


def get_manager() -> AudioDeviceManager:
    """Get or create default AudioDeviceManager instance."""
    global _default_manager
    if _default_manager is None:
        _default_manager = AudioDeviceManager()
    return _default_manager


def list_devices() -> List[AudioDevice]:
    """List all available audio devices."""
    return get_manager().query_devices()


def set_device(device_name: str) -> bool:
    """Set audio device by name."""
    return get_manager().set_device(device_name)


def configure_device(device_name: str, config: AudioConfiguration) -> bool:
    """Configure audio device with sample rate and buffer size."""
    return get_manager().configure_device(device_name, config)


def get_usb_devices() -> List[AudioDevice]:
    """Get all USB audio devices."""
    return get_manager().get_usb_devices()


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    manager = AudioDeviceManager(safe_only=True)

    print("\n=== Safe (OS-Managed) Audio Devices ===")
    devices = manager.query_devices()
    for device in devices:
        print(f"• {device.name} ({device.hostapi})")
        print(f"  In: {device.channels_in}, Out: {device.channels_out}, "
              f"Sample Rate: {int(device.sample_rate)}Hz")

    print("\n=== USB Audio Interfaces ===")
    usb_devs = manager.get_usb_devices()
    for device in usb_devs:
        print(device)

    print("\n=== Attempting Device Setup ===")

    # Try Scarlett first, fallback to Line 6 Helix
    device_options = ['Scarlett 2i4 USB', 'Line 6 Helix', 'Focusrite']
    configured = False

    for device_name in device_options:
        print(f"\nTrying: {device_name}")
        device = manager.get_device_by_name(device_name)

        if device:
            # Get recommended config for this device
            config = manager.get_recommended_config(device_name)

            # Apply configuration
            if manager.configure_device(device_name, config):
                print(f"✓ Successfully configured {device_name}")
                print(f"  Settings: {config}")
                configured = True
                break

    if not configured:
        print("✗ No compatible USB device found")
        default = manager.get_default_device()
        if default:
            print(f"Using system default: {default.name}")

    # === Example: Audio Settings Menu ===
    print("\n=== Audio Device Settings Menu ===")
    settings_menu = AudioDeviceSettingsMenu(manager)

    # Display menu (uncomment to use interactively)
    # settings_menu.show_menu()

    # Or programmatically adjust settings
    print("Programmatic settings adjustment:")
    manager.current_config.sample_rate = 48000
    manager.current_config.bit_depth = 24
    manager.current_config.block_size = 256
    print(f"  Sample Rate: {manager.current_config.sample_rate} Hz")
    print(f"  Bit Depth: {manager.current_config.bit_depth}-bit")
    print(f"  Buffer Size: {manager.current_config.block_size} samples")

    # === Example: DSP Performance Timing ===
    print("\n=== DSP Performance Timing Example ===")

    # Simulate DSP processing
    with DSPPerformanceTimer("Example EQ Processing", sample_rate=48000,
                            block_size=256, channels=2) as timer:
        # Simulate some DSP work
        if HAS_NUMPY:
            audio_buffer = np.random.randn(256, 2).astype(np.float32)

        # Simulate processing time (in real scenario, this would be DSP code)
        time.sleep(0.0005)  # 0.5ms simulated processing

        if HAS_NUMPY:
            processed_audio = audio_buffer * 0.8  # Simple gain

    # Print performance report
    timer.report(verbose=True)

    # Multiple DSP effects timing
    print("\n=== Multi-Effect DSP Chain ===")
    effects_times = {}

    for effect_name in ["Compressor", "EQ", "Reverb", "Limiter"]:
        with DSPPerformanceTimer(effect_name, sample_rate=48000,
                               block_size=256, channels=2) as timer:
            # Simulate different processing loads
            if HAS_NUMPY:
                time.sleep(np.random.uniform(0.0002, 0.001))
            else:
                time.sleep(0.0005)

        effects_times[effect_name] = timer.elapsed_ms
        print(f"{effect_name:15} {timer.elapsed_ms:.3f} ms ({timer.get_cpu_load():.1f}% CPU)")

    total_time = sum(effects_times.values())
    print(f"\nTotal DSP time: {total_time:.3f} ms per buffer")
    print(f"Total CPU load: {(total_time / 5.33):.1f}%")  # 5.33ms = 256 samples @ 48kHz

