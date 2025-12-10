# File Upload & Timeline Integration - Implementation Summary

## ? What Was Added

### 1. **File Upload Backend (codette_file_upload.py)** ?

Created comprehensive file upload system with:

- **File Analysis**
  - Audio files: Duration, channels, sample rate, dBFS using `pydub`
  - MIDI files: Track count, tempo changes, note events using `mido`
  - Text/Code files: Line count, word count, preview extraction

- **File Storage**
  - Upload directory: `uploads/`
  - Max size: 50MB
  - Supported formats:
    - Audio: `.wav`, `.mp3`, `.flac`, `.aiff`, `.ogg`, `.m4a`
    - MIDI: `.mid`, `.midi`
    - Text: `.txt`, `.md`, `.json`, `.xml`
    - Code: `.py`, `.js`, `.ts`

- **Timeline Context Serialization**
  - Tracks: ID, name, type, volume, pan, mute/solo/arm state
  - Regions: Start time, duration, name
  - Markers: Timeline markers
  - Transport: Playing state, BPM, time signature
  - Session metadata: Track counts, armed/soloed/muted stats

- **Intelligent Suggestions**
  - Performance tips for 32+ tracks
  - Muted track cleanup suggestions
  - Solo mode reminders
  - Tempo-based mixing advice
  - Bus routing suggestions

- **File History Management**
  - Per-user file history
  - Recent files list (limit 10)
  - File retrieval by ID
  - Clear history support

### 2. **File Upload UI Component (FileUpload.tsx)** ?

Created React component with:

- **Drag & Drop Interface**
  - Visual drag-over state
  - Drop zone with file count
  - Click-to-browse fallback

- **File Type Detection**
  - Audio files: Waveform icon
  - MIDI files: Music icon
  - Text files: Document icon
  - Code files: Code icon
  - Generic files: File icon

- **File Preview**
  - Size formatting (B, KB, MB)
  - Type badge display
  - Text file content preview (first 200 chars)
  - Remove file button

- **Validation**
  - Max files limit (default 5)
  - Accepted file types filter
  - Remaining slots indicator

### 3. **Server Endpoints (codette_server_unified.py)** ?

**Requires manual addition:**

```python
# Add these imports at top
from fastapi import File, UploadFile, Form
from codette_file_upload import (
    analyze_uploaded_file,
    serialize_timeline_context,
    generate_timeline_suggestions,
    file_history,
    UPLOAD_DIRECTORY,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS
)

# Add these endpoints after existing /codette/ endpoints:

@app.post("/codette/upload")
@app.post("/api/codette/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form("default")
):
    """
    Upload file for Codette analysis
    
    Supports: audio, MIDI, text, code files
    Max size: 50MB
    """
    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large (max {MAX_FILE_SIZE/1024/1024}MB)")
    
    # Validate extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {ext} not allowed")
    
    # Save file
    file_path = UPLOAD_DIRECTORY / f"{user_id}_{int(time.time())}_{file.filename}"
    file_path.write_bytes(contents)
    
    # Analyze file
    analysis = await analyze_uploaded_file(file_path, file.content_type or "")
    
    # Add to history
    file_info = {
        "id": str(file_path),
        "filename": file.filename,
        "path": str(file_path),
        "analysis": analysis,
        "uploaded_at": get_timestamp()
    }
    file_history.add_file(user_id, file_info)
    
    return {
        "success": True,
        "file": file_info,
        "timestamp": get_timestamp()
    }


@app.get("/codette/files/{user_id}")
@app.get("/api/codette/files/{user_id}")
async def get_user_files(user_id: str, limit: int = 10):
    """Get recent uploaded files for user"""
    files = file_history.get_files(user_id, limit)
    return {
        "success": True,
        "files": files,
        "count": len(files),
        "timestamp": get_timestamp()
    }


@app.post("/codette/timeline-context")
@app.post("/api/codette/timeline-context")
async def analyze_timeline(timeline_data: Dict[str, Any]):
    """
    Analyze timeline/track context and provide suggestions
    
    Accepts:
    - tracks: List of track objects
    - regions: List of region objects
    - markers: List of markers
    - transport: Transport state
    """
    context = serialize_timeline_context(timeline_data)
    suggestions = generate_timeline_suggestions(context)
    
    return {
        "success": True,
        "context": context,
        "suggestions": suggestions,
        "timestamp": get_timestamp()
    }
```

### 4. **ChatRequest Model Updates** ?

Updated `ChatRequest` model in `codette_server_unified.py`:

```python
class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "mix_engineering"
    daw_context: Optional[Dict[str, Any]] = None
    timeline_context: Optional[Dict[str, Any]] = None  # NEW
    file_references: Optional[List[str]] = None  # NEW

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None
    file_analysis: Optional[Dict[str, Any]] = None  # NEW
    timeline_suggestions: Optional[List[str]] = None  # NEW
```

### 5. **Frontend Integration** ?

**Add to your chat component:**

