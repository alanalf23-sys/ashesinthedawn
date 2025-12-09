# Codette File Structure Documentation

**Last Updated**: December 2025  
**Status**: ? Cleaned & Organized  
**Purpose**: Single source of truth for Codette file locations and purposes

---

## ?? Active Production Files

### Primary Implementation
- **`Codette/codette_new.py`** ? ACTIVE
  - **Purpose**: Main Codette AI implementation with ML capabilities
  - **Features**: Sentiment analysis (VADER), concept extraction (NLTK), DAW knowledge base
  - **Used By**: `codette_server_unified.py`
  - **Status**: Production ready, fully functional
  - **Lines**: ~300 lines of deterministic ML-powered code

### Server Entry Point
- **`codette_server_unified.py`** ? ACTIVE
  - **Purpose**: Unified FastAPI server for CoreLogic Studio DAW integration
  - **Features**: REST API, WebSocket support, DSP effects, caching system
  - **Endpoints**: `/codette/chat`, `/api/codette/*`, `/ws`, `/api/effects/*`
  - **Port**: 8000 (default)
  - **Status**: Production ready, all features implemented
  - **Lines**: ~2000+ lines with comprehensive API

### Frontend Integration
- **`src/hooks/useCodette.ts`** ? ACTIVE
  - **Purpose**: React hook for Codette AI integration
  - **Features**: Chat, analysis, suggestions, WebSocket, training, DSP
  - **Status**: Production ready, 11 perspectives implemented
  
- **`src/lib/codetteAIEngine.ts`** ? ACTIVE
  - **Purpose**: TypeScript client for Codette API
  - **Features**: 10 DAW abilities, training data integration
  - **Status**: Production ready

- **`src/components/CodetteAdvancedTools.tsx`** ? ACTIVE
  - **Purpose**: Advanced tools UI (delay sync, genre detection, ear training, etc.)
  - **Features**: 5-tab interface with real API integration
  - **Status**: Production ready

### Supporting Modules
- **`Codette/src/codette_capabilities.py`** ? ACTIVE (if available)
  - **Purpose**: Quantum consciousness, perspectives, cognition cocoons
  - **Status**: Optional enhancement layer

- **`Codette/src/codette_imports.py`** ? ACTIVE
  - **Purpose**: Centralized import management
  - **Status**: Needs cleanup (see cleanup tasks below)

---

## ??? Legacy Files (Archive Candidates)

### Legacy Implementations
- **`Codette/codette_advanced.py`** ?? LEGACY
  - **Purpose**: Older advanced implementation
  - **Issue**: Superseded by `codette_new.py` with integrated features
  - **Action**: Move to `Codette/_archive/v1_implementations/`
  
- **`Codette/codette_hybrid.py`** ?? LEGACY
  - **Purpose**: Hybrid ML/rule-based system experiment
  - **Issue**: Features integrated into `codette_new.py`
  - **Action**: Move to `Codette/_archive/v1_implementations/`
  
- **`Codette/src/codette.py`** ?? LEGACY
  - **Variants**: `.backup`, `.bak`, original
  - **Purpose**: Original implementation before ML upgrades
  - **Action**: Move all variants to `Codette/_archive/v0_original/`

### Legacy Server Files
- **`codette_server.py`** ?? LEGACY
  - **Purpose**: Original server implementation
  - **Issue**: Missing features now in `codette_server_unified.py`
  - **Action**: Move to `_archive/servers/v1/`
  
- **`codette_server_production.py`** ?? LEGACY
  - **Purpose**: Production-optimized server
  - **Issue**: Features merged into `codette_server_unified.py`
  - **Action**: Move to `_archive/servers/v2/`

### Legacy Test Files
- **`test_codette_hybrid_integration.py`** ?? LEGACY
  - **Purpose**: Tests for hybrid system
  - **Issue**: Tests obsolete with new implementation
  - **Action**: Move to `_archive/tests/`

### Duplicate Interface Files
- **`Codette/src/codette_interface.py`** ?? LEGACY
  - **Purpose**: Old interface layer
  - **Issue**: Superseded by server unified API
  - **Action**: Move to `_archive/interfaces/`
  
- **`Codette/codette_interface.py`** ?? DUPLICATE
  - **Issue**: Duplicate of above
  - **Action**: Move to `_archive/interfaces/`

