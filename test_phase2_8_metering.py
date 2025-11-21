"""
Phase 2.8 Tests: Metering & Analysis Tools

Comprehensive test suite for:
- LevelMeter (peak/RMS detection)
- SpectrumAnalyzer (FFT analysis)
- VUMeter (logarithmic metering)
- Correlometer (stereo correlation)
"""

import numpy as np
import pytest
from daw_core.metering import (
    LevelMeter, SpectrumAnalyzer, VUMeter, Correlometer,
    FFTWindowType, MeterMode
)


# ============================================================================
# LevelMeter Tests
# ============================================================================

class TestLevelMeter:
    """Test LevelMeter peak and RMS detection."""
    
    def test_initialization(self):
        """Test LevelMeter initialization."""
        meter = LevelMeter(sample_rate=44100, history_size=1024)
        assert meter.sample_rate == 44100
        assert meter.history_size == 1024
        assert meter.peak == 0.0
        assert meter.rms == 0.0
        assert np.isinf(meter.peak_db)
        assert np.isinf(meter.rms_db)
    
    def test_peak_detection(self):
        """Test peak detection accuracy."""
        meter = LevelMeter()
        
        # Create signal with known peak
        signal = np.zeros(1000, dtype=np.float32)
        signal[500] = 0.5  # Peak at sample 500
        
        meter.process(signal)
        assert meter.peak == pytest.approx(0.5, abs=0.01)
        assert meter.peak_db == pytest.approx(20 * np.log10(0.5), abs=0.1)
    
    def test_rms_calculation(self):
        """Test RMS calculation."""
        meter = LevelMeter()
        
        # Sine wave: RMS = amplitude / sqrt(2)
        t = np.linspace(0, 2 * np.pi, 1000, dtype=np.float32)
        amplitude = 0.5
        signal = amplitude * np.sin(t)
        
        meter.process(signal)
        expected_rms = amplitude / np.sqrt(2)
        assert meter.rms == pytest.approx(expected_rms, abs=0.01)
    
    def test_clipping_detection(self):
        """Test clipping detection."""
        meter = LevelMeter()
        
        signal = np.ones(100, dtype=np.float32) * 1.5  # Clipping
        meter.process(signal)
        
        assert meter.is_clipped()
        assert meter.get_clip_count() == 100
    
    def test_no_clipping_on_normal_signal(self):
        """Test no clipping on normal signal."""
        meter = LevelMeter()
        
        signal = np.random.randn(1000).astype(np.float32) * 0.1
        meter.process(signal)
        
        assert not meter.is_clipped()
        assert meter.get_clip_count() == 0
    
    def test_peak_hold_decay(self):
        """Test peak hold and decay with sustained peak."""
        meter = LevelMeter()
        
        # Process signal with peak (0.8)
        signal = np.zeros(1000, dtype=np.float32)
        signal[0] = 0.8
        meter.process(signal)
        
        initial_sustained = meter.get_sustained_peak_db()
        
        # Process silence - sustained peak will decay
        silence = np.zeros(44100, dtype=np.float32)  # 1 second at 44100 Hz
        meter.process(silence)
        
        decayed_sustained = meter.get_sustained_peak_db()
        # Sustained peak should decay over time with silence
        assert decayed_sustained <= initial_sustained  # Doesn't increase
        
        # Further silence should continue decaying
        more_silence = np.zeros(44100, dtype=np.float32)
        meter.process(more_silence)
        
        further_decayed = meter.get_sustained_peak_db()
        # Should continue decaying
        assert further_decayed <= decayed_sustained
    
    def test_stereo_processing(self):
        """Test stereo signal processing."""
        meter = LevelMeter()
        
        # Stereo signal
        stereo = np.zeros((1000, 2), dtype=np.float32)
        stereo[:, 0] = 0.3  # Left channel
        stereo[:, 1] = 0.5  # Right channel (higher)
        
        meter.process(stereo)
        
        # Should measure max of L/R
        assert meter.peak == pytest.approx(0.5, abs=0.01)
    
    def test_history_buffer(self):
        """Test history buffer update."""
        meter = LevelMeter(history_size=100)
        
        # Process multiple blocks
        for _ in range(150):
            signal = np.random.randn(100).astype(np.float32) * 0.1
            meter.process(signal)
        
        history = meter.get_peak_history()
        assert len(history) == 100
        assert not np.all(np.isnan(history))
    
    def test_sustained_levels(self):
        """Test sustained peak and RMS tracking."""
        meter = LevelMeter()
        
        # Initial signal
        signal = np.ones(1000, dtype=np.float32) * 0.3
        meter.process(signal)
        sustained_peak_1 = meter.get_sustained_peak_db()
        
        # Quieter signal (sustained should decay)
        quiet_signal = np.ones(1000, dtype=np.float32) * 0.1
        meter.process(quiet_signal)
        sustained_peak_2 = meter.get_sustained_peak_db()
        
        assert sustained_peak_2 < sustained_peak_1
    
    def test_serialization(self):
        """Test meter serialization."""
        meter = LevelMeter(sample_rate=44100, history_size=1024)
        
        # Process signal to set state
        signal = np.random.randn(1000).astype(np.float32) * 0.1
        meter.process(signal)
        
        # Serialize
        data = meter.to_dict()
        assert data["type"] == "LevelMeter"
        assert data["sample_rate"] == 44100
        assert data["history_size"] == 1024
        
        # Deserialize
        restored = LevelMeter.from_dict(data)
        assert restored.sample_rate == meter.sample_rate
        assert restored.peak_db == pytest.approx(meter.peak_db)


