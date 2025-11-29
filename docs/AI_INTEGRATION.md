# AI Codette Integration Guide

CoreLogic Studio is now fully prepared for AI integration with the **AI Codette** module. This guide covers setup, features, and customization.

## Quick Start

### 1. Configure API Key

Add your Anthropic API key to `.env.local`:

```env
REACT_APP_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_AI_MODEL=claude-3-5-sonnet-20241022
REACT_APP_AI_ENABLED=true
```

**Get your API key:** https://console.anthropic.com

### 2. Access AI Features

1. Open CoreLogic Studio
2. Click the **Zap (⚡)** icon in the right sidebar
3. Select your analysis type:
   - **Health** - Session headroom & clipping detection
   - **Mixing** - Recommended effect chains
   - **Routing** - Intelligent bus suggestions

## Features

### Session Health Analysis
- Detects clipping and low headroom
- Analyzes track count and levels
- Provides actionable recommendations
- **Confidence:** 95%

### Mixing Chain Suggestions
- Track-type specific recommendations
- Pre-configured signal chains:
  - **Vocals:** Gate → EQ → Compressor → De-Esser → Reverb → Delay
  - **Drums:** Gate → EQ → Compressor → Saturation → Reverb
  - **Bass:** EQ → Compressor → Saturation → Utility
  - **Guitar:** Gate → EQ → Compressor → Saturation → Reverb → Delay
  - **Synth:** EQ → Reverb → Delay → Utility

### Routing Suggestions
- Creates optimal bus structures
- Considers track types and count
- Recommends effect sends for large sessions
- Configurable for different genres

## Architecture

### AI Service Module (`src/lib/aiService.ts`)

**Core Class:** `AIService`
- Singleton pattern via `getAIService()`
- Ready for Claude API integration
- Feature flags support

**Key Methods:**
```typescript
// Check if AI is available
isAvailable(): boolean

// Analyze session health
analyzeSessionHealth(trackCount, peakLevel, averageLevel, hasClipping): Promise<SessionHealthMetrics>

// Get mixing recommendations
recommendMixingChain(trackType): Promise<string[]>

// Get routing suggestions
suggestRouting(trackCount, trackTypes): Promise<AIAnalysisResult>

// Initialize with API key
initialize(apiKey, model): void
```

### AI Panel Component (`src/components/AIPanel.tsx`)

**Features:**
- Tab-based interface (Health/Mixing/Routing)
- Real-time session analysis
- Confidence scoring
- Actionable recommendations display

**Integration:**
- Embedded in Sidebar under AI tab
- Respects DAW state (tracks, selected track, playback)
- Error handling and loading states

## Feature Flags

Configure features in `.env.local`:

```env
REACT_APP_AI_ENABLED=true                  # Master switch
REACT_APP_AI_SESSION_ANALYSIS=true         # Health checking
REACT_APP_AI_MIXING_SUGGESTIONS=true       # Effect chains
REACT_APP_AI_VOICE_CONTROL=true            # Voice input (future)
REACT_APP_AI_ROUTING_SUGGESTIONS=true      # Bus routing
```

## Integration with DAW Context

AI Service is initialized via `DAWContext` on app startup:

```typescript
// In DAWContext useEffect
const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
if (apiKey) {
  getAIService().initialize(apiKey, process.env.REACT_APP_AI_MODEL);
}
```

## Future Enhancements

### Phase 1: Claude API Integration ✅ Ready
- Full natural language prompts
- Complex audio analysis
- Custom recommendations

### Phase 2: Voice Control
- Web Speech API integration
- Voice commands: "Create 4 drum tracks"
- Real-time processing

### Phase 3: ML-Based Gain Staging
- Automatic gain calculation
- Track-specific recommendations
- Learning from user adjustments

### Phase 4: Advanced Analysis
- Frequency spectrum analysis
- Loudness matching
- Stereo width optimization

## Type Definitions

### AIAnalysisResult
```typescript
{
  type: 'gain' | 'mixing' | 'health' | 'routing' | 'eq';
  suggestion: string;
  confidence: number;
  actionable: boolean;
  actions?: AIAction[];
}
```

### SessionHealthMetrics
```typescript
{
  headroom: number;           // dB below 0
  peakLevel: number;
  averageLevel: number;
  clipping: boolean;
  routing: string;
  effectCount: number;
  recommendations: string[];
}
```

## Troubleshooting

### "AI not configured" message
- Ensure `.env.local` has `REACT_APP_ANTHROPIC_API_KEY`
- Restart dev server after adding key
- Check that key is valid at https://console.anthropic.com

### AI features not responding
- Check browser console for errors
- Verify API key has permissions
- Check rate limits on Anthropic dashboard

### Mixing suggestions not appearing for track
- Ensure a track is selected
- Check that track type is recognized
- Supported types: vocals, drums, bass, guitar, synth

## Development

### Running Tests
```bash
npm run typecheck    # TypeScript check
npm run lint         # ESLint check
npm run build        # Production build
```

### Adding Custom Analysis

Extend `AIService` class:

```typescript
async myCustomAnalysis(): Promise<AIAnalysisResult> {
  // Your analysis logic
  return {
    type: 'custom',
    suggestion: '...',
    confidence: 0.85,
    actionable: true,
  };
}
```

### Adding Custom UI

Create new component and add to AIPanel:

```typescript
{activeTab === 'custom' && (
  <YourCustomComponent />
)}
```

## Performance

- **API Calls:** Async, non-blocking
- **UI Responsiveness:** Maintained during analysis
- **Memory:** Efficient session metrics storage
- **Build Impact:** ~2KB additional code (gzipped)

## Support

For issues or feature requests:
1. Check `.env.local` configuration
2. Review browser console logs
3. Verify API key permissions
4. Check Anthropic API status

## References

- [Anthropic API Docs](https://docs.anthropic.com)
- [Claude Models](https://docs.anthropic.com/claude/reference/models-overview)
- [CoreLogic Studio Architecture](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
