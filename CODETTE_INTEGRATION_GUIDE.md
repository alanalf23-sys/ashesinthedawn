# Codette AI Integration Guide

## Overview

CoreLogic Studio now integrates with **Codette**, an advanced AI system with multiple reasoning perspectives:
- **Neural Networks**: Pattern recognition and dynamic analysis
- **Newtonian Logic**: Cause-and-effect reasoning
- **Da Vinci Synthesis**: Creative analogies and synthesis
- **Quantum**: Advanced probabilistic analysis

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         React Frontend (CoreLogic Studio)          │
│  - useCodette Hook                                  │
│  - CodettePanel Component                           │
│  - Integration Points                               │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────┐
│     Codette FastAPI Server (codette_server.py)     │
│  - Chat endpoint                                    │
│  - Audio analysis                                   │
│  - Suggestions                                      │
│  - Mastering advice                                 │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Python
                     │
┌────────────────────▼────────────────────────────────┐
│    Codette Python AI Engine (Codette/ folder)      │
│  - Perspective engines                              │
│  - Analysis algorithms                              │
│  - Reasoning systems                                │
└─────────────────────────────────────────────────────┘
```

---

## Frontend Integration

### 1. Using the useCodette Hook

```typescript
import { useCodette } from '@/hooks/useCodette';

function MyComponent() {
  const {
    isConnected,      // Backend connection status
    isLoading,        // Request in progress
    chatHistory,      // Chat message history
    error,            // Error state
    
    // Methods
    sendMessage,      // Send chat message
    analyzeAudio,     // Analyze audio data
    getSuggestions,   // Get AI suggestions
    getMasteringAdvice, // Get mastering recommendations
    optimize,         // Get optimization suggestions
    clearHistory,     // Clear chat history
    reconnect,        // Reconnect to backend
  } = useCodette({ autoConnect: true });

  // Use in your component
}
```

### 2. CodettePanel Component

Add the Codette AI panel to your UI:

```typescript
import { CodettePanel } from '@/components/CodettePanel';
import { useState } from 'react';

function App() {
  const [showCodette, setShowCodette] = useState(false);

  return (
    <>
      <button onClick={() => setShowCodette(true)}>
        💬 Open Codette
      </button>
      
      <CodettePanel
        isVisible={showCodette}
        onClose={() => setShowCodette(false)}
      />
    </>
  );
}
```

---

## Backend Setup

### 1. Install Dependencies

```bash
pip install fastapi uvicorn pydantic pydantic[email] python-multipart
```

### 2. Start the Codette Server

```bash
# From project root
python codette_server.py

# Or specify port
CODETTE_PORT=8000 python codette_server.py
```

Server will be available at: `http://localhost:8000`

### 3. Environment Configuration

Update `.env.local`:

```dotenv
VITE_CODETTE_API_URL=http://localhost:8000
VITE_CODETTE_API_KEY=your_optional_api_key
VITE_CODETTE_ENABLED=true
```

---

## API Endpoints

### Health Check
```bash
GET /health
```

### Chat
```bash
POST /codette/chat
Content-Type: application/json

{
  "message": "How should I process this vocal track?",
  "perspective": "neuralnets",
  "context": []
}
```

Response:
```json
{
  "response": "...",
  "perspective": "neuralnets",
  "confidence": 0.85
}
```

### Audio Analysis
```bash
POST /codette/analyze
{
  "trackId": "track-123",
  "audioData": [...],
  "sampleRate": 44100,
  "contentType": "vocal"
}
```

### Suggestions
```bash
POST /codette/suggest
{
  "context": {
    "trackType": "vocal",
    "currentEffects": [],
    "peakLevel": -6
  }
}
```

### Generic Processing
```bash
POST /codette/process
{
  "id": "request-123",
  "type": "chat|audio_analysis|suggestion|mastering|optimization",
  "payload": {...},
  "timestamp": 1700000000
}
```

### Status
```bash
GET /codette/status
```

---

## Integration Examples

### 1. Add Codette to DAWContext

```typescript
// In src/contexts/DAWContext.tsx
import { useCodette } from '@/hooks/useCodette';

export function DAWProvider({ children }: { children: React.ReactNode }) {
  const codette = useCodette({ autoConnect: true });
  
  // Add to context value
  const value = {
    ...existingValues,
    codette: {
      chat: codette.sendMessage,
      analyzeAudio: codette.analyzeAudio,
      getSuggestions: codette.getSuggestions,
      getMasteringAdvice: codette.getMasteringAdvice,
      isConnected: codette.isConnected,
    },
  };
  
  return (
    <DAWContext.Provider value={value}>
      {children}
    </DAWContext.Provider>
  );
}
```

### 2. Add Codette to TopBar