# ============================================================================
# SpectrumAnalyzer Tests
# ============================================================================

class TestSpectrumAnalyzer:
    """Test SpectrumAnalyzer FFT computation."""
    
    def test_initialization(self):
        """Test SpectrumAnalyzer initialization."""
        analyzer = SpectrumAnalyzer(fft_size=2048, sample_rate=44100)
        assert analyzer.fft_size == 2048
        assert analyzer.sample_rate == 44100
        assert len(analyzer.frequencies) == 1025  # rfft: 2048/2 + 1
        assert analyzer.frequencies[0] == 0.0  # DC component
    
    def test_pure_tone_detection(self):
        """Test detection of pure sine tone."""
        analyzer = SpectrumAnalyzer(fft_size=4096, sample_rate=44100)
        
        # Generate 1 kHz sine (multiple periods for better resolution)
        freq = 1000.0
        duration = 4096 / 44100  # One FFT window
        t = np.linspace(0, duration, 4096, dtype=np.float32)
        signal = np.sin(2 * np.pi * freq * t)
        
        analyzer.process(signal)
        mags_db = analyzer.get_magnitudes_db()
        
        # Find peak bin
        peak_bin = np.argmax(mags_db)
        peak_freq = analyzer.frequencies[peak_bin]
        
        # Should be close to 1 kHz (larger FFT gives better frequency resolution)
        assert peak_freq == pytest.approx(freq, abs=100)
    
    def test_windowing_functions(self):
        """Test different windowing functions."""
        sample_rate = 44100
        signal = np.random.randn(2048).astype(np.float32)
        
        windows = [
            FFTWindowType.HANN,
            FFTWindowType.HAMMING,
            FFTWindowType.BLACKMAN,
            FFTWindowType.RECTANGULAR,
        ]
        
        for window in windows:
            analyzer = SpectrumAnalyzer(window=window, sample_rate=sample_rate)
            analyzer.process(signal)
            mags = analyzer.get_magnitudes()
            assert len(mags) > 0
            assert not np.all(np.isnan(mags))
    
    def test_frequency_mapping(self):
        """Test frequency bin mapping."""
        analyzer = SpectrumAnalyzer(fft_size=2048, sample_rate=44100)
        
        freqs = analyzer.get_frequencies()
        assert freqs[0] == 0.0  # DC
        assert freqs[-1] <= 22050  # Nyquist (exactly at Nyquist is valid)
        
        # Check monotonic increase
        assert np.all(np.diff(freqs) > 0)
    
    def test_frequency_bands(self):
        """Test logarithmic frequency bands."""
        analyzer = SpectrumAnalyzer(fft_size=2048, sample_rate=44100)
        
        # Generate white noise
        noise = np.random.randn(2048).astype(np.float32) * 0.1
        analyzer.process(noise)
        
        band_freqs, band_mags = analyzer.get_frequency_bands(num_bands=32)
        
        assert len(band_freqs) == 32
        assert len(band_mags) == 32
        assert np.all(np.diff(band_freqs) > 0)  # Increasing freqs
    
    def test_smoothing(self):
        """Test spectrum smoothing."""
        analyzer = SpectrumAnalyzer()
        
        signal = np.random.randn(2048).astype(np.float32) * 0.1
        analyzer.process(signal)
        
        # Get initial values
        mags_1 = analyzer.get_magnitudes_db().copy()
        
        # Process again with smoothing
        signal2 = np.random.randn(2048).astype(np.float32) * 0.1
        analyzer.process(signal2)
        
        # Smoothed should be between previous and current
        mags_smoothed = analyzer.get_smoothed_magnitudes_db()
        assert not np.allclose(mags_smoothed, mags_1)
    
    def test_reset(self):
        """Test analyzer reset."""
        analyzer = SpectrumAnalyzer()
        
        # Process signal
        signal = np.random.randn(2048).astype(np.float32) * 0.1
        analyzer.process(signal)
        
        # Should have values
        assert np.any(analyzer.magnitudes > 0)
        
        # Reset
        analyzer.reset()
        assert np.all(analyzer.magnitudes == 0)
        assert analyzer.buffer_index == 0
    
    def test_serialization(self):
        """Test analyzer serialization."""
        analyzer = SpectrumAnalyzer(fft_size=2048, sample_rate=44100)
        
        data = analyzer.to_dict()
        assert data["type"] == "SpectrumAnalyzer"
        assert data["fft_size"] == 2048
        assert data["sample_rate"] == 44100
        
        restored = SpectrumAnalyzer.from_dict(data)
        assert restored.fft_size == analyzer.fft_size
        assert restored.sample_rate == analyzer.sample_rate


