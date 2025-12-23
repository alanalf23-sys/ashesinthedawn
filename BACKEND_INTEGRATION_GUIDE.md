// Integration Installation Guide for CoreLogic Studio Backend Extensions

# Backend Extensions Integration Guide

## Overview
This guide explains how to integrate 5 major backend features into CoreLogic Studio:
1. **File System Endpoints** - List, rename, delete files
2. **Favorites & Recents** - Persistent folder shortcuts
3. **Batch File Import** - Multi-select and drag-and-drop
4. **Plugin Scanning** - Real VST/AU plugin discovery
5. **Plugin Presets** - Save and manage plugin configurations

## Prerequisites
- Python 3.8+
- FastAPI running (codette_server_unified.py)
- React 18+ frontend
- Node.js with TypeScript

## Step 1: Install Backend Files

### Create these Python files:
1. **`codette_backend_extensions.py`** - Core logic classes
2. **`codette_backend_endpoints.py`** - FastAPI endpoint definitions

Both files are self-contained with no external dependencies beyond standard library + FastAPI.

## Step 2: Register Endpoints in codette_server_unified.py

### Add imports after the FastAPI app creation (around line 250):
```python
# Add after: from codette_file_upload import ...

from codette_backend_extensions import (
    get_file_system_manager,
    get_plugin_scanner,
    get_preset_manager,
    FileItem,
    FileSystemManager,
    PluginScanner,
    PluginPresetManager
)

from codette_backend_endpoints import register_all_endpoints
```

### Register endpoints in the lifespan startup (around line 1600):
```python
# Inside the app lifespan startup function, add:
register_all_endpoints(app)
```

Or, add after app creation:
```python
app = FastAPI(...)
# ... CORS setup ...

# Register backend extensions
register_all_endpoints(app)
```

## Step 3: Install Frontend Files

### Create these TypeScript/React files:
1. **`src/hooks/useFileSystem.ts`** - React hooks for file operations
2. **`src/components/EnhancedFXBrowser.tsx`** - Plugin browser component

## Step 4: Update MediaExplorer Component

### Integrate useFileSystem hook:
```typescript
// In MediaExplorer.tsx, add imports:
import { useFileSystem, useBatchImport, useFavoritesAndRecents } from '../hooks/useFileSystem';

// In component:
const fileSystem = useFileSystem();
const batchImport = useBatchImport();
const favorites = useFavoritesAndRecents();

// Use in JSX:
// List files
<button onClick={() => fileSystem.listFiles(currentPath)}>
  Refresh
</button>

// Show favorites
favorites.favorites.map(fav => (
  <div key={fav.path} onClick={() => fileSystem.listFiles(fav.path)}>
    {fav.name}
  </div>
))
```

## Step 5: Update FXBrowser Component

### Import and use EnhancedFXBrowser:
```typescript
// Replace or supplement existing FXBrowser with:
import { EnhancedFXBrowser } from './EnhancedFXBrowser';

// In your layout:
<EnhancedFXBrowser />
```

## Step 6: Enable Multi-Select in File Lists

### Add to file list items:
```typescript
import { useMultiSelectWithRange } from '../hooks/useFileSystem';

// In component:
const multi = useMultiSelectWithRange(files, f => f.path);

// On click:
<div
  onClick={(e) => {
    multi.handleSelect(file, {
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey
    });
  }}
  className={multi.isSelected(file) ? 'bg-blue-600' : ''}
>
  {file.name}
</div>

// Import selected files:
<button onClick={() => multi.importSelected()}>
  Import ({multi.selectedCount})
</button>
```

## Step 7: Enable Drag & Drop

### Add drag-and-drop to file list:
```typescript
import { useBatchImport } from '../hooks/useFileSystem';

const batchImport = useBatchImport();

<div
  onDrop={(e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.items)
      .filter(item => item.kind === 'file')
      .map(item => item.getAsEntry());
    // Handle dropped files
  }}
  onDragOver={(e) => e.preventDefault()}
  className="border-2 border-dashed border-gray-400"
>
  Drop files here
</div>
```

## API Endpoints Reference

### File System
- `GET /api/files/list?path=<path>` - List files
- `POST /api/files/rename?oldPath=<path>&newName=<name>` - Rename file
- `DELETE /api/files/<file_id>` - Delete file
- `GET /api/files/properties?path=<path>` - Get properties
- `POST /api/files/favorite?path=<path>` - Toggle favorite

### Favorites & Recents
- `GET /api/folders/favorites` - Get favorites
- `GET /api/folders/recents?limit=10` - Get recents

### Plugin Management
- `POST /api/plugins/scan?force=false` - Scan plugins
- `GET /api/plugins` - Get cached plugins
- `GET /api/plugins/category/<category>` - By category

### Plugin Presets
- `POST /api/plugins/<pluginId>/presets` - Create preset
- `GET /api/plugins/<pluginId>/presets` - Get presets
- `PUT /api/plugins/<pluginId>/presets/<presetId>` - Update
- `DELETE /api/plugins/<pluginId>/presets/<presetId>` - Delete
- `GET /api/presets/search?query=<query>` - Search

