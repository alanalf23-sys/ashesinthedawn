import sys
import numpy as np
import soundfile as sf
import sounddevice as sd
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton,
    QFileDialog, QSlider, QLabel
)
from PyQt6.QtGui import QPainter, QColor, QPen
from PyQt6.QtCore import Qt, QTimer


def compute_waveform_peaks(audio_path, block_size=1024):
    """Compute min/max pairs for fast waveform rendering."""
    data, sr = sf.read(audio_path)
    if data.ndim > 1:
        data = np.mean(data, axis=1) # stereo → mono
    num_blocks = len(data) // block_size
    trimmed = data[:num_blocks * block_size].reshape(num_blocks, block_size)
    mins = trimmed.min(axis=1)
    maxs = trimmed.max(axis=1)
    return mins, maxs, sr, data


class WaveformWidget(QWidget):
    def __init__(self, mins, maxs, sr, duration):
        super().__init__()
        self.mins = mins
        self.maxs = maxs
        self.sr = sr
        self.duration = duration
        self.zoom = 1.0
        self.offset = 0.0
        self.playhead_time = 0.0
        self.is_playing = False

        self.timer = QTimer()
        self.timer.timeout.connect(self.update)
        self.timer.start(16) # ~60fps refresh

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.fillRect(self.rect(), QColor(20, 20, 20))
        w, h = self.width(), self.height()
        num_peaks = len(self.mins)
        samples_per_pixel = num_peaks / (w * self.zoom)
        start_idx = int(self.offset * num_peaks)
        end_idx = min(start_idx + int(w * self.zoom), num_peaks)

        mid_y = h // 2
        painter.setPen(QPen(QColor(0, 180, 255), 1))
        for x in range(w):
            idx = start_idx + int(x * samples_per_pixel)
            if idx >= end_idx:
                break
            y_min = mid_y - int(self.mins[idx] * mid_y)
            y_max = mid_y - int(self.maxs[idx] * mid_y)
            painter.drawLine(x, y_min, x, y_max)

        # draw playhead
        playhead_x = int((self.playhead_time / self.duration) * w)
        painter.setPen(QPen(QColor(255, 0, 0), 2))
        painter.drawLine(playhead_x, 0, playhead_x, h)

    def set_zoom(self, value):
        self.zoom = max(0.1, value / 50.0)
        self.update()

    def set_offset(self, value):
        self.offset = value / 100.0
        self.update()

    def set_playhead_time(self, t):
        self.playhead_time = t
        self.update()


class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("🎚 Waveform Timeline with Playback")
        self.resize(1000, 400)

        layout = QVBoxLayout()
        self.setLayout(layout)

        self.info_label = QLabel("Load an audio file to begin.")
        layout.addWidget(self.info_label)

        self.load_btn = QPushButton("Load Audio File")
        layout.addWidget(self.load_btn)
        self.load_btn.clicked.connect(self.load_audio)

        self.play_btn = QPushButton("▶ Play / ⏸ Pause")
        self.play_btn.setEnabled(False)
        layout.addWidget(self.play_btn)
        self.play_btn.clicked.connect(self.toggle_playback)

        self.zoom_slider = QSlider(Qt.Orientation.Horizontal)
        self.zoom_slider.setRange(1, 200)
        self.zoom_slider.setValue(50)
        layout.addWidget(self.zoom_slider)

        self.offset_slider = QSlider(Qt.Orientation.Horizontal)
        self.offset_slider.setRange(0, 100)
        layout.addWidget(self.offset_slider)

        self.waveform = None
        self.audio_data = None
        self.sr = None
        self.stream = None
        self.play_timer = QTimer()
        self.play_timer.timeout.connect(self.update_playhead)

    def load_audio(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Open Audio File", "", "Audio Files (*.wav *.flac *.aiff *.mp3)"
        )
        if not file_path:
            return

        mins, maxs, sr, data = compute_waveform_peaks(file_path)
        self.audio_data, self.sr = data, sr
        self.duration = len(data) / sr
        self.info_label.setText(f"Loaded: {file_path} | {sr} Hz | {self.duration:.2f} sec")

        if self.waveform:
            self.layout().removeWidget(self.waveform)
            self.waveform.deleteLater()
        self.waveform = WaveformWidget(mins, maxs, sr, self.duration)
        self.layout().addWidget(self.waveform)

        self.zoom_slider.valueChanged.connect(self.waveform.set_zoom)
        self.offset_slider.valueChanged.connect(self.waveform.set_offset)
        self.play_btn.setEnabled(True)

    def toggle_playback(self):
        if not self.audio_data is None:
            if not sd.get_stream():
                self.start_playback()
            elif sd.get_stream().active:
                self.pause_playback()
            else:
                self.resume_playback()

    def start_playback(self):
        self.play_start_time = 0.0
        sd.play(self.audio_data, self.sr)
        self.waveform.playhead_time = 0.0
        self.play_timer.start(30)
        self.info_label.setText("▶ Playing...")
        self.waveform.is_playing = True

    def pause_playback(self):
        sd.stop()
        self.play_timer.stop()
        self.info_label.setText("⏸ Paused")
        self.waveform.is_playing = False

    def resume_playback(self):
        sd.play(self.audio_data, self.sr)
        self.play_timer.start(30)
        self.info_label.setText("▶ Playing...")
        self.waveform.is_playing = True

    def update_playhead(self):
        if self.waveform and self.waveform.is_playing:
            t = sd.get_stream().time if sd.get_stream() else 0.0
            if t > self.waveform.duration:
                self.play_timer.stop()
                self.waveform.is_playing = False
            else:
                self.waveform.set_playhead_time(t)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    w = MainWindow()
    w.show()
    sys.exit(app.exec())