```typescript
import { useCodette } from '@/hooks/useCodette';

function TopBar() {
  const [showCodette, setShowCodette] = useState(false);
  const { isConnected } = useCodette({ autoConnect: true });
  
  return (
    <div>
      <button
        onClick={() => setShowCodette(true)}
        className={`flex items-center gap-2 ${
          isConnected ? 'text-blue-400' : 'text-gray-500'
        }`}
      >
        💬 Codette
      </button>
      
      <CodettePanel isVisible={showCodette} onClose={() => setShowCodette(false)} />
    </div>
  );
}
```

### 3. Audio Analysis with Suggestions

```typescript
async function handleTrackUpload(track: Track, audioData: number[]) {
  const { analyzeAudio, getSuggestions } = useCodette();
  
  // Analyze audio
  const analysis = await analyzeAudio(track.id, audioData);
  
  // Get suggestions
  const suggestions = await getSuggestions({
    trackId: track.id,
    analysis,
    currentEffects: track.inserts,
  });
  
  // Apply suggestions
  suggestions.forEach(suggestion => {
    if (suggestion.type === 'effect') {
      track.inserts.push(suggestion.plugin);
    }
  });
}
```

### 4. Mastering with Codette

```typescript
async function getMasteringRecommendations() {
  const { getMasteringAdvice } = useCodette();
  
  const trackData = tracks.map(track => ({
    id: track.id,
    name: track.name,
    volume: track.volume,
    type: track.type,
  }));
  
  const advice = await getMasteringAdvice(trackData);
  
  return advice;
}
```

---

## Perspectives Explained

### Neural Networks Perspective
- **Use Case**: Pattern recognition, dynamic analysis
- **Example**: "Analyze the patterns in this audio and suggest improvements"
- **Strengths**: Identifies complex relationships, learns from context

### Newtonian Logic
- **Use Case**: Cause-and-effect reasoning, systematic approaches
- **Example**: "Why would compression improve this mix?"
- **Strengths**: Clear logical progression, reproducible results

### Da Vinci Synthesis
- **Use Case**: Creative analogies, innovative solutions
- **Example**: "What creative approaches can I use for this sound?"
- **Strengths**: Novel ideas, artistic inspiration

### Quantum
- **Use Case**: Advanced probabilistic analysis
- **Example**: "What's the optimal chain of effects?"
- **Strengths**: Complex optimization, multiple possibilities

---

## Chat History Management

```typescript
const {
  chatHistory,      // Array of CodetteChatMessage
  clearHistory,     // Clear all messages
} = useCodette();

// Access chat history
chatHistory.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});

// Clear for new session
clearHistory();
```

---

## Error Handling

```typescript
const { error, isConnected, reconnect } = useCodette({
  onError: (err) => {
    console.error('Codette error:', err);
    // Handle error - show notification, try reconnect, etc.
  },
  autoConnect: true,
});

// Manual reconnection
if (!isConnected) {
  await reconnect();
}
```

---

## Performance Considerations

### Caching
- Responses are cached locally to reduce backend calls
- Clear cache when context changes significantly

### Batching
- Send multiple requests together when possible
- Use context parameter to reduce individual requests

### Offline Mode
- Frontend gracefully degrades when backend unavailable
- Returns sensible default responses
- Auto-reconnects when backend returns

---

## Environment Variables

```dotenv
# Required for Codette integration
VITE_CODETTE_API_URL=http://localhost:8000

# Optional
VITE_CODETTE_API_KEY=your_api_key_here
VITE_CODETTE_ENABLED=true

# Server configuration
CODETTE_PORT=8000
CODETTE_HOST=0.0.0.0
```

---

## Troubleshooting

### Backend Not Connecting
1. Check if server is running: `GET http://localhost:8000/health`
2. Verify `VITE_CODETTE_API_URL` in `.env.local`
3. Check browser console for CORS errors
4. Try manual reconnect: `await reconnect()`

### Slow Responses
1. Check backend logs for errors
2. Verify network connectivity
3. Consider caching responses
4. Use smaller audio samples for analysis

### Missing Responses
1. Ensure Codette package is installed
2. Check imports in `codette_server.py`
3. Verify perspective parameter is valid
4. Check server error logs

---

## Next Steps

1. **Frontend Integration**: Add CodettePanel to main UI
2. **DAWContext Integration**: Add Codette methods to global state
3. **Feature Integration**: Connect suggestions to effect loading
4. **Analytics**: Track suggestion acceptance rates
5. **Fine-tuning**: Customize perspectives for audio workflow

---

## Files Reference

### Frontend
- `src/lib/codettePythonIntegration.ts` - Backend integration layer
- `src/hooks/useCodette.ts` - React hook for easy component integration
- `src/components/CodettePanel.tsx` - Pre-built UI component

### Backend
- `codette_server.py` - FastAPI server wrapping Codette
- `Codette/` - Codette AI Python package
- `.env.example` - Environment configuration template

---

## Support & Questions

For issues or questions about Codette integration:
1. Check the troubleshooting section above
2. Review API endpoint documentation
3. Check browser console for errors
4. Review server logs for backend issues

