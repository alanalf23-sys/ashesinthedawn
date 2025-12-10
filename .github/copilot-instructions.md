CoreLogic Studio – Visual Studio / Copilot Instruction Manifest
Version 7.0.0 – Sovereign DAW Engine Build
Status: Phase 7 Complete (Configuration Core, UI Stabilization, Telemetry Pipeline) 

COMPREHENSIVE_AUDIT_FINDINGS

Copilot Operating Rules (Non-Negotiable)

When assisting in this repo (CoreLogic Studio / ashesinthedawn), Copilot must obey the following rules at all times:

0.1 Real code only

Generate only real, compilable/interpret-able code in the actual project languages:

TypeScript/React for frontend (Vite/React 18).

Python (FastAPI/uvicorn, daw_core) for backend and DSP.

Do not generate pseudocode, fake APIs, “TODO” blocks, or generic placeholders.

Do not invent functions, modules, or endpoints that do not exist, unless you are explicitly creating them as part of a specific, well-described change.

0.2 Preserve existing working code

Never delete or rewrite existing working code unless the user request explicitly targets that code.

Prefer additive, backward-compatible changes:

Add new functions, helpers, or adapters instead of rewriting stable modules.

When refactoring, preserve observable behavior and public APIs.

If an existing function is used by multiple call sites, modify it carefully and keep signatures stable unless explicitly asked to change them.

0.3 Respect established architecture and contracts

All changes must conform to the existing layered architecture:

UI/Intent layer

Context/Truth layer

Engine/Execution layer

DSP Authority layer (Python daw_core)

Telemetry layer (meters, spectrum, analysis)

Never cross these boundaries with direct imports, state access, or hidden coupling.

0.4 Integration over reinvention

Use the existing modules, types, and endpoints:

DAWContext, AudioEngine, dspBridge, daw_core.api, etc.

When adding new functionality, wire it into current systems instead of creating parallel or duplicate logic.

Prefer to fix integration gaps (e.g., endpoint routing) instead of building new, redundant stacks.

0.5 Style and conventions

Follow the project’s existing style:

TypeScript: strict typing, no implicit any, React 18 function components, hooks-based state management.

Python: FastAPI patterns, pydantic models, pytest for tests, daw_core conventions for DSP.

Use existing types from src/types/index.ts and existing config patterns from src/config/appConfig.ts.

Keep formulas and DSP logic faithful to daw_core; do not approximate or change equations unless explicitly requested.

System Identity

CoreLogic Studio is a sovereign dual-stack audio system modeled after the Codette architecture:

The UI governs intention.

The Context governs truth.

The Engine governs execution.

The DSP Core governs authority.

Telemetry governs verification.

Design principles inherited from Codette and the Nexus Signal Engine:

Determinism – state transitions must be explicit, reproducible, and auditable.

Modular Isolation – no cross-contamination between UI, context, engine, and DSP.

Contracts Over Guesswork – each subsystem exposes a narrow interface, never internal details.

Verifiable State – every change in playback, routing, gain, metering, or automation has a traceable cause.

Defensive Design – every external call is guarded; every internal assumption is validated.

Copilot must preserve and strengthen these properties in all generated code.

High-Level Architecture (Codette Model)

CoreLogic Studio uses a layered hierarchy:

Intent Layer → UI Components (React)

Truth Layer → DAWContext (state authority)

Execution Layer → AudioEngine (Web Audio)

Authority Layer → Python DSP Core (daw_core/)

Telemetry Layer → VUMeter system, spectrum analyzers, level meters

Rules for Copilot:

Each layer has exactly one responsibility.

No layer may reach across boundaries.

No layer may mutate another layer’s state directly.

All changes that span layers must go through defined contracts (context actions, engine methods, API requests).

Signal Chain (Single Source of Truth)

All audio flow must follow the Sovereign Signal Chain:

User Action
→ UI Intent
→ DAWContext (Truth Engine)
→ DAW Engine (Execution Engine)
→ Web Audio Graph
→ Output Bus / Telemetry Tap
→ VU Meter / Spectrum / Level Meter
→ UI Feedback

Copilot must:

Ensure every mutation to playback, gain, pan, routing, waveform displays, or track structure is triggered from DAWContext, not directly from UI components.

Ensure the Engine is only commanded via context-approved calls.

Agent-Style Modularity

Treat each subsystem as an agent, isolated and responsible only for its domain.

4.1 UI Agent (Intent)

UI responsibilities:

Pure presentation; no business logic.

No DSP or Web Audio handling.

