"""
Enhanced Codette Analysis Module
Integrates training data into AI analysis for intelligent recommendations
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import json
import statistics
from codette_training_data import (
    training_data, 
    AudioMetrics,
    MIXING_STANDARDS,
    PLUGIN_SUGGESTIONS,
    ANALYSIS_CONTEXTS
)

@dataclass
class AnalysisResult:
    """Structured analysis result"""
    analysis_type: str
    status: str  # "good", "warning", "critical"
    score: float  # 0-100
    findings: List[str]
    recommendations: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    reasoning: str

class CodetteAnalyzer:
    """Enhanced analyzer using training data"""
    
    def __init__(self):
        self.training_data = training_data
        self.history: List[AnalysisResult] = []
    
    def analyze_gain_staging(self, track_metrics: List[Dict[str, Any]]) -> AnalysisResult:
        """Analyze gain staging across all tracks"""
        findings = []
        recommendations = []
        issues_found = 0
        score = 100
        
        # Extract metrics
        peaks = [t.get("peak", -60) for t in track_metrics]
        levels = [t.get("level", -24) for t in track_metrics]
        
        if not peaks:
            return AnalysisResult(
                analysis_type="gain_staging",
                status="warning",
                score=50,
                findings=["No track metrics available"],
                recommendations=[],
                metrics={},
                reasoning="Unable to analyze without track data"
            )
        
        max_peak = max(peaks)
        avg_level = statistics.mean(levels) if levels else -24
        
        # Check for clipping
        if max_peak > 0:
            findings.append(f"Clipping detected: peak at {max_peak:.1f}dB")
            recommendations.append({
                "action": "reduce_gains",
                "parameter": "all_tracks",
                "value": -3,
                "reason": "Prevent digital clipping"
            })
            issues_found += 1
            score -= 25
        
        # Check headroom
        if max_peak > -3:
            findings.append(f"Insufficient headroom: {abs(-3 - max_peak):.1f}dB margin")
            recommendations.append({
                "action": "reduce_volumes",
                "parameter": "master_gain",
                "value": -3 - max_peak,
                "reason": "Maintain safety headroom"
            })
            issues_found += 1
            score -= 15
        
        # Check for weak signals
        weak_tracks = [t for t in track_metrics if t.get("level", -24) < -24]
        if weak_tracks:
            findings.append(f"{len(weak_tracks)} tracks below optimal input level")
            recommendations.append({
                "action": "increase_input_gains",
                "tracks": [t.get("track_id") for t in weak_tracks],
                "reason": "Improve signal-to-noise ratio"
            })
            issues_found += 1
            score -= 10
        
        # Consistent level check
        if len(levels) > 1 and statistics.stdev(levels) > 12:
            findings.append("Inconsistent track levels detected")
            recommendations.append({
                "action": "balance_levels",
                "reason": "Create cohesive mix foundation"
            })
            score -= 10
        
        status = "critical" if issues_found >= 2 else ("warning" if issues_found > 0 else "good")
        
        return AnalysisResult(
            analysis_type="gain_staging",
            status=status,
            score=max(0, score),
            findings=findings or ["Gain staging within acceptable parameters"],
            recommendations=recommendations,
            metrics={
                "max_peak": max_peak,
                "avg_level": avg_level,
                "tracks_analyzed": len(track_metrics),
                "clipping_detected": max_peak > 0,
                "headroom_db": -3 - max_peak if max_peak > -3 else 3
            },
            reasoning=f"Analyzed {len(track_metrics)} tracks. Found {issues_found} issues."
        )
    
    def analyze_mixing(self, 
                      track_metrics: List[Dict[str, Any]],
                      frequency_data: Optional[Dict[str, float]] = None) -> AnalysisResult:
        """Analyze mix balance and frequency distribution"""
        findings = []
        recommendations = []
        score = 100
        
        if not track_metrics:
            return AnalysisResult(
                analysis_type="mixing",
                status="warning",
                score=50,
                findings=["No track data available"],
                recommendations=[],
                metrics={},
                reasoning="Unable to analyze without track metrics"
            )
        
        # Analyze track balance
        levels = [t.get("level", -24) for t in track_metrics if t.get("level")]
        if levels and len(levels) > 1:
            level_variance = statistics.stdev(levels)
            if level_variance > 12:
                findings.append(f"Unbalanced mix: {level_variance:.1f}dB variance")
                recommendations.append({
                    "action": "balance_levels",
                    "reason": "Create cohesive mix with balanced levels"
                })
                score -= 15
        
        # Analyze frequency balance if provided
        if frequency_data:
            low_energy = frequency_data.get("low", 0.5)
            mid_energy = frequency_data.get("mid", 0.5)
            high_energy = frequency_data.get("high", 0.5)
            
            if low_energy > 0.7:
                findings.append("Low end too prominent")
                recommendations.append({
                    "action": "apply_filter",
                    "parameter": "high_pass_filter",
                    "value": 100,
                    "reason": "Tighten low end and reduce muddiness"
                })
                score -= 10
            
            if mid_energy < 0.3:
                findings.append("Scooped mids - lacking presence")
                recommendations.append({
                    "action": "boost_eq",
                    "parameter": "mids_1khz",
                    "value": 3,
                    "reason": "Add presence and clarity"
                })
                score -= 10
            
            if high_energy > 0.8:
                findings.append("Harsh highs - too much presence")
                recommendations.append({
                    "action": "reduce_eq",
                    "parameter": "highs_5khz",
                    "value": -3,
                    "reason": "Smooth harshness while maintaining clarity"
                })
                score -= 5
        
        # Analyze plugin usage by track type
        plugin_count = sum(len(t.get("plugins", [])) for t in track_metrics)
        if plugin_count == 0:
            findings.append("No plugins applied - mix lacks shaping")
            recommendations.append({
                "action": "add_plugins",
                "reason": "Use EQ and compression to shape mix"
            })
            score -= 10
        
        status = "warning" if score < 80 else "good"
        
        return AnalysisResult(
            analysis_type="mixing",
            status=status,
            score=max(0, score),
            findings=findings or ["Mix balance looks good"],
            recommendations=recommendations,
            metrics={
                "tracks_analyzed": len(track_metrics),
                "total_plugins": plugin_count,
                "freq_balance": frequency_data or {}
            },
            reasoning=f"Analyzed {len(track_metrics)} tracks and frequency balance"
        )
    
    def analyze_routing(self, tracks: List[Dict[str, Any]]) -> AnalysisResult:
        """Analyze signal routing and track organization"""
        findings = []
        recommendations = []
        score = 100
        
        track_types = {}
        for track in tracks:
            track_type = track.get("type", "audio")
            track_types[track_type] = track_types.get(track_type, 0) + 1
        
        # Check for proper track organization
        if len(tracks) > 10 and not any(t.get("type") == "aux" for t in tracks):
            findings.append("No auxiliary tracks found in large project")
            recommendations.append({
                "action": "create_aux_tracks",
                "reason": "Use auxes for grouped effects and mixing efficiency"
            })
            score -= 15
        
        # Check for VCA masters
        has_vca = any(t.get("type") == "vca" for t in tracks)
        if len(track_types.get("audio", 0)) > 5 and not has_vca:
            findings.append("No VCA master for bus control")
            recommendations.append({
                "action": "create_vca_master",
                "reason": "Add VCA for controlling bus group together"
            })
            score -= 10
        
        # Check track naming and organization
        unnamed_tracks = [t for t in tracks if not t.get("name") or t.get("name") == ""]
        if unnamed_tracks and len(unnamed_tracks) > len(tracks) * 0.3:
            findings.append(f"{len(unnamed_tracks)} unnamed tracks - poor organization")
            recommendations.append({
                "action": "organize_project",
                "reason": "Name tracks clearly for workflow efficiency"
            })
            score -= 10
        
        if not findings:
            findings.append("Track routing and organization looks well-structured")
        
        status = "warning" if score < 75 else "good"
        
        return AnalysisResult(
            analysis_type="routing",
            status=status,
            score=max(0, score),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "track_types": track_types,
                "total_tracks": len(tracks),
                "aux_tracks": sum(1 for t in tracks if t.get("type") == "aux"),
                "vca_masters": sum(1 for t in tracks if t.get("type") == "vca")
            },
            reasoning=f"Analyzed routing for {len(tracks)} tracks"
        )
    
    def analyze_session_health(self, session_data: Dict[str, Any]) -> AnalysisResult:
        """Analyze overall session health and optimization"""
        findings = []
        recommendations = []
        score = 100
        
        # CPU usage analysis
        cpu_usage = session_data.get("cpu_usage", 0)
        if cpu_usage > 80:
            findings.append(f"High CPU usage: {cpu_usage:.1f}%")
            recommendations.append({
                "action": "freeze_plugins",
                "reason": "Freeze virtual instruments to reduce CPU load"
            })
            score -= 20
        elif cpu_usage > 60:
            findings.append(f"Moderate CPU usage: {cpu_usage:.1f}%")
            recommendations.append({
                "action": "monitor_cpu",
                "reason": "Watch for performance issues"
            })
            score -= 5
        
        # Plugin density
        total_plugins = session_data.get("total_plugins", 0)
        track_count = session_data.get("track_count", 1)
        plugins_per_track = total_plugins / track_count if track_count > 0 else 0
        
        if plugins_per_track > 5:
            findings.append(f"Heavy plugin density: {plugins_per_track:.1f} per track")
            recommendations.append({
                "action": "consolidate_chains",
                "reason": "Use fewer, more surgical plugins"
            })
            score -= 15
        
        # Project size
        if track_count > 50:
            findings.append(f"Large project: {track_count} tracks")
            recommendations.append({
                "action": "archive_unused",
                "reason": "Delete or archive unused tracks to clean up"
            })
            score -= 10
        
        # File organization
        if not session_data.get("has_color_coding", False):
            findings.append("Tracks not color-coded")
            recommendations.append({
                "action": "organize_colors",
                "reason": "Color-code tracks by instrument family"
            })
            score -= 5
        
        if not findings:
            findings.append("Session is well-organized and efficient")
        
        status = "critical" if score < 50 else ("warning" if score < 75 else "good")
        
        return AnalysisResult(
            analysis_type="session",
            status=status,
            score=max(0, score),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "cpu_usage": cpu_usage,
                "track_count": track_count,
                "total_plugins": total_plugins,
                "plugins_per_track": plugins_per_track
            },
            reasoning=f"Analyzed session with {track_count} tracks, {total_plugins} plugins"
        )
    
    def analyze_mastering_readiness(self, master_metrics: Dict[str, Any]) -> AnalysisResult:
        """Analyze if mix is ready for mastering"""
        findings = []
        recommendations = []
        score = 100
        
        standards = MIXING_STANDARDS["reference_levels"]
        
        # Check loudness
        loudness = master_metrics.get("loudness_lufs", -18)
        target_loudness = standards["target_loudness"]
        if abs(loudness - target_loudness) > 2:
            findings.append(f"Loudness deviation: {loudness:.1f}LUFS vs {target_loudness}LUFS target")
            recommendations.append({
                "action": "adjust_loudness",
                "parameter": "master_gain",
                "value": target_loudness - loudness,
                "reason": f"Achieve {target_loudness}LUFS for streaming compatibility"
            })
            score -= 15
        
        # Check headroom
        peak_level = master_metrics.get("peak_level", -3)
        if peak_level > standards["master_peak"]:
            findings.append(f"Insufficient headroom: {peak_level:.1f}dB")
            recommendations.append({
                "action": "reduce_master_level",
                "value": standards["master_peak"] - peak_level,
                "reason": "Prevent clipping during mastering"
            })
            score -= 20
        
        # Check dynamic range
        dynamic_range = master_metrics.get("dynamic_range", 0)
        if dynamic_range < 4:
            findings.append(f"Limited dynamic range: {dynamic_range:.1f}dB")
            recommendations.append({
                "action": "review_compression",
                "reason": "Ensure mix retains musical dynamics"
            })
            score -= 10
        
        # Check frequency balance
        freq_response = master_metrics.get("frequency_response", {})
        if freq_response:
            low_freq = freq_response.get("low", 0)
            high_freq = freq_response.get("high", 0)
            if abs(low_freq - high_freq) > 6:
                findings.append("Unbalanced frequency response")
                recommendations.append({
                    "action": "apply_linear_phase_eq",
                    "reason": "Flatten frequency response for mastering"
                })
                score -= 10
        
        if not findings:
            findings.append("Mix is well-prepared for mastering")
        
        status = "critical" if score < 60 else ("warning" if score < 80 else "good")
        
        return AnalysisResult(
            analysis_type="mastering",
            status=status,
            score=max(0, score),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "loudness_lufs": loudness,
                "peak_level": peak_level,
                "dynamic_range": dynamic_range,
                "frequency_response": freq_response
            },
            reasoning="Analyzed mix readiness for mastering stage"
        )
    
    def suggest_creative_improvements(self, mix_context: Dict[str, Any]) -> AnalysisResult:
        """Suggest creative enhancements to the mix"""
        findings = []
        recommendations = []
        score = 75  # Creative suggestions start at baseline
        
        # Check for parallel compression opportunity
        if mix_context.get("master_level", -24) < -6:
            findings.append("Opportunity for parallel compression to add glue")
            recommendations.append({
                "action": "add_parallel_compression",
                "reason": "Creates cohesion while preserving dynamics"
            })
            score += 5
        
        # Check for harmonic enhancement
        track_types = mix_context.get("track_types", {})
        if track_types.get("audio", 0) > 0:
            findings.append("Vocals/instruments could benefit from harmonic enhancement")
            recommendations.append({
                "action": "add_saturation",
                "tracks": ["vocals", "bass"],
                "reason": "Add warmth and character"
            })
            score += 5
        
        # Check for stereo width enhancement
        mono_tracks = mix_context.get("mono_track_count", 0)
        total_tracks = mix_context.get("total_tracks", 1)
        if mono_tracks / total_tracks > 0.7:
            findings.append("Consider adding stereo width to pads and synths")
            recommendations.append({
                "action": "add_stereo_width",
                "reason": "Enhance spatial qualities of the mix"
            })
            score += 3
        
        # Check for automation opportunities
        automation_count = mix_context.get("automation_count", 0)
        if automation_count < total_tracks * 0.3:
            findings.append("Limited automation detected")
            recommendations.append({
                "action": "add_automation",
                "targets": ["vocal_levels", "effect_sends", "filter_sweeps"],
                "reason": "Add movement and interest to the mix"
            })
            score += 5
        
        if not findings:
            findings.append("Mix has good creative elements")
        
        return AnalysisResult(
            analysis_type="creative",
            status="good",
            score=max(0, min(100, score)),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "mono_tracks": mono_tracks,
                "total_tracks": total_tracks,
                "automation_count": automation_count
            },
            reasoning="Analyzed creative enhancement opportunities"
        )
    
    # ==================== MUSICAL KNOWLEDGE METHODS ====================
    
    def get_musical_context(self, genre: str = None, tempo_bpm: int = None, 
                           time_signature: str = None) -> Dict[str, Any]:
        """Get musical context information"""
        context = {
            "genre": genre,
            "tempo": tempo_bpm,
            "time_signature": time_signature,
            "recommendations": []
        }
        
        # Add tempo-specific recommendations
        if tempo_bpm:
            context["tempo_info"] = self.training_data.get_tempo_info(
                self._get_tempo_marking(tempo_bpm)
            )
            # Suggest delay sync times
            context["delay_sync_suggestions"] = {
                "quarter_note": self.training_data.get_delay_sync_time(tempo_bpm, "quarter_note"),
                "eighth_note": self.training_data.get_delay_sync_time(tempo_bpm, "eighth_note"),
                "triplet_eighth": self.training_data.get_delay_sync_time(tempo_bpm, "triplet_eighth"),
                "dotted_eighth": self.training_data.get_delay_sync_time(tempo_bpm, "dotted_eighth")
            }
        
        # Add genre-specific recommendations
        if genre:
            genre_info = self.training_data.get_genre_knowledge(genre)
            context["genre_info"] = genre_info
            if genre_info:
                context["recommendations"].append(f"Genre: {genre}")
                if "tempo_range" in genre_info:
                    context["recommendations"].append(
                        f"Typical tempo: {genre_info['tempo_range'][0]}-{genre_info['tempo_range'][1]} BPM"
                    )
                if "instrumentation" in genre_info:
                    context["recommendations"].append(
                        f"Key instruments: {', '.join(genre_info['instrumentation'])}"
                    )
        
        # Add time signature info
        if time_signature:
            context["time_signature_info"] = self.training_data.get_time_signature_info(
                time_signature
            )
        
        return context
    
    def _get_tempo_marking(self, bpm: int) -> str:
        """Convert BPM to tempo marking"""
        tempo_markings = self.training_data.tempo_knowledge["tempo_markings"]
        for marking, (min_bpm, max_bpm) in tempo_markings.items():
            if min_bpm <= bpm <= max_bpm:
                return marking
        return "moderato"
    
    def suggest_effects_for_genre(self, genre: str, track_type: str) -> List[Dict[str, Any]]:
        """Suggest effects based on genre and track type"""
        genre_info = self.training_data.get_genre_knowledge(genre)
        track_suggestions = self.training_data.get_plugin_suggestion(track_type, [])
        
        recommendations = []
        if genre_info and track_suggestions:
            recommendations.extend(track_suggestions)
        
        # Add genre-specific effects
        genre_effects = {
            "pop": ["EQ", "Compressor", "Reverb"],
            "rock": ["Distortion", "Compressor", "Delay"],
            "jazz": ["Reverb", "Compression", "Saturation"],
            "electronic": ["Delay", "Reverb", "Filter"],
            "classical": ["Reverb", "Light Compression", "EQ"],
            "hip_hop": ["Compressor", "EQ", "Saturation"]
        }
        
        if genre.lower() in genre_effects:
            for effect in genre_effects[genre.lower()]:
                recommendations.append({
                    "category": "Genre-specific",
                    "suggestion": effect,
                    "reason": f"Common effect in {genre}"
                })
        
        return recommendations
    
    def analyze_chord_compatibility(self, scale: str, chord: str) -> Dict[str, Any]:
        """Analyze if chord is compatible with scale"""
        scale_info = self.training_data.get_scale_info(scale)
        chord_info = self.training_data.get_chord_info(chord)
        
        if not scale_info or not chord_info:
            return {"compatible": False, "reason": "Invalid scale or chord"}
        
        # Simple compatibility check (in real implementation, would compare degrees)
        return {
            "scale": scale,
            "chord": chord,
            "compatible": True,
            "scale_degrees": scale_info.get("degrees"),
            "chord_degrees": chord_info.get("degrees")
        }
    
    def get_musical_intervals(self) -> Dict[str, float]:
        """Get all musical intervals with frequency ratios"""
        return self.training_data.musical_knowledge["intervals"]
    
    def get_chromatic_scale(self) -> List[str]:
        """Get chromatic scale"""
        return self.training_data.get_chromatic_scale()
    
    def get_genre_instrumentation(self, genre: str) -> List[str]:
        """Get typical instrumentation for genre"""
        genre_info = self.training_data.get_genre_knowledge(genre)
        return genre_info.get("instrumentation", [])
    
    def analyze_mix_for_genre(self, genre: str, track_count: int, 
                             avg_track_type: str) -> AnalysisResult:
        """Analyze if mix matches genre conventions"""
        genre_info = self.training_data.get_genre_knowledge(genre)
        findings = []
        recommendations = []
        score = 85
        
        if not genre_info:
            return AnalysisResult(
                analysis_type="genre_mix",
                status="warning",
                score=50,
                findings=["Unknown genre"],
                recommendations=[],
                metrics={},
                reasoning="Cannot analyze unknown genre"
            )
        
        # Check track count
        if "instrumentation" in genre_info:
            expected_instruments = len(genre_info["instrumentation"])
            if track_count < expected_instruments - 2:
                findings.append(f"Track count low for {genre} ({track_count} vs typical {expected_instruments})")
                score -= 10
            elif track_count > expected_instruments + 5:
                findings.append(f"Mix has many tracks for {genre} (may be over-produced)")
                score -= 5
        
        # Check tempo
        if "tempo_range" in genre_info:
            findings.append(f"{genre} typical tempo: {genre_info['tempo_range'][0]}-{genre_info['tempo_range'][1]} BPM")
        
        # Check structure
        if "song_structure" in genre_info:
            findings.append(f"Typical structure: {genre_info['song_structure']}")
            recommendations.append({
                "action": "follow_genre_structure",
                "structure": genre_info["song_structure"]
            })
        
        if not findings:
            findings.append(f"Mix follows {genre} conventions")
        
        return AnalysisResult(
            analysis_type="genre_mix",
            status="good" if score >= 80 else "warning",
            score=score,
            findings=findings,
            recommendations=recommendations,
            metrics={"genre": genre, "track_count": track_count},
            reasoning=f"Analyzed mix conformance to {genre} conventions"
        )
    
    # ==================== EXTENDED GENRE ANALYSIS ====================
    
    def analyze_extended_genre(self, genre: str, metadata: Dict[str, Any]) -> AnalysisResult:
        """Analyze music for extended genres (Funk, Soul, Country, Latin, Reggae)"""
        extended_genres = ["funk", "soul", "country", "latin", "reggae"]
        genre_lower = genre.lower()
        
        if genre_lower not in extended_genres:
            return AnalysisResult(
                analysis_type="extended_genre",
                status="error",
                score=0,
                findings=["Genre not in extended genres list"],
                recommendations=[],
                metrics={"genre": genre},
                reasoning="Extended genre analysis requires funk, soul, country, latin, or reggae"
            )
        
        genre_specs = self.training_data.get_extended_genre_knowledge(genre)
        findings = []
        recommendations = []
        score = 50  # Starting baseline
        
        # Check tempo
        if "bpm" in metadata and "tempo_range" in genre_specs:
            bpm = metadata["bpm"]
            min_bpm, max_bpm = genre_specs["tempo_range"]
            if min_bpm <= bpm <= max_bpm:
                score += 15
                findings.append(f"✓ Tempo {bpm} BPM is ideal for {genre}")
            else:
                findings.append(f"⚠ Tempo {bpm} BPM is outside {genre} range ({min_bpm}-{max_bpm})")
                recommendations.append(f"Consider adjusting to {(min_bpm + max_bpm) // 2} BPM")
        
        # Genre-specific characteristics
        if genre_lower == "funk":
            if metadata.get("groove_tightness", 50) > 70:
                score += 10
                findings.append("✓ Tight groove detected - good for funk")
            if metadata.get("syncopation_level", 0) > 60:
                score += 10
                findings.append("✓ Strong syncopation - typical for funk")
        
        elif genre_lower == "soul":
            if metadata.get("vocal_emotion", 0) > 70:
                score += 15
                findings.append("✓ Emotional vocal quality detected")
            if metadata.get("harmonic_complexity", 0) > 50:
                score += 10
                findings.append("✓ Complex harmonies - soulful characteristic")
        
        elif genre_lower == "country":
            if metadata.get("storytelling_score", 0) > 60:
                score += 10
                findings.append("✓ Narrative quality detected")
            findings.append("✓ Acoustic elements recommended")
        
        elif genre_lower == "latin":
            if metadata.get("percussion_prominence", 0) > 70:
                score += 15
                findings.append("✓ Prominent percussion - essential for Latin")
            if metadata.get("clave_pattern_detected", False):
                score += 15
                findings.append("✓ Clave pattern detected")
        
        elif genre_lower == "reggae":
            if metadata.get("one_drop_rhythm", False):
                score += 20
                findings.append("✓ One-drop rhythm pattern detected")
            if metadata.get("laid_back_feel", False):
                score += 10
                findings.append("✓ Laid-back groove characteristic present")
        
        return AnalysisResult(
            analysis_type="extended_genre",
            status="good" if score >= 75 else "warning",
            score=min(100, score),
            findings=findings,
            recommendations=recommendations,
            metrics={"genre": genre, "metadata": metadata},
            reasoning=f"Analyzed composition for {genre} genre characteristics"
        )
    
    # ==================== HARMONIC ANALYSIS ====================
    
    def analyze_harmonic_progression(self, chord_sequence: List[str]) -> Dict[str, Any]:
        """Analyze harmonic progression for tension and release"""
        return self.training_data.analyze_harmonic_progression(chord_sequence)
    
    # ==================== MELODIC ANALYSIS ====================
    
    def analyze_melodic_contour(self, note_sequence: List[str]) -> Dict[str, Any]:
        """Analyze melodic shape and range"""
        return self.training_data.analyze_melodic_contour(note_sequence)
    
    # ==================== RHYTHM ANALYSIS ====================
    
    def identify_rhythm_pattern(self, pattern_name: str) -> Dict[str, Any]:
        """Identify rhythm pattern characteristics"""
        return self.training_data.identify_rhythm_pattern(pattern_name)
    
    def get_available_rhythm_patterns(self) -> List[str]:
        """Get all recognized rhythm patterns"""
        return self.training_data.list_rhythm_patterns()
    
    # ==================== MICROTONALITY SUPPORT ====================
    
    def get_microtone_analysis(self, microtone_type: str) -> Dict[str, Any]:
        """Get microtonal division analysis"""
        return self.training_data.get_microtone_info(microtone_type)
    
    def analyze_raga_notes(self, raga_name: str) -> Dict[str, Any]:
        """Analyze Indian raga note system"""
        return self.training_data.get_raga_note_variants("any_note")
    
    # ==================== SPECTRAL ANALYSIS ====================
    
    def analyze_harmonic_content(self) -> Dict[str, Any]:
        """Get harmonic series alignment info"""
        return self.training_data.get_harmonic_series_info()
    
    def analyze_timbre_brightness(self, brightness_level: str) -> Dict[str, Any]:
        """Analyze timbral brightness and spectral centroid"""
        return self.training_data.get_timbral_brightness_classification(brightness_level)
    
    # ==================== COMPOSITION ENGINE ====================
    
    def suggest_chord_progressions(self, genre: str, style: str = "simple") -> Dict[str, Any]:
        """Suggest chord progressions for composition"""
        progressions = self.training_data.suggest_chord_progressions(genre, style)
        return {
            "genre": genre,
            "style": style,
            "suggested_progressions": progressions,
            "count": len(progressions),
            "tips": "Use these as starting points for your composition"
        }
    
    def get_composition_rules(self) -> Dict[str, Any]:
        """Get melodic construction rules"""
        return self.training_data.get_melodic_construction_rules()
    
    # ==================== EAR TRAINING ENGINE ====================
    
    def create_ear_training_session(self, exercise_type: str, level: str = "beginner") -> Dict[str, Any]:
        """Create an ear training exercise"""
        exercise = self.training_data.get_ear_training_exercise(exercise_type, level)
        return {
            "exercise_type": exercise_type,
            "level": level,
            "exercise_data": exercise,
            "session_id": f"ear_training_{exercise_type}_{level}"
        }
    
    def get_available_exercises(self) -> List[str]:
        """Get all available ear training exercise types"""
        return self.training_data.list_ear_training_types()

    # ==================== NEW ADVANCED ANALYSIS METHODS ====================

    def detect_genre_realtime(self, audio_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Real-time genre detection from audio metadata"""
        candidates = self.training_data.detect_genre_candidates(audio_metadata)
        
        if not candidates:
            return {
                "detected_genre": "Unknown",
                "confidence": 0,
                "candidates": [],
                "recommendation": "Add more tempo and instrument metadata"
            }
        
        top_candidate = candidates[0]
        return {
            "detected_genre": top_candidate["genre"],
            "confidence": top_candidate["confidence"],
            "candidates": candidates[:5],  # Top 5
            "recommendation": f"Suggested genre: {top_candidate['genre']} ({top_candidate['confidence']:.0f}% confidence)"
        }

    def validate_chord_progression(self, chords: List[str]) -> Dict[str, Any]:
        """Validate chord progression against music theory"""
        validation = self.training_data.validate_harmonic_progression(chords)
        return {
            "progression": "-".join(chords),
            "valid": validation["valid"],
            "tension_map": validation["tension_map"],
            "theory_score": validation["score"],
            "warnings": validation["warnings"],
            "suggestions": validation["suggestions"]
        }

    def get_ear_training_visual_data(self, exercise_type: str, interval_or_chord: str) -> Dict[str, Any]:
        """Get visual feedback data for ear training"""
        if exercise_type == "interval":
            visual = self.training_data.get_ear_training_visual(interval_or_chord)
            return {
                "exercise_type": "interval",
                "target": interval_or_chord,
                "visual": visual.get("visual", "?"),
                "semitones": visual.get("semitones", 0),
                "ratio": visual.get("ratio", 1.0),
                "description": visual.get("description", ""),
                "feedback": "Watch the visual indicator as you listen"
            }
        
        return {
            "error": f"Unknown exercise type: {exercise_type}",
            "supported_types": ["interval", "chord", "rhythm"]
        }

    def get_production_workflow(self, stage: str = None) -> Dict[str, Any]:
        """Get production checklist for current stage"""
        checklist = self.training_data.get_production_checklist(stage)
        
        if stage:
            return {
                "stage": stage,
                "tasks": checklist.get("tasks", []),
                "estimated_time": f"Varies by detail level",
                "checklist_items": [
                    {"task": task, "completed": False, "notes": ""}
                    for task in checklist.get("tasks", [])
                ]
            }
        
        stages = []
        for stage_name, stage_data in checklist.items():
            stages.append({
                "stage": stage_name,
                "task_count": len(stage_data.get("tasks", [])),
                "tasks_preview": stage_data.get("tasks", [])[:3]
            })
        
        return {
            "all_stages": stages,
            "total_tasks": sum(len(s.get("tasks", [])) for s in checklist.values())
        }

    def connect_delay_sync_to_track(self, bpm: float, note_division: str = "quarter") -> Dict[str, Any]:
        """Calculate delay times for tempo-locked effects"""
        note_divisions = {
            "whole": 4,
            "half": 2,
            "quarter": 1,
            "eighth": 0.5,
            "sixteenth": 0.25,
            "triplet_quarter": 2/3,
            "triplet_eighth": 1/3,
            "dotted_quarter": 1.5,
            "dotted_eighth": 0.75
        }
        
        if note_division not in note_divisions:
            return {"error": f"Unknown note division: {note_division}"}
        
        beat_value = note_divisions[note_division]
        delay_ms = (60000 / bpm) * beat_value
        
        return {
            "bpm": bpm,
            "note_division": note_division,
            "delay_ms": round(delay_ms, 2),
            "delay_seconds": round(delay_ms / 1000, 3),
            "synced_to": f"{note_division} note at {bpm} BPM"
        }

    def get_instrument_info(self, category: str, instrument: str) -> Dict[str, Any]:
        """Get detailed instrument information for mixing"""
        info = self.training_data.get_instrument_info(category, instrument)
        return {
            "instrument": instrument,
            "category": category,
            "frequency_range": info.get("frequency_range"),
            "typical_frequencies": info.get("typical_frequencies"),
            "characteristics": info.get("characteristics"),
            "processing_chain": info.get("processing"),
            "mixing_tips": info.get("mixing_tips")
        }

    def suggest_mixing_chain(self, category: str, instrument: str) -> Dict[str, Any]:
        """Suggest processing chain for instrument"""
        chain = self.training_data.suggest_processing_chain(category, instrument)
        return {
            "instrument": instrument,
            "suggested_chain": chain,
            "order_important": True,
            "notes": "Follow this order for best results"
        }

    def get_all_instrument_categories(self) -> Dict[str, Any]:
        """Get all available instrument categories"""
        categories = self.training_data.get_all_instruments()
        return {
            "categories": list(categories.keys()),
            "instruments_by_category": categories,
            "total_instruments": sum(len(inst) for inst in categories.values())
        }

    def find_instruments_by_frequency(self, frequency_hz: int, tolerance_percent: float = 20) -> Dict[str, Any]:
        """Find instruments that have typical frequencies near given frequency"""
        matching_instruments = []
        tolerance_range = frequency_hz * (tolerance_percent / 100)
        
        all_instruments = self.training_data.get_all_instruments()
        for category, instruments in all_instruments.items():
            for instrument in instruments:
                typical_freqs = self.training_data.get_typical_frequencies(category, instrument)
                for freq in typical_freqs:
                    if abs(freq - frequency_hz) <= tolerance_range:
                        matching_instruments.append({
                            "instrument": instrument,
                            "category": category,
                            "frequency": freq,
                            "deviation_hz": freq - frequency_hz
                        })
        
        return {
            "target_frequency": frequency_hz,
            "tolerance_percent": tolerance_percent,
            "matching_instruments": sorted(matching_instruments, key=lambda x: abs(x["deviation_hz"]))
        }



def analyze_session(analysis_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Main analysis function"""
    result = None
    
    if analysis_type == "gain_staging":
        result = analyzer.analyze_gain_staging(data.get("track_metrics", []))
    elif analysis_type == "mixing":
        result = analyzer.analyze_mixing(
            data.get("track_metrics", []),
            data.get("frequency_data")
        )
    elif analysis_type == "routing":
        result = analyzer.analyze_routing(data.get("tracks", []))
    elif analysis_type == "session":
        result = analyzer.analyze_session_health(data)
    elif analysis_type == "mastering":
        result = analyzer.analyze_mastering_readiness(data)
    elif analysis_type == "creative":
        result = analyzer.suggest_creative_improvements(data)
    
    if result:
        return asdict(result)
    
    return {
        "analysis_type": analysis_type,
        "status": "error",
        "score": 0,
        "findings": ["Unknown analysis type"],
        "recommendations": [],
        "metrics": {},
        "reasoning": "Unable to perform analysis"
    }