### Batch Import
- `POST /api/batch/import` - Import multiple files

## File Structure

### On Disk
```
~/.codette/
├── metadata.json          # Favorites & recents
├── plugin_cache/
│   └── plugins.json       # Scanned plugins
└── plugin_presets/
    └── {pluginId}/
        ├── {presetId}.json
        └── ...
```

## Testing the Integration

### Test endpoints with curl:
```bash
# List files
curl http://localhost:8000/api/files/list?path=/

# Get favorites
curl http://localhost:8000/api/folders/favorites

# Scan plugins
curl -X POST http://localhost:8000/api/plugins/scan

# Get plugins
curl http://localhost:8000/api/plugins
```

### Test from React:
```typescript
// In browser console or React component:
const response = await fetch('http://localhost:8000/api/files/list?path=/');
const data = await response.json();
console.log(data.files);
```

## Configuration

### File System Base Path
By default uses home directory. To change:
```python
# In codette_server_unified.py
from codette_backend_extensions import FileSystemManager
custom_mgr = FileSystemManager(base_path='/path/to/media')
```

### Plugin Scan Directories
Automatically detects platform:
- **Windows**: `C:\Program Files\*\VST3`, `%APPDATA%\VST3`, etc.
- **macOS**: `/Library/Audio/Plug-Ins/VST3`, `~/Library/Audio/Plug-Ins`, etc.
- **Linux**: `~/.vst3`, `/usr/lib/vst3`, etc.

### Preset Storage Location
Default: `~/.codette/plugin_presets/`
Change by modifying PluginPresetManager initialization.

## Performance Notes

### File System
- Caches directory listings in memory
- Safe path traversal with validation
- 128-item default cache size

### Plugin Scanning
- First scan may take 5-30 seconds depending on plugins installed
- Results cached in `plugin_cache/plugins.json`
- Force rescan with `?force=true` parameter

### Presets
- Lazy-loaded from disk
- Real-time file synchronization
- 50 recent folders retained

## Error Handling

All endpoints return standard HTTP status codes:
- **200**: Success
- **400**: Bad request or operation failed
- **404**: Resource not found
- **500**: Server error

Example error response:
```json
{
  "detail": "Path outside allowed directory"
}
```

## Security

### Path Security
- All file operations validated against base path
- Directory traversal attacks prevented
- No access outside `~/.codette` and specified base directory

### Plugin Scanning
- Only reads plugin metadata
- No execution of plugins
- Safe error handling

### Presets
- Stored as JSON
- No code execution
- User-isolated storage

## Troubleshooting

### Plugins not found
1. Click "Scan" button to refresh
2. Check plugin directories exist
3. Verify plugin format (VST3/AU/VST2)
4. Check `/api/plugins` endpoint returns data

### Favorites not persisting
1. Check `~/.codette/metadata.json` exists and is writable
2. Verify file system write permissions
3. Check browser console for errors

### File operations failing
1. Verify backend is running (`/health` endpoint)
2. Check CORS headers are correct
3. Verify file paths are valid
4. Check file system permissions

### Presets not saving
1. Verify `~/.codette/plugin_presets/` directory exists
2. Check disk space
3. Verify plugin ID is valid
4. Check JSON serialization of preset data

## Development Tips

### Local Testing
```bash
# Watch backend logs:
tail -f your_server_output.log

# Test file operations:
python -c "
from codette_backend_extensions import FileSystemManager
fs = FileSystemManager()
files, path = fs.list_files('')
print(f'Found {len(files)} items in {path}')
"

# Test plugin scanning:
python -c "
import asyncio
from codette_backend_extensions import PluginScanner
scanner = PluginScanner()
plugins = asyncio.run(scanner.scan_plugins())
print(f'Found {len(plugins)} plugins')
"
```

### React Hook Testing
```typescript
// In React component or test:
import { useFileSystem } from './hooks/useFileSystem';

export function TestComponent() {
  const fs = useFileSystem();
  
  useEffect(() => {
    fs.listFiles().then(files => {
      console.log(`Loaded ${files.length} files`);
    });
  }, []);
  
  return <div>{fs.files.length} items</div>;
}
```

## Next Steps

1. ✅ Copy backend files to root directory
2. ✅ Register endpoints in codette_server_unified.py
3. ✅ Copy React hooks to src/hooks/
4. ✅ Integrate useFileSystem into MediaExplorer
5. ✅ Add EnhancedFXBrowser to plugin panel
6. ✅ Enable multi-select in file lists
7. ✅ Test all endpoints with curl
8. ✅ Test React components in dev environment
9. ✅ Deploy and monitor

## Support

If endpoints are not loading:
1. Check codette_server_unified.py has `register_all_endpoints(app)` call
2. Verify imports are correct
3. Check server logs for import errors
4. Restart backend server after changes
5. Clear browser cache and reload

For performance issues:
1. Check plugin scan progress
2. Monitor file system cache size
3. Profile slow operations in DevTools
4. Consider pagination for large file lists

