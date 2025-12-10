# File Upload & Timeline Integration - Manual Integration Guide

## ? Files Created

1. **codette_file_upload.py** ? - Backend file upload module (complete)
2. **src/components/FileUpload.tsx** ? - React file upload component (complete)
3. **codette_file_upload_endpoints.py** ? - Server endpoint definitions (ready to integrate)

## ?? Integration Steps

### Step 1: Add Endpoints to Server

**File**: `codette_server_unified.py`

**Location**: After existing `/codette/chat` endpoint (around line 1800-2000)

**Action**: Copy the 3 endpoint functions from `codette_file_upload_endpoints.py`:

```python
# Copy these 3 functions:
1. @app.post("/codette/upload") - File upload endpoint
2. @app.get("/codette/files/{user_id}") - Get user files
3. @app.post("/codette/timeline-context") - Timeline analysis
```

### Step 2: Update Chat Models

**File**: `codette_server_unified.py`

**Location**: Around line 260-280 (where Pydantic models are defined)

**Action**: Add these fields to existing models:

```python
class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "mix_engineering"
    daw_context: Optional[Dict[str, Any]] = None
    timeline_context: Optional[Dict[str, Any]] = None  # ADD THIS
    file_references: Optional[List[str]] = None  # ADD THIS

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None
    file_analysis: Optional[Dict[str, Any]] = None  # ADD THIS
    timeline_suggestions: Optional[List[str]] = None  # ADD THIS
```

### Step 3: Integrate FileUpload Component

**File**: `src/components/CodettePanel.tsx` (or your main chat component)

**Action**:

1. Import FileUpload component:
```typescript
import { FileUpload } from './FileUpload';
```

2. Add state for selected files:
```typescript
const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
```

3. Add FileUpload component to your UI (before chat input):
```tsx
<FileUpload
  onFileSelect={setSelectedFiles}
  maxFiles={5}
  acceptedTypes={['.wav', '.mp3', '.mid', '.txt', '.json']}
/>
```

4. Update your message send function to include files and timeline:
```typescript
const handleSendMessage = async (e: any) => {
  e.preventDefault?.();
  if (!inputValue.trim() || isLoading) return;

  const message = inputValue;
  setInputValue('');
  
  // Build timeline context
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
      bpm: 120  // Get from project
    }
  };

  // Upload files if any
  const fileReferences: string[] = [];
  for (const file of selectedFiles) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', 'default');

    const response = await fetch('http://localhost:8000/codette/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      fileReferences.push(data.file.id);
    }
  }

  // Pass context to Codette
  const dawContext = {
    ...buildDAWContext(),
    timeline_context: timelineContext,
    file_references: fileReferences
  };
  
  await sendMessage(message, dawContext);
  setSelectedFiles([]); // Clear files after sending
};
```

## ?? Testing

### Test 1: Backend Endpoints

```bash
# 1. Start server
python codette_server_unified.py

# 2. Test file upload
curl -X POST http://localhost:8000/codette/upload \
  -F "file=@test.wav" \
  -F "user_id=default"

# 3. Test file retrieval
curl http://localhost:8000/codette/files/default

# 4. Test timeline context
curl -X POST http://localhost:8000/codette/timeline-context \
  -H "Content-Type: application/json" \
  -d '{"tracks":[{"id":"1","name":"Vocals"}],"transport":{"bpm":120}}'
```

### Test 2: Frontend Integration

1. Start frontend: `npm run dev`
2. Open Codette chat panel
3. Try dragging a file onto the FileUpload component
4. Verify file appears in preview
5. Send a message with the file attached
6. Check backend logs for file upload confirmation

## ?? Expected Behavior

### File Upload Flow
1. User drags/selects files ? FileUpload component shows preview
2. User sends message ? Files uploaded to `/codette/upload`
3. Backend analyzes files ? Returns metadata
4. File IDs added to chat context
5. Codette can reference file details in response

### Timeline Context Flow
1. User sends message ? Timeline context serialized
2. Backend receives track/transport state
3. Codette generates context-aware suggestions
4. UI displays suggestions based on current session

## ?? Features Enabled

- ? Upload audio files (WAV, MP3, FLAC, etc.)
- ? Upload MIDI files
- ? Upload text/code files
- ? Automatic file analysis (duration, sample rate, etc.)
- ? File history per user
- ? Timeline context awareness
- ? Track-specific suggestions
- ? Tempo-based recommendations
- ? Session state analysis

## ?? Configuration

### File Upload Limits (codette_file_upload.py)
```python
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
UPLOAD_DIRECTORY = Path("uploads")
ALLOWED_EXTENSIONS = {
    ".wav", ".mp3", ".flac", ".aiff", ".ogg", ".m4a",
    ".mid", ".midi",
    ".txt", ".md", ".json", ".xml",
    ".py", ".js", ".ts"
}
```

### FileUpload Component Props
```typescript
<FileUpload
  onFileSelect={setSelectedFiles}  // Callback with File[]
  maxFiles={5}                      // Max simultaneous uploads
  acceptedTypes={[...]}             // File type filter
/>
```

## ? Next Steps

1. Integrate endpoints into `codette_server_unified.py`
2. Update ChatRequest/ChatResponse models
3. Add FileUpload component to chat UI
4. Update send message logic
5. Test file upload flow
6. Test timeline context awareness
7. Deploy! ??

## ?? Related Files

- `FILE_UPLOAD_TIMELINE_SUMMARY.md` - Complete feature documentation
- `codette_file_upload.py` - Backend implementation
- `src/components/FileUpload.tsx` - Frontend component
- `codette_file_upload_endpoints.py` - Server endpoints to add

---

**Status**: ? Ready for Integration
**Created**: $(date)
**Dependencies**: pydub (audio), mido (MIDI), python-multipart (upload)
