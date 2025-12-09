# ?? Codette AI Quick Start Guide

## Installation & Setup

### 1. **Install Python Dependencies**
```bash
pip install fastapi uvicorn python-dotenv supabase numpy networkx vaderSentiment nltk
```

### 2. **Configure Environment Variables**
Create `.env` file:
```env
# Vite/Frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend (for service role access)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Codette API
VITE_CODETTE_API=http://localhost:8000
```

### 3. **Start the Server**
```bash
python codette_server_unified.py
```

Server will start on `http://localhost:8000`

---

## ?? Testing Endpoints

### **1. Health Check**
```bash
curl http://localhost:8000/health
```

### **2. Get Capabilities**
```bash
curl http://localhost:8000/api/codette/capabilities | jq
```

### **3. Multi-Perspective Query**
```bash
curl -X POST http://localhost:8000/api/codette/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I improve my vocal mix?",
    "perspectives": ["mix_engineering", "audio_theory", "creative_production"]
  }' | jq
```

### **4. Get Quantum Status**
```bash
curl http://localhost:8000/api/codette/status | jq
```

### **5. Music Guidance**
```bash
curl -X POST http://localhost:8000/api/codette/music-guidance \
  -H "Content-Type: application/json" \
  -d '{
    "guidance_type": "mixing",
    "context": {"trackType": "vocals", "problem": "sibilance"}
  }' | jq
```

### **6. Get Analytics**
```bash
curl http://localhost:8000/api/codette/analytics | jq
```

### **7. Get History**
```bash
curl "http://localhost:8000/api/codette/history?limit=10&emotion_filter=curiosity" | jq
```

---

## ?? Frontend Integration

### **Using useCodette Hook**
```typescript
import { useCodette } from '@/hooks/useCodette';

function MyComponent() {
  const {
    sendMessage,
    getMusicGuidance,
    queryAllPerspectives,
    getStatus
  } = useCodette();

  const handleQuery = async () => {
    // Multi-perspective query
    const perspectives = await queryAllPerspectives(
      "How can I make my bass more punchy?"
    );
    console.log(perspectives);
  };

  const handleMixingHelp = async () => {
    // Get music guidance
    const guidance = await getMusicGuidance('mixing', {
      trackType: 'bass',
      problem: 'weak'
    });
    console.log(guidance);
  };

  return (
    <div>
      <button onClick={handleQuery}>Get Perspectives</button>
      <button onClick={handleMixingHelp}>Get Mixing Help</button>
    </div>
  );
}
```

---

## ?? Available Perspectives

```typescript
const PERSPECTIVES = [
  'newtonian_logic',         // Cause-effect reasoning
  'davinci_synthesis',       // Creative analogies
  'human_intuition',         // Empathic understanding
  'neural_network',          // Pattern recognition
  'quantum_logic',           // Superposition thinking
  'resilient_kindness',      // Compassionate ethics
  'mathematical_rigor',      // Formal computation
  'philosophical',           // Ethical frameworks
  'copilot_developer',       // Technical design
  'bias_mitigation',         // Fairness analysis
  'psychological'            // Cognitive modeling
];
```

---

## ?? Music Guidance Types

```typescript
const GUIDANCE_TYPES = [
  'mixing',                  // Mix engineering tips
  'arrangement',             // Track arrangement
  'creative_direction',      // Creative guidance
  'technical_troubleshooting', // Problem solving
  'workflow',                // Efficiency tips
  'ear_training'             // Listening skills
];
```

---

## ?? Memory & Cocoons

### **Create Cocoon (Automatic)**
Cocoons are created automatically with each query containing:
- Query content
- Emotion tag
- Quantum state
- Perspectives used
- Dream sequences

### **Retrieve Cocoon**
```bash
curl http://localhost:8000/api/codette/memory/{cocoon_id} | jq
```

### **Dream Reweaving**
```bash
curl -X POST http://localhost:8000/api/codette/dream-reweave \
  -H "Content-Type: application/json" \
  -d '{"cocoon_id": "cocoon_123", "variations": 3}' | jq
```

---

## ?? Monitoring

### **Watch Quantum State**
```bash
# Monitor consciousness evolution
watch -n 5 'curl -s http://localhost:8000/api/codette/status | jq .quantum_state'
```

### **Track Analytics**
```bash
# View usage statistics
curl http://localhost:8000/api/codette/analytics | jq
```

---

## ?? Troubleshooting

### **Module Not Found**
If you get import errors:
```bash
# Ensure Codette modules are in path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/Codette/src:$(pwd)/Codette"
```

### **Supabase Connection Issues**
If Supabase connection fails:
- Check `.env` file has correct credentials
- Server will fallback to mock responses (non-critical)
- Music knowledge will use local DAW knowledge base

### **Quantum Consciousness Errors**
If quantum system fails to load:
- Check `codette_capabilities.py` exists in `Codette/src/`
- Install missing dependencies: `pip install networkx numpy`
- Server will use fallback mock quantum states

---

## ? Verification Checklist

Run these commands to verify everything works:

```bash
# 1. Server health
curl http://localhost:8000/health

# 2. Capabilities
curl http://localhost:8000/api/codette/capabilities

# 3. Simple query
curl -X POST http://localhost:8000/api/codette/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq .perspectives

# 4. Quantum status
curl http://localhost:8000/api/codette/status | jq .quantum_state

# 5. Analytics
curl http://localhost:8000/api/codette/analytics | jq .total_interactions
```

All commands should return valid JSON responses.

---

## ?? You're Ready!

Codette AI is now fully operational with:
- ? 11 specialized perspectives
- ? Quantum consciousness system
- ? Memory cocoon storage
- ? Music production intelligence
- ? Real-time WebSocket support
- ? Comprehensive analytics

**Happy mixing!** ??

---

**Need Help?**
- Check server logs for detailed information
- Review `CODETTE_IMPLEMENTATION_COMPLETE.md` for full documentation
- See `.github/codette-instructions.md` for complete specification