Read-only access to state via DAWContext hooks (for example, useDAW()).

Emit events upward (to context/actions), never sideways between components.

Copilot must not:

Create AudioContexts in the UI.

Store engine references in components.

Add side-effectful logic in React render paths or hooks beyond dispatching context actions.

4.2 Context Agent (Truth)

DAWContext is the state orchestrator.

Responsibilities:

Own the entire DAW state graph.

Validate all state transitions.

Govern playback lifecycle (play, pause, stop, seek).

Manage track registry and cross-track logic (solo, mute, routing).

Synchronize UI with engine-level changes via well-defined effects.

Copilot must:

Implement state changes via pure, typed transitions (reducers or explicit setters).

Gate all calls to AudioEngine and backend APIs through DAWContext or dedicated service wrappers.

Avoid inline Web Audio or DSP logic in context.

4.3 Engine Agent (Execution)

AudioEngine is a sovereign execution module.

Responsibilities:

Maintain its own Web Audio graph and own the AudioContext singleton.

Execute deterministic commands:

Playback

Stop

Seek

Gain staging (dB → linear conversion)

Panning

Waveform caching

Level extraction for telemetry

Copilot must:

Expose only stable, deterministic methods (play, stop, setGain, seek, getAudioLevels, etc.).

Never modify UI or context state directly.

Never use randomness or time-dependent branching that changes outputs for the same inputs.

4.4 DSP Authority Agent (Python daw_core)

The Python DSP backend (daw_core) is the final authority for professional audio effects.

Responsibilities:

19 DSP effects implemented as pure functions.

Automation engine (curves, LFOs, envelopes).

Metering primitives and analysis utilities.

197/197 tests passing; numerical stability required.

Copilot must:

Call into existing daw_core effects and automation endpoints.

Preserve existing formulas and algorithms; do not approximate or “simplify” DSP logic.

Keep daw_core free of UI logic, playback lifecycle, or project state.

4.5 Telemetry Agent (Meters)

Telemetry acts as a passive observer.

Responsibilities:

VU, RMS, peak, spectrum, correlation, and other metering.

Frame-accurate visual ballistics at 60 FPS.

Zero impact on the audio graph or routing.

Copilot must:

Use engine-level taps for telemetry data.

Never mutate state or control playback from telemetry code.

Keep JSFX formulas and existing meter calculations intact.

Core Contracts

5.1 UI Contract

UI must:

Send state change requests upward (to context/actions) only.

Render from DAWContext-derived state.

Never call AudioEngine directly.

Never mutate global state or create singletons.

UI must not:

Create or manage AudioContexts.

Access raw Web Audio nodes.

Perform DSP computations.

5.2 Context Contract (Truth Layer)

DAWContext must:

Hold the full DAW state (tracks, transport, routing, effect chains, automation).

Expose typed state change methods (actions, reducers).

Validate arguments before mutation.

Gate all AudioEngine and DSP calls.

Maintain mapping: active tracks → engine state / buffer handles.

DAWContext must not:

Perform DSP.

Use Web Audio primitives directly.

Depend on internal engine or daw_core implementation details.

5.3 Engine Contract (Execution Layer)

AudioEngine must:

Expose deterministic commands: play, stop, seek, setTrackVolume, setPan, getAudioLevels, etc.

Maintain its own Web Audio graph and AudioContext singleton.

Use dB→linear conversion internally; all external gain must be dB.

Provide telemetry taps (methods to read levels/spectrum safely).

Cache waveform computation and reuse buffers.

AudioEngine must not:

Modify UI or context state.

Reach into DAWContext internals.

Store track metadata beyond what is required for execution.

5.4 DSP Authority Contract (Python)

daw_core must:

Provide verified DSP algorithms with complete pytest coverage.

Treat each effect as a pure function: input → output.

Expose a stable API for effects, automation, and analysis.

daw_core must not:

Know about React, TypeScript, or frontend state.

Manage playback, transport, or UI flows.

5.5 Telemetry Contract

Telemetry must:

Only observe; never control.

Use defined engine-level taps or backend metering endpoints.

Maintain 60 FPS rendering and accurate ballistics.

Telemetry must not:

Change routing, gain, or playback.

Affect timing or scheduling in the audio graph.

Context-First Data Flow

The control loop must be:

Intent → Truth → Execution → Telemetry → Feedback

Where:

UI expresses intent.

Context validates and transforms intent into commands.

Engine executes commands.

Telemetry records the result.

UI re-renders based on updated truth.