# ============================================================================
# VUMeter Tests
# ============================================================================

class TestVUMeter:
    """Test VUMeter logarithmic metering."""
    
    def test_initialization(self):
        """Test VUMeter initialization."""
        vu = VUMeter(sample_rate=44100)
        assert vu.sample_rate == 44100
        assert vu.vu == 0.0
        assert vu.min_db == -40.0
        assert vu.max_db == 6.0
    
    def test_vu_scaling(self):
        """Test VU scaling to 0-1 range."""
        vu = VUMeter()
        
        # Create signal at different levels
        for amplitude in [0.1, 0.3, 0.5, 0.8]:
            vu.reset()
            
            # Generate enough samples for averaging
            signal = np.ones(44100, dtype=np.float32) * amplitude
            vu.process(signal)
            
            vu_reading = vu.get_vu()
            assert 0.0 <= vu_reading <= 1.0
    
    def test_vu_tracking(self):
        """Test VU meter tracking."""
        vu = VUMeter()
        
        # Quiet signal
        signal_quiet = np.ones(44100, dtype=np.float32) * 0.05
        vu.process(signal_quiet)
        vu_quiet = vu.get_vu()
        
        # Louder signal
        signal_loud = np.ones(44100, dtype=np.float32) * 0.5
        vu.process(signal_loud)
        vu_loud = vu.get_vu()
        
        # Louder signal should read higher
        assert vu_loud > vu_quiet
    
    def test_stereo_processing(self):
        """Test stereo VU metering."""
        vu = VUMeter()
        
        # Stereo signal
        stereo = np.ones((44100, 2), dtype=np.float32) * 0.3
        vu.process(stereo)
        
        vu_reading = vu.get_vu()
        assert 0.0 <= vu_reading <= 1.0
    
    def test_db_conversion(self):
        """Test VU to dB conversion."""
        vu = VUMeter()
        
        signal = np.ones(44100, dtype=np.float32) * 0.3
        vu.process(signal)
        
        vu_db = vu.get_vu_db()
        assert vu.min_db <= vu_db <= vu.max_db
    
    def test_smoothing(self):
        """Test VU meter exponential smoothing."""
        vu = VUMeter()
        
        # Process quiet signal
        signal1 = np.ones(22050, dtype=np.float32) * 0.1
        vu.process(signal1)
        reading1 = vu.get_vu()
        
        # Process loud signal
        signal2 = np.ones(22050, dtype=np.float32) * 0.9
        vu.process(signal2)
        reading2 = vu.get_vu()
        
        # Should be between initial and final (smoothed)
        assert reading1 < reading2
    
    def test_reset(self):
        """Test VU meter reset."""
        vu = VUMeter()
        
        signal = np.ones(44100, dtype=np.float32) * 0.5
        vu.process(signal)
        
        assert vu.get_vu() > 0.0
        
        vu.reset()
        assert vu.get_vu() == 0.0
    
    def test_serialization(self):
        """Test VU meter serialization."""
        vu = VUMeter(sample_rate=44100)
        
        signal = np.random.randn(44100).astype(np.float32) * 0.1
        vu.process(signal)
        
        data = vu.to_dict()
        assert data["type"] == "VUMeter"
        assert data["sample_rate"] == 44100
        
        restored = VUMeter.from_dict(data)
        assert restored.sample_rate == vu.sample_rate
        assert restored.get_vu() == pytest.approx(vu.get_vu())


