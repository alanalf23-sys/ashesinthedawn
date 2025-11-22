import { useRef, useState } from "react";

/**
 * 🎚️ Pro DAW Timeline with Advanced Snapping
 * - Zoom-based quantization (1/1 → 1/32)
 * - Smooth visual snapping feedback
 * - Loop and playhead interactions
 * - Styled ruler and timeline
 */

export default function ProTimeline() {
  const [loopRange, setLoopRange] = useState<[number, number]>([5, 10]);
  const [zoom, setZoom] = useState(10);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [dragging, setDragging] = useState<null | "start" | "end">(null);
  const [snappedTime, setSnappedTime] = useState<number | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "success">(
    "idle"
  );
  const timelineRef = useRef<HTMLDivElement>(null);

  // Beat snapping divisions per zoom level
  const getDivision = (z: number) => {
    if (z > 40) return 1 / 32;
    if (z > 25) return 1 / 16;
    if (z > 15) return 1 / 8;
    if (z > 10) return 1 / 4;
    if (z > 5) return 1 / 2;
    return 1;
  };

  // Format seconds to min:sec:ms
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${m}:${sec.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    setZoom((z) => Math.min(60, Math.max(2, z - delta)));
  };

  // Handle drag & snap logic
  const handleMouseDown = (marker: "start" | "end") => setDragging(marker);
  const handleMouseUp = () => {
    if (snappedTime) setSnappedTime(null);
    setDragging(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const seconds = (e.clientX - rect.left) / zoom;
    const division = getDivision(zoom);
    const snapped = Math.round(seconds / division) * division;

    if (dragging) {
      setSnappedTime(snapped);
      setLoopRange((prev) => {
        const newRange: [number, number] = [...prev];
        if (dragging === "start")
          newRange[0] = Math.min(snapped, prev[1] - division);
        if (dragging === "end")
          newRange[1] = Math.max(snapped, prev[0] + division);
        return newRange;
      });
      setSyncState("syncing");
      fetch(`/transport/loop?start=${loopRange[0]}&end=${loopRange[1]}`, {
        method: "POST",
      })
        .then(() => setSyncState("success"))
        .then(() => setTimeout(() => setSyncState("idle"), 500));
    } else {
      setHoverTime(snapped);
    }
  };

  const [loopStart, loopEnd] = loopRange.map((t) => t * zoom);

  // Create ticks for ruler
  const totalWidth = 1600;
  const totalSeconds = totalWidth / zoom;
  const division = getDivision(zoom);
  const ticks = [];
  for (let i = 0; i < totalSeconds; i += division) ticks.push(i);

  return (
    <div
      ref={timelineRef}
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className="relative h-36 bg-gradient-to-b from-slate-900 via-slate-950 to-black border-t border-slate-800 select-none overflow-hidden rounded-lg shadow-2xl"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        {ticks.map((t, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l border-slate-700/30"
            style={{ left: `${t * zoom}px` }}
          />
        ))}
      </div>

      {/* Ruler */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800/50 backdrop-blur-md border-b border-slate-700 flex items-end text-[10px] text-slate-300 font-mono">
        {ticks.map((t, i) => (
          <div key={i} className="relative" style={{ left: `${t * zoom}px` }}>
            <div className="absolute bottom-0 w-[1px] h-3 bg-slate-500/50" />
            {i % Math.round(1 / division) === 0 && (
              <div className="absolute bottom-3 left-1">{formatTime(t)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Loop region */}
      <div
        className="absolute top-6 bottom-0 bg-gradient-to-r from-cyan-500/20 via-cyan-400/10 to-cyan-500/20 rounded shadow-[0_0_25px_5px_rgba(56,189,248,0.15)]"
        style={{ left: loopStart, width: loopEnd - loopStart }}
      />

      {/* Loop markers with snap flash */}
      {[
        { pos: loopStart, label: formatTime(loopRange[0]) },
        { pos: loopEnd, label: formatTime(loopRange[1]) },
      ].map((m, idx) => (
        <div key={idx}>
          <div
            onMouseDown={() => handleMouseDown(idx === 0 ? "start" : "end")}
            className="absolute top-6 bottom-0 w-[6px] bg-gradient-to-b from-cyan-400 to-cyan-600 cursor-ew-resize shadow-[0_0_10px_3px_rgba(56,189,248,0.6)] rounded-sm transition-transform duration-200"
            style={{
              left: m.pos - 3,
              transform: snappedTime ? "scale(1.15)" : "scale(1)",
            }}
          />
          <div
            className="absolute text-[10px] text-cyan-300 bg-slate-900/70 px-1 py-0.5 rounded-md border border-cyan-500/30 shadow-md"
            style={{ left: m.pos - 12, top: 8 }}
          >
            {m.label}
          </div>
        </div>
      ))}

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_10px_3px_rgba(56,189,248,0.8)] transition-transform duration-[30ms] ease-linear"
        style={{ transform: "translateX(0px)" }}
      />

      {/* Hover time tooltip */}
      {hoverTime && (
        <div
          className="absolute text-[11px] text-white bg-slate-900/90 px-2 py-1 rounded-md border border-cyan-500/40 shadow-lg pointer-events-none opacity-100 scale-100 transition-all duration-200"
          style={{ left: hoverTime * zoom + 5, top: 20 }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Sync indicator */}
      {syncState !== "idle" && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-lg shadow-[0_0_10px_2px_rgba(56,189,248,0.6)] transition-all duration-400"
          style={{
            opacity: syncState === "syncing" ? 0.7 : 0,
            backgroundColor: syncState === "success" ? "#22c55e" : "#38bdf8",
          }}
        />
      )}
    </div>
  );
}
