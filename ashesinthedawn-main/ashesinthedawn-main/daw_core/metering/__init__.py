"""
Phase 2.8: Metering & Analysis Tools

Comprehensive metering suite for real-time audio analysis:
- LevelMeter: Peak and RMS level detection with history
- SpectrumAnalyzer: FFT-based frequency analysis with windowing
- VUMeter: Logarithmic metering simulation
- Correlometer: Stereo correlation measurement
"""

from enum import Enum
from typing import Dict, List, Tuple, Optional
import numpy as np


class FFTWindowType(Enum):
    """FFT windowing functions for spectral analysis."""
    HANN = "hann"
    HAMMING = "hamming"
    BLACKMAN = "blackman"
    RECTANGULAR = "rectangular"


class MeterMode(Enum):
    """Metering modes for different use cases."""
    PEAK = "peak"          # Peak-only metering
    RMS = "rms"            # RMS-only metering
    PEAK_RMS = "peak_rms"  # Combined peak + RMS
    VU = "vu"              # Logarithmic VU metering


class LevelMeter:
    """
    Real-time level detection with peak and RMS tracking.
    
    Features:
    - Peak detection with hold time
    - RMS (Root Mean Square) energy calculation
    - History buffer for visualization
    - Decay tracking for sustained metering
    - Clipping detection
    
    Usage:
        meter = LevelMeter(sample_rate=44100)
        meter.process(audio_signal)
        peak_db = meter.get_peak_db()
        rms_db = meter.get_rms_db()
    """
    
    def __init__(self, sample_rate: int = 44100, history_size: int = 1024, 
                 mode: MeterMode = MeterMode.PEAK_RMS):
        """
        Initialize level meter.
        
        Args:
            sample_rate: Sample rate in Hz (default 44100)
            history_size: Number of samples to keep in history buffer (default 1024)
            mode: Metering mode (peak, rms, peak_rms, vu)
        """
        self.sample_rate = sample_rate
        self.history_size = history_size
        self.mode = mode
        
        # Level tracking
        self.peak = 0.0
        self.rms = 0.0
        self.peak_db = -np.inf
        self.rms_db = -np.inf
        
        # History buffers for visualization
        self.peak_history = np.zeros(history_size, dtype=np.float32)
        self.rms_history = np.zeros(history_size, dtype=np.float32)
        self.history_index = 0
        
        # Hold time tracking (in samples)
        self.peak_hold_samples = int(sample_rate * 0.5)  # 500ms hold
        self.peak_hold_counter = 0
        self.held_peak = 0.0
        self.held_peak_db = -np.inf
        
        # Clipping detection
        self.clipped = False
        self.clip_count = 0
        
        # Decay tracking
        self.decay_rate = 0.995  # Per-sample decay
        self.sustained_peak = 0.0
        self.sustained_rms = 0.0
    
    def process(self, signal: np.ndarray) -> None:
        """
        Process audio signal and update meters.
        
        Args:
            signal: Audio signal (mono or stereo)
        """
        # Ensure float32
        signal = signal.astype(np.float32) if signal.dtype != np.float32 else signal
        
        # Handle stereo by using max of L/R
        if signal.ndim == 2:
            signal = np.max(np.abs(signal), axis=1)
        else:
            signal = np.abs(signal)
        
        # Peak detection
        current_peak = np.max(signal)
        if current_peak > self.peak:
            self.peak = current_peak
            self.peak_hold_counter = 0
            self.held_peak = current_peak
        
        # Update hold counter
        self.peak_hold_counter += len(signal)
        if self.peak_hold_counter >= self.peak_hold_samples:
            # Hold time expired, decay
            decay_factor = 0.95
            self.peak *= decay_factor
            self.peak_hold_counter = 0
        
        # RMS calculation (energy average)
        rms_energy = np.sqrt(np.mean(signal ** 2))
        self.rms = rms_energy
        
        # Sustained levels (with decay)
        self.sustained_peak = max(current_peak, self.sustained_peak * self.decay_rate)
        self.sustained_rms = max(rms_energy, self.sustained_rms * self.decay_rate)
        
        # Convert to dB
        eps = 1e-8
        self.peak_db = 20 * np.log10(np.clip(self.peak, eps, 1.0))
        self.rms_db = 20 * np.log10(np.clip(self.rms, eps, 1.0))
        self.held_peak_db = 20 * np.log10(np.clip(self.held_peak, eps, 1.0))
        
        # Clipping detection
        if current_peak > 1.0:
            self.clipped = True
            self.clip_count += np.sum(signal > 1.0)
        
        # Update history (store one value per call)
        self.peak_history[self.history_index] = self.peak_db
        self.rms_history[self.history_index] = self.rms_db
        self.history_index = (self.history_index + 1) % self.history_size
    
    def get_peak_db(self) -> float:
        """Get current peak level in dB."""
        return self.peak_db
    
    def get_rms_db(self) -> float:
        """Get current RMS level in dB."""
        return self.rms_db
    
    def get_held_peak_db(self) -> float:
        """Get held peak level in dB (with hold time)."""
        return self.held_peak_db
    
    def get_sustained_peak_db(self) -> float:
        """Get sustained peak with decay."""
        return 20 * np.log10(np.clip(self.sustained_peak, 1e-8, 1.0))
    
    def get_sustained_rms_db(self) -> float:
        """Get sustained RMS with decay."""
        return 20 * np.log10(np.clip(self.sustained_rms, 1e-8, 1.0))
    
    def is_clipped(self) -> bool:
        """Check if signal has clipped."""
        return self.clipped
    
    def get_clip_count(self) -> int:
        """Get number of clipped samples since last reset."""
        return self.clip_count
    
    def get_peak_history(self) -> np.ndarray:
        """Get peak level history for visualization."""
        return self.peak_history.copy()
    
    def get_rms_history(self) -> np.ndarray:
        """Get RMS level history for visualization."""
        return self.rms_history.copy()
    
    def reset_clips(self) -> None:
        """Reset clipping indicator."""
        self.clipped = False
        self.clip_count = 0
    
    def reset(self) -> None:
        """Reset all levels and history."""
        self.peak = 0.0
        self.rms = 0.0
        self.peak_db = -np.inf
        self.rms_db = -np.inf
        self.peak_history.fill(0.0)
        self.rms_history.fill(0.0)
        self.held_peak = 0.0
        self.held_peak_db = -np.inf
        self.clipped = False
        self.clip_count = 0
        self.sustained_peak = 0.0
        self.sustained_rms = 0.0
    
    def to_dict(self) -> Dict:
        """Serialize meter state to dictionary."""
        return {
            "type": "LevelMeter",
            "sample_rate": self.sample_rate,
            "history_size": self.history_size,
            "mode": self.mode.value,
            "peak": float(self.peak),
            "rms": float(self.rms),
            "peak_db": float(self.peak_db),
            "rms_db": float(self.rms_db),
            "sustained_peak": float(self.sustained_peak),
            "sustained_rms": float(self.sustained_rms),
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "LevelMeter":
        """Restore meter state from dictionary."""
        meter = cls(
            sample_rate=data.get("sample_rate", 44100),
            history_size=data.get("history_size", 1024),
            mode=MeterMode(data.get("mode", "peak_rms"))
        )
        meter.peak = data.get("peak", 0.0)
        meter.rms = data.get("rms", 0.0)
        meter.peak_db = data.get("peak_db", -np.inf)
        meter.rms_db = data.get("rms_db", -np.inf)
        meter.sustained_peak = data.get("sustained_peak", 0.0)
        meter.sustained_rms = data.get("sustained_rms", 0.0)
        return meter


class SpectrumAnalyzer:
    """
    FFT-based frequency spectrum analysis.
    
    Features:
    - Real-time FFT computation
    - Multiple windowing functions (Hann, Hamming, Blackman, Rectangular)
    - Frequency bin mapping to Hz
    - Magnitude spectrum in dB
    - Spectral smoothing for visualization
    
    Usage:
        analyzer = SpectrumAnalyzer(fft_size=2048, sample_rate=44100)
        analyzer.process(audio_signal)
        freqs = analyzer.get_frequencies()
        magnitudes = analyzer.get_magnitudes_db()
    """
    
    def __init__(self, fft_size: int = 2048, sample_rate: int = 44100,
                 window: FFTWindowType = FFTWindowType.HANN):
        """
        Initialize spectrum analyzer.
        
        Args:
            fft_size: FFT size in samples (power of 2, default 2048)
            sample_rate: Sample rate in Hz (default 44100)
            window: Windowing function (default Hann)
        """
        self.fft_size = fft_size
        self.sample_rate = sample_rate
        self.window_type = window
        
        # Create window function
        if window == FFTWindowType.HANN:
            self.window = np.hanning(fft_size).astype(np.float32)
        elif window == FFTWindowType.HAMMING:
            self.window = np.hamming(fft_size).astype(np.float32)
        elif window == FFTWindowType.BLACKMAN:
            self.window = np.blackman(fft_size).astype(np.float32)
        else:  # RECTANGULAR
            self.window = np.ones(fft_size, dtype=np.float32)
        
        # Frequency mapping
        self.frequencies = np.fft.rfftfreq(fft_size, 1.0 / sample_rate).astype(np.float32)
        
        # Magnitude spectrum
        self.magnitudes = np.zeros(len(self.frequencies), dtype=np.float32)
        self.magnitudes_db = np.zeros(len(self.frequencies), dtype=np.float32)
        
        # Smoothing buffer
        self.smoothing_factor = 0.7
        self.smoothed_magnitudes = np.zeros(len(self.frequencies), dtype=np.float32)
        
        # Circular buffer for accumulating samples
        self.buffer = np.zeros(fft_size, dtype=np.float32)
        self.buffer_index = 0
        self.buffer_ready = False
    
    def process(self, signal: np.ndarray) -> bool:
        """
        Process audio signal and compute FFT.
        
        Args:
            signal: Audio signal (mono)
        
        Returns:
            True if FFT was computed, False if still accumulating
        """
        signal = signal.astype(np.float32) if signal.dtype != np.float32 else signal
        
        # Handle stereo by using first channel
        if signal.ndim == 2:
            signal = signal[:, 0]
        
        # Fill circular buffer
        num_samples = len(signal)
        for i in range(num_samples):
            self.buffer[self.buffer_index] = signal[i]
            self.buffer_index += 1
            
            if self.buffer_index >= self.fft_size:
                self.buffer_index = 0
                self._compute_fft()
                return True
        
        return False
    
    def _compute_fft(self) -> None:
        """Compute FFT on buffered samples."""
        # Apply window
        windowed = self.buffer * self.window
        
        # Compute FFT
        fft_result = np.fft.rfft(windowed)
        
        # Compute magnitude
        self.magnitudes = np.abs(fft_result).astype(np.float32)
        
        # Convert to dB
        eps = 1e-8
        self.magnitudes_db = 20 * np.log10(np.clip(self.magnitudes, eps, 1.0))
        
        # Apply smoothing (exponential moving average)
        self.smoothed_magnitudes = (
            self.smoothing_factor * self.smoothed_magnitudes +
            (1 - self.smoothing_factor) * self.magnitudes_db
        )
        
        self.buffer_ready = True
    
    def get_frequencies(self) -> np.ndarray:
        """Get frequency bin centers in Hz."""
        return self.frequencies.copy()
    
    def get_magnitudes(self) -> np.ndarray:
        """Get linear magnitude spectrum."""
        return self.magnitudes.copy()
    
    def get_magnitudes_db(self) -> np.ndarray:
        """Get magnitude spectrum in dB."""
        return self.magnitudes_db.copy()
    
    def get_smoothed_magnitudes_db(self) -> np.ndarray:
        """Get smoothed magnitude spectrum in dB."""
        return self.smoothed_magnitudes.copy()
    
    def get_frequency_bands(self, num_bands: int = 32) -> Tuple[np.ndarray, np.ndarray]:
        """
        Get simplified frequency bands for visualization.
        
        Args:
            num_bands: Number of frequency bands (default 32)
        
        Returns:
            Tuple of (band_frequencies, band_magnitudes) arrays
        """
        # Logarithmic frequency spacing
        freqs = self.frequencies[1:]  # Skip DC
        mags = self.magnitudes_db[1:]
        
        # Create logarithmic bins
        min_freq = 20.0
        max_freq = self.sample_rate / 2
        
        log_freqs = np.logspace(np.log10(min_freq), np.log10(max_freq), num_bands)
        band_mags = np.zeros(num_bands, dtype=np.float32)
        
        # Average magnitude in each band
        for i in range(num_bands - 1):
            mask = (freqs >= log_freqs[i]) & (freqs < log_freqs[i + 1])
            if np.any(mask):
                band_mags[i] = np.mean(mags[mask])
            else:
                band_mags[i] = np.min(mags)
        
        # Last band
        mask = freqs >= log_freqs[-1]
        if np.any(mask):
            band_mags[-1] = np.mean(mags[mask])
        else:
            band_mags[-1] = np.min(mags)
        
        return log_freqs, band_mags
    
    def set_smoothing(self, factor: float) -> None:
        """
        Set smoothing factor (0-1, higher = more smoothing).
        
        Args:
            factor: Smoothing factor (0-1)
        """
        self.smoothing_factor = np.clip(factor, 0.0, 1.0)
    
    def reset(self) -> None:
        """Reset analyzer state."""
        self.buffer.fill(0.0)
        self.buffer_index = 0
        self.magnitudes.fill(0.0)
        self.magnitudes_db.fill(-np.inf)
        self.smoothed_magnitudes.fill(-np.inf)
        self.buffer_ready = False
    
    def to_dict(self) -> Dict:
        """Serialize analyzer state to dictionary."""
        return {
            "type": "SpectrumAnalyzer",
            "fft_size": self.fft_size,
            "sample_rate": self.sample_rate,
            "window": self.window_type.value,
            "smoothing_factor": float(self.smoothing_factor),
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "SpectrumAnalyzer":
        """Restore analyzer state from dictionary."""
        analyzer = cls(
            fft_size=data.get("fft_size", 2048),
            sample_rate=data.get("sample_rate", 44100),
            window=FFTWindowType(data.get("window", "hann"))
        )
        analyzer.set_smoothing(data.get("smoothing_factor", 0.7))
        return analyzer


class VUMeter:
    """
    Logarithmic VU meter simulation.
    
    Features:
    - Logarithmic dB scaling (-40 to +6 dB range)
    - Exponential averaging for smooth needle
    - Peak hold indicator
    - Headroom simulation
    
    Usage:
        vu = VUMeter(sample_rate=44100)
        vu.process(audio_signal)
        vu_reading = vu.get_vu()  # 0-1 range for -40 to +6 dB
    """
    
    def __init__(self, sample_rate: int = 44100):
        """
        Initialize VU meter.
        
        Args:
            sample_rate: Sample rate in Hz
        """
        self.sample_rate = sample_rate
        
        # VU meter ranges (in dB)
        self.min_db = -40.0
        self.max_db = 6.0
        self.range_db = self.max_db - self.min_db
        
        # Meter value (0-1)
        self.vu = 0.0
        
        # Averaging (exponential moving average)
        self.averaging_time_ms = 300  # 300ms averaging
        self.averaging_samples = int(sample_rate * self.averaging_time_ms / 1000)
        self.average_factor = 1.0 / max(1, self.averaging_samples)
        
        # RMS accumulation
        self.rms_accum = 0.0
        self.sample_count = 0
    
    def process(self, signal: np.ndarray) -> None:
        """
        Process audio signal for VU metering.
        
        Args:
            signal: Audio signal (mono or stereo)
        """
        signal = signal.astype(np.float32) if signal.dtype != np.float32 else signal
        
        # Handle stereo
        if signal.ndim == 2:
            signal = np.mean(np.abs(signal), axis=1)
        else:
            signal = np.abs(signal)
        
        # RMS calculation with averaging window
        for sample in signal:
            self.rms_accum += sample ** 2
            self.sample_count += 1
            
            if self.sample_count >= self.averaging_samples:
                # Compute RMS
                rms = np.sqrt(self.rms_accum / self.sample_count)
                
                # Convert to dB
                eps = 1e-8
                db = 20 * np.log10(np.clip(rms, eps, 1.0))
                
                # Clamp to VU range
                db = np.clip(db, self.min_db, self.max_db)
                
                # Normalize to 0-1
                normalized = (db - self.min_db) / self.range_db
                
                # Exponential smoothing
                self.vu = 0.8 * self.vu + 0.2 * normalized
                
                # Reset accumulator
                self.rms_accum = 0.0
                self.sample_count = 0
    
    def get_vu(self) -> float:
        """Get VU meter reading (0-1, normalized to -40...+6 dB)."""
        return np.clip(self.vu, 0.0, 1.0)
    
    def get_vu_db(self) -> float:
        """Get VU meter reading in dB."""
        return self.min_db + self.vu * self.range_db
    
    def reset(self) -> None:
        """Reset VU meter."""
        self.vu = 0.0
        self.rms_accum = 0.0
        self.sample_count = 0
    
    def to_dict(self) -> Dict:
        """Serialize meter state to dictionary."""
        return {
            "type": "VUMeter",
            "sample_rate": self.sample_rate,
            "vu": float(self.vu),
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "VUMeter":
        """Restore meter state from dictionary."""
        meter = cls(sample_rate=data.get("sample_rate", 44100))
        meter.vu = data.get("vu", 0.0)
        return meter


class Correlometer:
    """
    Stereo correlation measurement tool.
    
    Features:
    - Left-Right correlation coefficient (-1 to +1)
    - Positive correlation: L and R in phase (mono)
    - Zero correlation: L and R uncorrelated
    - Negative correlation: L and R out of phase
    - History tracking for visualization
    
    Usage:
        corr = Correlometer(sample_rate=44100)
        corr.process(stereo_audio)
        correlation = corr.get_correlation()  # -1 to +1
    """
    
    def __init__(self, sample_rate: int = 44100, window_size: int = 2048):
        """
        Initialize correlometer.
        
        Args:
            sample_rate: Sample rate in Hz
            window_size: Window size for correlation calculation
        """
        self.sample_rate = sample_rate
        self.window_size = window_size
        
        # Correlation state
        self.correlation = 0.0
        self.mid_level = 0.0  # (L + R) / 2
        self.side_level = 0.0  # (L - R) / 2
        
        # History
        self.correlation_history = np.zeros(512, dtype=np.float32)
        self.history_index = 0
        
        # Circular buffers
        self.left_buffer = np.zeros(window_size, dtype=np.float32)
        self.right_buffer = np.zeros(window_size, dtype=np.float32)
        self.buffer_index = 0
    
    def process(self, signal: np.ndarray) -> None:
        """
        Process stereo signal for correlation.
        
        Args:
            signal: Stereo audio signal (N, 2) or mono (N,)
        """
        signal = signal.astype(np.float32) if signal.dtype != np.float32 else signal
        
        # Ensure stereo
        if signal.ndim == 1:
            # Mono signal, assume zero correlation
            self.correlation = 0.0
            return
        
        left = signal[:, 0]
        right = signal[:, 1] if signal.shape[1] > 1 else signal[:, 0]
        
        # Fill circular buffers
        num_samples = len(left)
        for i in range(num_samples):
            self.left_buffer[self.buffer_index] = left[i]
            self.right_buffer[self.buffer_index] = right[i]
            self.buffer_index += 1
            
            if self.buffer_index >= self.window_size:
                self.buffer_index = 0
                self._compute_correlation()
    
    def _compute_correlation(self) -> None:
        """Compute correlation coefficient."""
        # Compute correlation: (L·R) / sqrt(L²·R²)
        numerator = np.sum(self.left_buffer * self.right_buffer)
        denominator = np.sqrt(np.sum(self.left_buffer ** 2) * np.sum(self.right_buffer ** 2))
        
        if denominator > 0:
            self.correlation = numerator / denominator
        else:
            self.correlation = 0.0
        
        # Clamp to [-1, 1]
        self.correlation = np.clip(self.correlation, -1.0, 1.0)
        
        # Compute mid (L+R)/2 and side (L-R)/2 levels
        mid = (self.left_buffer + self.right_buffer) * 0.5
        side = (self.left_buffer - self.right_buffer) * 0.5
        
        self.mid_level = np.sqrt(np.mean(mid ** 2))
        self.side_level = np.sqrt(np.mean(side ** 2))
        
        # Update history
        self.correlation_history[self.history_index] = self.correlation
        self.history_index = (self.history_index + 1) % len(self.correlation_history)
    
    def get_correlation(self) -> float:
        """
        Get correlation coefficient (-1 to +1).
        
        Returns:
            -1: Completely out of phase (inverted)
             0: Uncorrelated (stereo)
            +1: Perfectly in phase (mono)
        """
        return self.correlation
    
    def get_mid_level(self) -> float:
        """Get mid (L+R) level in linear."""
        return self.mid_level
    
    def get_side_level(self) -> float:
        """Get side (L-R) level in linear."""
        return self.side_level
    
    def get_correlation_history(self) -> np.ndarray:
        """Get correlation history for visualization."""
        return self.correlation_history.copy()
    
    def is_mono(self, threshold: float = 0.95) -> bool:
        """Check if signal is essentially mono (high correlation)."""
        return self.correlation > threshold
    
    def is_stereo(self, threshold: float = 0.5) -> bool:
        """Check if signal is stereo (low correlation)."""
        return self.correlation < threshold
    
    def reset(self) -> None:
        """Reset correlometer."""
        self.correlation = 0.0
        self.mid_level = 0.0
        self.side_level = 0.0
        self.left_buffer.fill(0.0)
        self.right_buffer.fill(0.0)
        self.buffer_index = 0
        self.correlation_history.fill(0.0)
        self.history_index = 0
    
    def to_dict(self) -> Dict:
        """Serialize correlometer state to dictionary."""
        return {
            "type": "Correlometer",
            "sample_rate": self.sample_rate,
            "window_size": self.window_size,
            "correlation": float(self.correlation),
            "mid_level": float(self.mid_level),
            "side_level": float(self.side_level),
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Correlometer":
        """Restore correlometer state from dictionary."""
        corr = cls(
            sample_rate=data.get("sample_rate", 44100),
            window_size=data.get("window_size", 2048)
        )
        corr.correlation = data.get("correlation", 0.0)
        corr.mid_level = data.get("mid_level", 0.0)
        corr.side_level = data.get("side_level", 0.0)
        return corr


# Public API exports
__all__ = [
    'FFTWindowType',
    'MeterMode',
    'LevelMeter',
    'SpectrumAnalyzer',
    'VUMeter',
    'Correlometer',
]