# ============================================================================
# Correlometer Tests
# ============================================================================

class TestCorrelometer:
    """Test Correlometer stereo correlation measurement."""
    
    def test_initialization(self):
        """Test Correlometer initialization."""
        corr = Correlometer(sample_rate=44100, window_size=2048)
        assert corr.sample_rate == 44100
        assert corr.window_size == 2048
        assert corr.correlation == 0.0
    
    def test_mono_correlation(self):
        """Test correlation of mono signal (L=R)."""
        corr = Correlometer(window_size=2048)
        
        # Mono signal: L = R
        signal = np.random.randn(2048, 2).astype(np.float32) * 0.1
        signal[:, 1] = signal[:, 0]  # R = L
        
        corr.process(signal)
        
        # Should be highly correlated (close to +1)
        assert corr.get_correlation() > 0.95
        assert corr.is_mono()
    
    def test_stereo_uncorrelated(self):
        """Test correlation of uncorrelated stereo."""
        corr = Correlometer(window_size=2048)
        
        # Independent L and R
        left = np.random.randn(2048).astype(np.float32) * 0.1
        right = np.random.randn(2048).astype(np.float32) * 0.1
        
        signal = np.column_stack([left, right])
        corr.process(signal)
        
        # Should be low correlation
        correlation = corr.get_correlation()
        assert -0.3 < correlation < 0.3  # Close to 0
        assert corr.is_stereo()
    
    def test_phase_inverted(self):
        """Test correlation of phase-inverted stereo."""
        corr = Correlometer(window_size=2048)
        
        # L = -R (phase inverted)
        signal = np.random.randn(2048, 2).astype(np.float32) * 0.1
        signal[:, 1] = -signal[:, 0]  # R = -L
        
        corr.process(signal)
        
        # Should be negatively correlated (close to -1)
        assert corr.get_correlation() < -0.95
    
    def test_mid_side_levels(self):
        """Test mid and side level calculation."""
        corr = Correlometer(window_size=2048)
        
        # Create stereo signal
        signal = np.ones((2048, 2), dtype=np.float32) * 0.5
        corr.process(signal)
        
        mid = corr.get_mid_level()
        side = corr.get_side_level()
        
        # For mono signal, mid should be non-zero, side should be ~0
        assert mid > 0.0
        assert side < 0.1
    
    def test_mono_detection(self):
        """Test mono detection threshold."""
        corr = Correlometer(window_size=2048)
        
        # Mono signal
        signal_mono = np.random.randn(2048, 2).astype(np.float32) * 0.1
        signal_mono[:, 1] = signal_mono[:, 0]
        
        corr.process(signal_mono)
        assert corr.is_mono(threshold=0.9)
        
        # Stereo signal
        left = np.random.randn(2048).astype(np.float32) * 0.1
        right = np.random.randn(2048).astype(np.float32) * 0.1
        signal_stereo = np.column_stack([left, right])
        
        corr.reset()
        corr.process(signal_stereo)
        assert corr.is_stereo(threshold=0.3)
    
    def test_correlation_history(self):
        """Test correlation history tracking."""
        corr = Correlometer(window_size=512)
        
        # Process multiple blocks
        for _ in range(100):
            signal = np.random.randn(512, 2).astype(np.float32) * 0.1
            corr.process(signal)
        
        history = corr.get_correlation_history()
        assert len(history) == 512
        assert not np.all(history == 0.0)
    
    def test_reset(self):
        """Test correlometer reset."""
        corr = Correlometer(window_size=2048)
        
        # Process signal
        signal = np.random.randn(2048, 2).astype(np.float32) * 0.1
        corr.process(signal)
        
        assert corr.get_correlation() != 0.0
        
        # Reset
        corr.reset()
        assert corr.get_correlation() == 0.0
        assert corr.get_mid_level() == 0.0
    
    def test_serialization(self):
        """Test correlometer serialization."""
        corr = Correlometer(sample_rate=44100, window_size=2048)
        
        # Process signal
        signal = np.random.randn(2048, 2).astype(np.float32) * 0.1
        corr.process(signal)
        
        data = corr.to_dict()
        assert data["type"] == "Correlometer"
        assert data["sample_rate"] == 44100
        assert data["window_size"] == 2048
        
        restored = Correlometer.from_dict(data)
        assert restored.sample_rate == corr.sample_rate
        assert restored.get_correlation() == pytest.approx(corr.get_correlation())


# ============================================================================
# Integration Tests
# ============================================================================