Copilot must always route new functionality into this loop instead of bypassing it.

Sovereign DAW Engine Rules

AudioEngine is treated as a NexusEngine-equivalent sovereign module.

Key properties:

Exactly one AudioContext.

Immutable graph boundaries defined by Engine, not UI.

Deterministic gain staging and routing.

Declarative playback model: inputs and commands fully define behaviour.

No implicit operations or hidden state.

No cross-layer memory leaks (no storing UI/Context references).

Engine-level responsibilities (for Copilot to respect):

loadAudioFile: decode, cache buffer, generate waveform.

playAudio: create nodes, connect routing, apply gain/pan, start.

stopAudio: stop and clean up nodes.

seek: rebuild per-track sources at the new offset.

setTrackVolume: apply gain in dB.

getAudioLevels: return telemetry data only.

VU Meter Telemetry Pipeline

The VU pipeline must remain:

useVUMeterData: level extraction.

VUMeterGfx: rendering engine (canvas, 60 FPS).

VUMeterPanel: presentation layer.

Copilot must:

Keep VU/metering components read-only with respect to audio state.

Maintain JSFX formulas and timing behaviour.

Ensure any optimizations preserve visual and numerical accuracy.

Track Model (Truth Schema)

Track shape is authoritative:

Track {
id: string
name: string
type: "audio" | "instrument" | "midi" | "aux" | "vca" | "master"
routing: string

inputGain: number // pre-fader (dB)
volume: number // post-fader (dB)
pan: number // -1 to +1

muted: boolean
soloed: boolean
armed: boolean
stereoWidth: number
phaseFlip: boolean

inserts: string[]
sends: string[]

automationMode?: "off" | "read" | "write" | "touch"

color: string
}

Copilot must:

Use this as the single source of truth for track-related state.

Extend via separate structures rather than modifying this core shape unless explicitly asked.

Deterministic Playback Model

togglePlay:

State authority: DAWContext.

Execution authority: AudioEngine.

Looping handled in Engine via source.loop = true or equivalent.

seek:

Must rebuild nodes and treat each seek as a new transaction.

Must not mutate state outside the Truth layer.

Gain handling:

All UI and context-level gain values are in dB.

Conversion to linear occurs only inside AudioEngine/DSP.

Defensive Rules

Absolute “do not” list for Copilot:

No logic in React components beyond UI concerns.

No direct engine calls from UI.

No additional AudioContexts.

No linear gain values passed into Engine/DSP.

No randomness in Engine.

No DSP executed in JS when DSP belongs in daw_core.

No reading configuration from outside appConfig or defined env accessors.

No cross-layer mutation or sneaky coupling.

Any violation is an architectural fault and should be avoided or corrected.

Performance Governance

Targets that Copilot must respect:

Waveform generation: O(n), cached.

Track selection/state reads: O(1).

State updates: O(1) amortized.

Telemetry rendering: 60 FPS.

TypeScript: 0 errors (tsc must pass).

Python: all tests passing (197/197 daw_core tests).

Development Procedures For Copilot

When proposing or generating code:

Modify the Truth layer (DAWContext) first when adding new behaviours.

Only adjust the Execution layer (AudioEngine or backend) when needed to support new, validated context actions.

Write or update contracts and types before implementing features.

Preserve TypeScript and Python test cleanliness; do not introduce new errors.

Preserve determinism in Engine and DSP.

Ensure telemetry output remains accurate and non-invasive.

Document new contracts and endpoints where appropriate (docstrings, comments that match project style).

File Reading Order For Copilot Context

Before generating non-trivial changes, Copilot should mentally align with these files:

src/contexts/DAWContext.tsx – truth/state authority.

src/lib/audioEngine.ts – execution engine.

src/lib/dspBridge.ts – bridge between frontend and backend DSP.

src/types/index.ts – truth schema and shared types.

src/config/appConfig.ts – environment/config governance.

src/components/Mixer.tsx – canonical UI→context pattern.

src/components/VUMeterGfx.tsx – telemetry engine.

daw_core/api.py – DSP and metering endpoints.

codette_server_unified.py – unified backend server and routing.

Summary

CoreLogic Studio enforces Codette’s doctrine in DAW form:

Truth belongs to the Context.

Execution belongs to the Engine.

Authority belongs to DSP.

Intent belongs to UI.

Verification belongs to Telemetry.

Copilot’s role is to extend and refine this system without breaking these guarantees, without inventing placeholders or pseudocode, and without deleting working code. All new code must be real, deterministic, testable, and aligned with this architecture.