### Build Artifacts
- **`codette_hybrid.spec`** ?? BUILD ARTIFACT
  - **Purpose**: PyInstaller spec for hybrid build
  - **Action**: Move to `_archive/build_specs/`

---

## ?? Recommended Directory Structure

```
ashesinthedawn/
??? Codette/
?   ??? codette_new.py                    ? PRIMARY IMPLEMENTATION
?   ??? src/
?   ?   ??? codette_capabilities.py       ? ACTIVE (optional)
?   ?   ??? codette_imports.py            ? ACTIVE (needs cleanup)
?   ?   ??? codette_server.py             ??  LEGACY (move to archive)
?   ??? tests/
?   ?   ??? unit/
?   ?       ??? test_codette.py           ? ACTIVE TESTS
?   ??? _archive/                         ?? NEW: Archive directory
?       ??? v0_original/                  ?? Original codette.py + backups
?       ??? v1_implementations/           ?? Advanced/hybrid versions
?       ??? servers/                      ?? Legacy server files
?       ?   ??? v1/                       ?? codette_server.py
?       ?   ??? v2/                       ?? codette_server_production.py
?       ??? interfaces/                   ?? Old interface layers
?       ??? tests/                        ?? Obsolete test files
?       ??? build_specs/                  ?? Old build configurations
??? codette_server_unified.py             ? UNIFIED SERVER (primary)
??? src/
?   ??? hooks/
?   ?   ??? useCodette.ts                 ? React hook (active)
?   ?   ??? useCodetteDAWIntegration.ts   ? DAW integration (active)
?   ??? lib/
?   ?   ??? codetteAIEngine.ts            ? TypeScript client (active)
?   ?   ??? codetteApi.ts                 ? API wrapper (active)
?   ??? components/
?       ??? CodetteAdvancedTools.tsx      ? Advanced UI (active)
??? docs/
?   ??? CODETTE_COMPLETE_GUIDE.md         ? User documentation
?   ??? CODETTE_ADVANCED_FEATURES_COMPLETE.md  ? Advanced features docs
?   ??? CODETTE_FILE_STRUCTURE.md         ? THIS FILE
??? _archive/                             ?? Root-level archive
    ??? servers/                          ?? Additional server backups if needed
```

---

## ?? Active Import Paths

### Python Backend
```python
# Primary implementation import
from Codette.codette_new import Codette

# Server imports Codette like this:
codette_path = Path(__file__).parent / "Codette"
sys.path.insert(0, str(codette_path))
from codette_new import Codette as CodetteCore
```

### Frontend Integration
```typescript
// React hook
import { useCodette } from '../hooks/useCodette';

// API client
import codetteApi from '../lib/codetteApi';

// AI Engine
import { getCodetteAIEngine } from '../lib/codetteAIEngine';
```

---

## ?? Known Issues & Cleanup Tasks

### Issue 1: Multiple Import Attempts
**Problem**: `codette_server_unified.py` tries to import from multiple locations:
- `codette_hybrid` ? `codette_new` ? fallback
- `codette_capabilities` ? optional
- Multiple sys.path insertions

**Solution**:
```python
# Simplified import (lines 100-130 of unified server)
codette_path = Path(__file__).parent / "Codette"
if codette_path.exists():
    sys.path.insert(0, str(codette_path))

from codette_new import Codette as CodetteCore
CODETTE_CORE_AVAILABLE = True
```

### Issue 2: Duplicate Interface Definitions
**Problem**: Multiple `codette_interface.py` files
**Solution**: Use unified server API directly, remove interface layers

### Issue 3: Obsolete Capabilities Check
**Problem**: Server checks for `codette_capabilities.py` but doesn't strictly require it
**Solution**: Make capabilities fully optional with graceful fallback

---

## ?? Migration Plan

### Phase 1: Create Archive Structure ?
```bash
mkdir -p Codette/_archive/v0_original
mkdir -p Codette/_archive/v1_implementations
mkdir -p Codette/_archive/servers/v1
mkdir -p Codette/_archive/servers/v2
mkdir -p Codette/_archive/interfaces
mkdir -p Codette/_archive/tests
mkdir -p Codette/_archive/build_specs
```