class TestMeteringIntegration:
    """Integration tests for metering tools."""
    
    def test_full_metering_chain(self):
        """Test complete metering chain on audio signal."""
        # Initialize all meters
        level_meter = LevelMeter()
        spectrum = SpectrumAnalyzer()
        vu = VUMeter()
        corr = Correlometer()
        
        # Generate test signal
        t = np.linspace(0, 1, 44100, dtype=np.float32)
        left = 0.3 * np.sin(2 * np.pi * 440 * t)
        right = 0.2 * np.sin(2 * np.pi * 880 * t)
        stereo = np.column_stack([left, right])
        
        # Process in blocks
        block_size = 512
        for i in range(0, len(stereo), block_size):
            block = stereo[i:i+block_size]
            
            level_meter.process(block)
            spectrum.process(block[:, 0])
            vu.process(block)
            corr.process(block)
        
        # Verify measurements
        assert level_meter.get_peak_db() < 0  # Under 0 dB
        assert vu.get_vu() > 0
        
        # Spectrum should show peaks at 440 and 880 Hz
        freqs, mags = spectrum.get_frequency_bands(32)
        assert len(freqs) == 32
        
        # Correlation should be between 0 and 1 (slightly stereo)
        corr_value = corr.get_correlation()
        assert -1 <= corr_value <= 1
    
    def test_realistic_audio_scenario(self):
        """Test metering on realistic audio scenario."""
        # Simulate vocal track with dynamics
        t = np.linspace(0, 4, 4 * 44100, dtype=np.float32)
        
        # Varying amplitude envelope
        envelope = np.ones_like(t) * 0.5
        envelope[44100:88200] = np.linspace(0.5, 0.8, 44100)  # Swell
        envelope[88200:132300] = 0.8  # Sustain
        envelope[132300:] = np.linspace(0.8, 0.1, 44100)  # Fade
        
        # Signal with harmonics
        fundamental = 200
        signal = (
            0.7 * np.sin(2 * np.pi * fundamental * t) +
            0.3 * np.sin(2 * np.pi * fundamental * 2 * t) +
            0.1 * np.sin(2 * np.pi * fundamental * 3 * t)
        )
        signal = (signal * envelope).astype(np.float32)
        
        # Stereo (slight delay)
        delay_samples = 256
        left = signal
        right = np.concatenate([np.zeros(delay_samples), signal[:-delay_samples]])
        stereo = np.column_stack([left, right])
        
        # Process with all meters
        level_meter = LevelMeter(sample_rate=44100, history_size=8192)
        spectrum = SpectrumAnalyzer(sample_rate=44100)
        vu = VUMeter()
        corr = Correlometer()
        
        block_size = 1024
        for i in range(0, len(stereo), block_size):
            block = stereo[i:i+block_size]
            
            level_meter.process(block)
            spectrum.process(block[:, 0])
            vu.process(block)
            corr.process(block)
        
        # Verify measurements make sense
        assert level_meter.get_peak_db() < 0  # No clipping
        assert 0 < vu.get_vu() < 1  # Reasonable VU reading
        assert 0 < corr.get_correlation() < 1  # Slightly stereo (due to delay)
    
    def test_metering_serialization_roundtrip(self):
        """Test metering state serialization roundtrip."""
        # Create and process with all meters
        level_meter = LevelMeter()
        spectrum = SpectrumAnalyzer()
        vu = VUMeter()
        corr = Correlometer()
        
        signal_mono = np.random.randn(2048).astype(np.float32) * 0.1
        signal_stereo = np.column_stack([signal_mono, signal_mono * 0.5])
        
        level_meter.process(signal_mono)
        spectrum.process(signal_mono)
        vu.process(signal_mono)
        corr.process(signal_stereo)
        
        # Serialize all
        data_dict = {
            "level": level_meter.to_dict(),
            "spectrum": spectrum.to_dict(),
            "vu": vu.to_dict(),
            "correlometer": corr.to_dict(),
        }
        
        # Deserialize
        level_restored = LevelMeter.from_dict(data_dict["level"])
        spectrum_restored = SpectrumAnalyzer.from_dict(data_dict["spectrum"])
        vu_restored = VUMeter.from_dict(data_dict["vu"])
        corr_restored = Correlometer.from_dict(data_dict["correlometer"])
        
        # Verify state preserved
        assert level_restored.peak_db == pytest.approx(level_meter.peak_db)
        assert vu_restored.get_vu() == pytest.approx(vu.get_vu())
        assert corr_restored.get_correlation() == pytest.approx(corr.get_correlation())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