```typescript
import { FileUpload } from '../components/FileUpload';
import { useDAW } from '../contexts/DAWContext';
import { getCodetteBridge } from '../lib/codetteBridge';

function ChatComponent() {
  const { tracks, isPlaying, currentTime, bpm } = useDAW();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const bridge = getCodetteBridge();

  const handleSendMessage = async (message: string) => {
    // Serialize timeline context
    const timelineContext = {
      tracks: tracks.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        volume: t.volume,
        pan: t.pan,
        muted: t.muted,
        soloed: t.soloed,
        armed: t.armed
      })),
      transport: {
        playing: isPlaying,
        timeSeconds: currentTime,
        bpm: bpm
      }
    };

    // Upload files if any
    const fileReferences: string[] = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', 'default');

      const response = await fetch(`${CODETTE_API}/codette/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        fileReferences.push(data.file.id);
      }
    }

    // Send chat with context
    const response = await bridge.chat(
      message,
      'conversation-id',
      'mix_engineering',
      {
        ...dawContext,
        timeline_context: timelineContext,
        file_references: fileReferences
      }
    );

    // Handle response with file analysis
    if (response.file_analysis) {
      console.log('File analysis:', response.file_analysis);
    }

    if (response.timeline_suggestions) {
      console.log('Timeline suggestions:', response.timeline_suggestions);
    }
  };

  return (
    <div>
      {/* File Upload Component */}
      <FileUpload
        onFileSelect={setSelectedFiles}
        maxFiles={5}
        acceptedTypes={['.wav', '.mp3', '.mid', '.txt', '.json']}
      />

      {/* Chat messages */}
      <ChatMessages />

      {/* Send button */}
      <button onClick={() => handleSendMessage(inputValue)}>
        Send {selectedFiles.length > 0 && `(+ ${selectedFiles.length} files)`}
      </button>
    </div>
  );
}
```

## ?? Features Breakdown

| Feature | Status | Description |
|---------|--------|-------------|
| File upload UI | ? | Drag-drop, click-browse, file preview |
| File analysis | ? | Audio, MIDI, text metadata extraction |
| Timeline serialization | ? | Track, region, transport state capture |
| Smart suggestions | ? | Context-aware mixing advice |
| File history | ? | Per-user uploaded file tracking |
| Server endpoints | ? | Ready to add (see code above) |
| Frontend integration | ? | Ready to integrate (see code above) |

## ?? Next Steps

1. **Add Server Endpoints**
   - Copy endpoint code from section 3 into `codette_server_unified.py`
   - Add after line ~1800 (after existing `/codette/chat`)

2. **Integrate UI Component**
   - Import `FileUpload` component in your chat UI
   - Add timeline context serialization
   - Update `sendMessage` to include files and timeline

3. **Test File Upload**
   ```bash
   # Upload audio file
   curl -X POST http://localhost:8000/codette/upload \
     -F "file=@test.wav" \
     -F "user_id=default"
   
   # Get user files
   curl http://localhost:8000/codette/files/default
   ```

4. **Test Timeline Context**
   ```bash
   curl -X POST http://localhost:8000/codette/timeline-context \
     -H "Content-Type: application/json" \
     -d '{
       "tracks": [{"id": "1", "name": "Vocals", "type": "audio"}],
       "transport": {"bpm": 120}
     }'
   ```

## ?? Usage Examples

### Upload Audio File and Ask Question

```typescript
// 1. User uploads "vocals.wav"
const formData = new FormData();
formData.append('file', audioFile);
formData.append('user_id', userId);

const uploadResponse = await fetch('/codette/upload', {
  method: 'POST',
  body: formData
});

const { file } = await uploadResponse.json();

// 2. Ask Codette about the file
const chatResponse = await bridge.chat(
  "How should I process these vocals?",
  conversationId,
  'mix_engineering',
  {
    file_references: [file.id],
    file_analysis: file.analysis
  }
);

// Codette can now reference:
// - File duration: 3:45
// - Sample rate: 44100 Hz
// - Peak level: -3.5 dBFS
// - Channels: Stereo
```

### Send Timeline Context with Question

```typescript
const timelineContext = {
  tracks: tracks.map(t => ({
    id: t.id,
    name: t.name,
    type: t.type,
    volume: t.volume,
    muted: t.muted,
    soloed: t.soloed
  })),
  transport: {
    playing: isPlaying,
    bpm: bpm,
    timeSeconds: currentTime
  }
};

const response = await bridge.chat(
  "How's my mix looking?",
  conversationId,
  'mix_engineering',
  {
    timeline_context: timelineContext
  }
);

// Codette can now see:
// - 16 tracks (3 muted, 1 soloed)
// - BPM: 128 (fast tempo - EDM/House)
// - 4 armed tracks (warning: multiple armed)
// - Suggestion: "Consider using buses for 16+ tracks"
```

## ?? Configuration

### File Upload Limits

Edit `codette_file_upload.py`:

```python
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {
    ".wav", ".mp3", ".flac",  # Add more formats
    ".mid", ".midi",
    ".txt", ".json"
}
```

### Timeline Suggestion Rules

Edit `generate_timeline_suggestions()` in `codette_file_upload.py`:

```python
# Add custom rules
if session.get("track_count") > 48:
    suggestions.append("?? High track count - consider stem bouncing")

if bpm > 160:
    suggestions.append("? Hyper-fast tempo - tight timing critical")
```

## ?? Benefits

? **File Context Awareness**: Codette can analyze audio files you upload
? **Timeline Intelligence**: Knows your track layout, routing, mute/solo states
? **Smart Suggestions**: Context-aware advice based on session state
? **File History**: Reference previously uploaded files
? **Multi-format Support**: Audio, MIDI, text, code files
? **Preview System**: See file metadata before sending

## ?? Dependencies

Install these for full functionality:

```bash
pip install pydub  # Audio file analysis
pip install mido   # MIDI file analysis
pip install python-multipart  # FastAPI file upload support
```

## ?? Ready to Use!

All components are created and ready. Just need to:
1. Add the 3 server endpoints to `codette_server_unified.py`
2. Integrate `<FileUpload />` component in your chat UI
3. Update chat send function to include timeline context
4. Test and enjoy! ??

---

**Created**: December 19, 2025  
**Status**: ? Backend Ready | ? Integration Pending  
**Files**: 3 new files, 1 update needed