### Phase 2: Move Legacy Files ??
```bash
# Original implementations
git mv Codette/src/codette.py Codette/_archive/v0_original/
git mv Codette/src/codette.py.backup Codette/_archive/v0_original/
git mv Codette/src/codette.py.bak Codette/_archive/v0_original/

# Advanced implementations
git mv Codette/codette_advanced.py Codette/_archive/v1_implementations/
git mv Codette/codette_hybrid.py Codette/_archive/v1_implementations/

# Legacy servers
git mv Codette/src/codette_server.py Codette/_archive/servers/v1/
git mv codette_server.py Codette/_archive/servers/v1/
git mv codette_server_production.py Codette/_archive/servers/v2/

# Interfaces
git mv Codette/codette_interface.py Codette/_archive/interfaces/
git mv Codette/src/codette_interface.py Codette/_archive/interfaces/

# Tests
git mv test_codette_hybrid_integration.py Codette/_archive/tests/

# Build specs
git mv codette_hybrid.spec Codette/_archive/build_specs/
```

### Phase 3: Clean Up Imports ?
Update `codette_server_unified.py` to use single import path:
- Remove hybrid fallback logic
- Remove production server fallback
- Simplify to `codette_new.py` only

### Phase 4: Update Documentation ?
- Update all docs to reference `codette_new.py` as primary
- Remove references to legacy files
- Update quickstart guides

### Phase 5: Validate ?
```bash
# Test imports
python -c "from Codette.codette_new import Codette; print('? Import successful')"

# Test server startup
python codette_server_unified.py

# Test frontend integration
cd src && npm run typecheck
```

---

## ?? File Statistics

### Active Files
- **Python**: 4 files (~2500 lines total)
  - `codette_new.py`: ~300 lines
  - `codette_server_unified.py`: ~2000 lines
  - `codette_capabilities.py`: ~200 lines (optional)
  
- **TypeScript**: 6 files (~1500 lines total)
  - `useCodette.ts`: ~500 lines
  - `codetteAIEngine.ts`: ~400 lines
  - `CodetteAdvancedTools.tsx`: ~350 lines
  - Others: ~250 lines

### Legacy Files (To Archive)
- **Python**: 8+ files (~3000 lines)
- **Build**: 2 spec files
- **Tests**: 3 obsolete test files

---

## ?? Benefits of Cleanup

1. **Single Source of Truth**
   - One primary implementation (`codette_new.py`)
   - One server entry point (`codette_server_unified.py`)
   - Clear import paths

2. **Faster Development**
   - No confusion about which file to edit
   - Reduced cognitive load
   - Clearer git diffs

3. **Better Performance**
   - Fewer import attempts
   - No fallback chains
   - Reduced startup time

4. **Easier Maintenance**
   - Archive preserves history
   - Active files clearly marked
   - Documentation always up-to-date

---

## ?? Troubleshooting

### Issue: "Codette not found"
**Check**:
1. Is `Codette/codette_new.py` present?
2. Is Python path correct?
3. Run: `python -c "import sys; print(sys.path)"`

**Fix**:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "Codette"))
from codette_new import Codette
```

### Issue: "Multiple perspectives not working"
**Check**:
1. Is `codette_capabilities.py` available?
2. Server logs show "Codette capabilities module loaded"?
3. Fallback to mock perspectives if not found

**Fix**: Capabilities are optional - mock perspectives always available

### Issue: "Import errors on server startup"
**Check**:
1. Virtual environment activated?
2. Dependencies installed? `pip install -r requirements.txt`
3. Path conflicts? (remove old sys.path entries)

---

## ?? Changelog

### December 2025 - Major Cleanup
- ? Created comprehensive file structure documentation
- ? Identified active vs legacy files
- ? Designed archive directory structure
- ? Documented migration plan
- ? Established single source of truth

### November 2025 - Advanced Features
- ? Implemented delay sync, genre detection, ear training
- ? Created `CodetteAdvancedTools.tsx` component
- ? Integrated real Codette API calls

### October 2025 - ML Integration
- ? Enhanced `codette_new.py` with VADER sentiment analysis
- ? Added NLTK concept extraction
- ? Integrated DAW knowledge base

---

## ?? Related Documentation

- [CODETTE_COMPLETE_GUIDE.md](./CODETTE_COMPLETE_GUIDE.md) - User guide
- [CODETTE_ADVANCED_FEATURES_COMPLETE.md](./CODETTE_ADVANCED_FEATURES_COMPLETE.md) - Advanced tools
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development workflow
- [README.md](../README.md) - Project overview

---

**Status**: ?? Ready for cleanup implementation  
**Next Steps**: Execute Phase 2 (Move Legacy Files)  
**Owner**: Codette Team  
**Contact**: [Support channels]
