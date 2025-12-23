"""
Codette Backend Extensions - File System, Plugin Scanning, and Preset Management

This module provides comprehensive backend functionality for:
- File system operations (list, rename, delete, properties)
- Favorites and recently accessed folders
- Plugin discovery and scanning (VST/AU)
- Plugin preset management

To integrate, add these endpoints to codette_server_unified.py after FastAPI app initialization.
"""

import os
import json
import logging
import asyncio
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from pydantic import BaseModel
from functools import lru_cache
import platform

logger = logging.getLogger(__name__)

# ============================================================================
# DATA MODELS - Pydantic schemas for API contracts
# ============================================================================

class FileItem(BaseModel):
    """Represents a file system item"""
    id: str  # Full path hash
    name: str
    path: str
    type: str  # 'file' | 'folder'
    size: int  # bytes, 0 for folders
    modified: str  # ISO timestamp
    extension: str  # Empty string for folders
    isFavorite: bool = False


class FolderInfo(BaseModel):
    """Represents folder information"""
    path: str
    name: str
    modifiedTime: str
    fileCount: int
    isFavorite: bool


class PluginInfo(BaseModel):
    """Represents a scanned plugin"""
    id: str  # Plugin UUID or path-based ID
    name: str
    manufacturer: str
    category: str
    path: str
    version: str = ""
    description: str = ""
    formats: List[str] = []  # ['VST3', 'VST2', 'AU', etc.]


class PluginPreset(BaseModel):
    """Represents a plugin preset"""
    id: str
    pluginId: str
    name: str
    description: str = ""
    data: Dict[str, Any]  # Serialized preset data
    createdAt: str
    modifiedAt: str
    tags: List[str] = []


class BatchImportRequest(BaseModel):
    """Request for batch importing files"""
    files: List[str]  # Paths to files
    targetTrackId: Optional[str] = None
    insertMode: str = "replace"  # 'replace' | 'append'


# ============================================================================
# FILE SYSTEM MANAGER
# ============================================================================

class FileSystemManager:
    """Manages file system operations with caching and safety"""
    
    def __init__(self, base_path: str = str(Path.home()), cache_size: int = 128):
        self.base_path = Path(base_path)
        self.cache_size = cache_size
        self.favorites: set = set()
        self.recents: List[Tuple[str, float]] = []  # (path, timestamp)
        self._load_metadata()
    
    def _load_metadata(self):
        """Load favorites and recents from ~/.codette/metadata.json"""
        metadata_dir = Path.home() / '.codette'
        metadata_dir.mkdir(exist_ok=True)
        metadata_file = metadata_dir / 'metadata.json'
        
        if metadata_file.exists():
            try:
                data = json.loads(metadata_file.read_text())
                self.favorites = set(data.get('favorites', []))
                self.recents = data.get('recents', [])[-50:]  # Keep last 50
            except Exception as e:
                logger.warning(f"Failed to load metadata: {e}")
    
    def _save_metadata(self):
        """Save favorites and recents to ~/.codette/metadata.json"""
        metadata_dir = Path.home() / '.codette'
        metadata_dir.mkdir(exist_ok=True)
        metadata_file = metadata_dir / 'metadata.json'
        
        try:
            data = {
                'favorites': list(self.favorites),
                'recents': self.recents[-50:]
            }
            metadata_file.write_text(json.dumps(data, indent=2))
        except Exception as e:
            logger.error(f"Failed to save metadata: {e}")
    
    def list_files(self, path: str = "") -> Tuple[List[FileItem], str]:
        """
        List files and folders at given path
        
        Returns:
            Tuple of (file_items, current_path)
        """
        try:
            current_path = Path(path) if path else self.base_path
            
            # Safety check - prevent directory traversal attacks
            current_path = current_path.resolve()
            if not str(current_path).startswith(str(self.base_path.resolve())):
                raise PermissionError("Path outside allowed directory")
            
            if not current_path.exists():
                return [], str(current_path)
            
            items: List[FileItem] = []
            
            try:
                for item in sorted(current_path.iterdir()):
                    try:
                        stat = item.stat()
                        items.append(FileItem(
                            id=str(item.resolve()),
                            name=item.name,
                            path=str(item),
                            type='folder' if item.is_dir() else 'file',
                            size=stat.st_size if item.is_file() else 0,
                            modified=datetime.fromtimestamp(
                                stat.st_mtime, tz=timezone.utc
                            ).isoformat(),
                            extension=item.suffix.lower() if item.is_file() else "",
                            isFavorite=str(item.resolve()) in self.favorites
                        ))
                    except (PermissionError, OSError) as e:
                        logger.debug(f"Skipped item {item.name}: {e}")
                        continue
            except PermissionError:
                logger.warning(f"No permission to list: {current_path}")
                return [], str(current_path)
            
            return items, str(current_path)
            
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return [], str(path)
    
    def rename_file(self, old_path: str, new_name: str) -> bool:
        """Rename a file or folder"""
        try:
            old_path = Path(old_path).resolve()
            new_path = old_path.parent / new_name
            
            # Safety checks
            if not str(old_path).startswith(str(self.base_path.resolve())):
                raise PermissionError("Path outside allowed directory")
            if not old_path.exists():
                raise FileNotFoundError(f"Path not found: {old_path}")
            if new_path.exists():
                raise FileExistsError(f"Target already exists: {new_path}")
            
            old_path.rename(new_path)
            
            # Update favorites if this was favorited
            if str(old_path) in self.favorites:
                self.favorites.discard(str(old_path))
                self.favorites.add(str(new_path))
                self._save_metadata()
            
            logger.info(f"Renamed: {old_path.name} -> {new_name}")
            return True
        except Exception as e:
            logger.error(f"Rename error: {e}")
            return False
    
    def delete_file(self, path: str) -> bool:
        """Delete a file or empty folder"""
        try:
            path = Path(path).resolve()
            
            # Safety checks
            if not str(path).startswith(str(self.base_path.resolve())):
                raise PermissionError("Path outside allowed directory")
            if not path.exists():
                raise FileNotFoundError(f"Path not found: {path}")
            
            if path.is_file():
                path.unlink()
            elif path.is_dir():
                if list(path.iterdir()):
                    raise OSError("Directory not empty")
                path.rmdir()
            else:
                raise ValueError("Unknown path type")
            
            # Update favorites
            if str(path) in self.favorites:
                self.favorites.discard(str(path))
                self._save_metadata()
            
            logger.info(f"Deleted: {path}")
            return True
        except Exception as e:
            logger.error(f"Delete error: {e}")
            return False
    
    def get_file_properties(self, path: str) -> Dict[str, Any]:
        """Get detailed file properties"""
        try:
            path = Path(path).resolve()
            if not path.exists():
                return {"error": "Path not found"}
            
            stat = path.stat()
            return {
                "name": path.name,
                "path": str(path),
                "type": "folder" if path.is_dir() else "file",
                "size": stat.st_size,
                "sizeFormatted": self._format_size(stat.st_size),
                "created": datetime.fromtimestamp(
                    stat.st_ctime, tz=timezone.utc
                ).isoformat(),
                "modified": datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                ).isoformat(),
                "extension": path.suffix.lower() if path.is_file() else "",
                "isFavorite": str(path) in self.favorites,
                "isReadOnly": not os.access(path, os.W_OK),
                "itemCount": len(list(path.iterdir())) if path.is_dir() else 0
            }
        except Exception as e:
            logger.error(f"Error getting properties: {e}")
            return {"error": str(e)}
    
    def toggle_favorite(self, path: str) -> bool:
        """Toggle favorite status for a path"""
        try:
            path = Path(path).resolve()
            path_str = str(path)
            
            if path_str in self.favorites:
                self.favorites.discard(path_str)
            else:
                self.favorites.add(path_str)
            
            self._save_metadata()
            return path_str in self.favorites
        except Exception as e:
            logger.error(f"Favorite toggle error: {e}")
            return False
    
    def add_recent(self, path: str) -> None:
        """Add path to recently accessed list"""
        try:
            path = Path(path).resolve()
            path_str = str(path)
            timestamp = datetime.now(timezone.utc).timestamp()
            
            # Remove if already exists
            self.recents = [
                (p, t) for p, t in self.recents if p != path_str
            ]
            
            # Add to front
            self.recents.insert(0, (path_str, timestamp))
            
            # Keep last 50
            self.recents = self.recents[:50]
            self._save_metadata()
        except Exception as e:
            logger.debug(f"Recent add error: {e}")
    
    def get_favorites(self) -> List[FolderInfo]:
        """Get list of favorite folders"""
        result = []
        for fav_path in sorted(self.favorites):
            try:
                path = Path(fav_path)
                if path.exists() and path.is_dir():
                    stat = path.stat()
                    result.append(FolderInfo(
                        path=str(path),
                        name=path.name,
                        modifiedTime=datetime.fromtimestamp(
                            stat.st_mtime, tz=timezone.utc
                        ).isoformat(),
                        fileCount=len(list(path.iterdir())),
                        isFavorite=True
                    ))
                else:
                    self.favorites.discard(fav_path)
            except Exception:
                continue
        
        if self.favorites != {f.path for f in result}:
            self._save_metadata()
        
        return result
    
    def get_recents(self, limit: int = 10) -> List[FolderInfo]:
        """Get recently accessed folders"""
        result = []
        seen = set()
        
        for path_str, _ in self.recents:
            if len(result) >= limit:
                break
            if path_str in seen:
                continue
            
            try:
                path = Path(path_str)
                if path.exists() and path.is_dir():
                    seen.add(path_str)
                    stat = path.stat()
                    result.append(FolderInfo(
                        path=str(path),
                        name=path.name,
                        modifiedTime=datetime.fromtimestamp(
                            stat.st_mtime, tz=timezone.utc
                        ).isoformat(),
                        fileCount=len(list(path.iterdir())),
                        isFavorite=path_str in self.favorites
                    ))
            except Exception:
                continue
        
        return result
    
    @staticmethod
    def _format_size(size: int) -> str:
        """Format bytes to human readable size"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} PB"


# ============================================================================
# PLUGIN SCANNER - VST/AU plugin discovery
# ============================================================================

class PluginScanner:
    """Scans and discovers VST/AU plugins on the system"""
    
    def __init__(self, cache_dir: str = ""):
        self.cache_dir = Path(cache_dir) if cache_dir else (
            Path.home() / '.codette' / 'plugin_cache'
        )
        self.cache_dir.mkdir(exist_ok=True, parents=True)
        self.cache_file = self.cache_dir / 'plugins.json'
        self.scan_lock = asyncio.Lock()
        self.plugin_cache: Dict[str, PluginInfo] = {}
        self._load_cache()
    
    def _load_cache(self):
        """Load cached plugin list"""
        if self.cache_file.exists():
            try:
                data = json.loads(self.cache_file.read_text())
                self.plugin_cache = {
                    k: PluginInfo(**v) for k, v in data.items()
                }
                logger.info(f"Loaded {len(self.plugin_cache)} cached plugins")
            except Exception as e:
                logger.warning(f"Failed to load plugin cache: {e}")
    
    def _save_cache(self):
        """Save plugin list to cache"""
        try:
            data = {
                k: v.model_dump() for k, v in self.plugin_cache.items()
            }
            self.cache_file.write_text(json.dumps(data, indent=2))
        except Exception as e:
            logger.error(f"Failed to save plugin cache: {e}")
    
    @staticmethod
    def _get_plugin_paths() -> List[Path]:
        """Get standard plugin directories for the platform"""
        system = platform.system()
        paths = []
        
        if system == 'Windows':
            # VST3
            paths.extend([
                Path(os.environ.get('APPDATA', '')) / 'VST3',
                Path(os.environ.get('ProgramFiles', 'C:\\Program Files')) / 'Common Files' / 'VST3',
                Path(os.environ.get('ProgramFiles', 'C:\\Program Files')) / 'VstPlugins',
                Path(os.environ.get('ProgramFiles', 'C:\\Program Files')) / 'Steinberg' / 'VstPlugins',
                # VST2 (legacy)
                Path(os.environ.get('ProgramFiles', 'C:\\Program Files')) / 'Common Files' / 'VST2',
                Path(os.environ.get('APPDATA', '')) / 'VST',
            ])
        elif system == 'Darwin':  # macOS
            paths.extend([
                Path.home() / 'Library' / 'Audio' / 'Plug-Ins' / 'VST3',
                Path('/Library/Audio/Plug-Ins/VST3'),
                Path.home() / 'Library' / 'Audio' / 'Plug-Ins' / 'Components',
                Path('/Library/Audio/Plug-Ins/Components'),
            ])
        elif system == 'Linux':
            paths.extend([
                Path.home() / '.vst3',
                Path.home() / '.vst',
                Path('/usr/lib/vst3'),
                Path('/usr/lib/vst'),
                Path('/usr/local/lib/vst3'),
            ])
        
        return [p for p in paths if p.exists()]
    
    async def scan_plugins(self, force_rescan: bool = False) -> List[PluginInfo]:
        """
        Scan for plugins in standard directories
        
        Args:
            force_rescan: Force rescan even if cache exists
        
        Returns:
            List of discovered plugins
        """
        async with self.scan_lock:
            if not force_rescan and self.plugin_cache:
                return list(self.plugin_cache.values())
            
            logger.info("Starting plugin scan...")
            plugins = {}
            
            for plugin_dir in self._get_plugin_paths():
                try:
                    for item in plugin_dir.rglob('*'):
                        if item.suffix.lower() in ['.vst3', '.vst', '.au', '.dll', '.so', '.dylib']:
                            try:
                                plugin_id = str(item.resolve())
                                plugin = PluginInfo(
                                    id=plugin_id,
                                    name=item.stem,
                                    manufacturer="Unknown",
                                    category="utility",
                                    path=str(item),
                                    formats=self._detect_formats(item)
                                )
                                plugins[plugin_id] = plugin
                            except Exception:
                                continue
                except (PermissionError, OSError):
                    logger.debug(f"Skipped directory: {plugin_dir}")
                    continue
            
            self.plugin_cache = plugins
            self._save_cache()
            logger.info(f"Plugin scan complete: found {len(plugins)} plugins")
            return list(plugins.values())
    
    @staticmethod
    def _detect_formats(path: Path) -> List[str]:
        """Detect plugin format from file"""
        suffix = path.suffix.lower()
        if suffix == '.vst3':
            return ['VST3']
        elif suffix == '.vst':
            return ['VST2']
        elif suffix == '.au':
            return ['AU']
        elif suffix == '.dll':
            return ['VST2', 'VST3']
        elif suffix in ['.so', '.dylib']:
            return ['VST2', 'VST3']
        return ['Unknown']
    
    def get_plugin_by_id(self, plugin_id: str) -> Optional[PluginInfo]:
        """Get plugin info by ID"""
        return self.plugin_cache.get(plugin_id)
    
    def get_plugins_by_category(self, category: str) -> List[PluginInfo]:
        """Get all plugins in a category"""
        return [p for p in self.plugin_cache.values() if p.category == category]


# ============================================================================
# PLUGIN PRESET MANAGER
# ============================================================================

class PluginPresetManager:
    """Manages plugin presets with persistence"""
    
    def __init__(self, base_dir: str = ""):
        self.base_dir = Path(base_dir) if base_dir else (
            Path.home() / '.codette' / 'plugin_presets'
        )
        self.base_dir.mkdir(exist_ok=True, parents=True)
        self.presets: Dict[str, PluginPreset] = {}
        self._load_all_presets()
    
    def _load_all_presets(self):
        """Load all presets from disk"""
        try:
            for preset_file in self.base_dir.glob('**/*.json'):
                try:
                    data = json.loads(preset_file.read_text())
                    preset = PluginPreset(**data)
                    self.presets[preset.id] = preset
                except Exception as e:
                    logger.warning(f"Failed to load preset {preset_file}: {e}")
        except Exception as e:
            logger.error(f"Error loading presets: {e}")
    
    def _get_preset_path(self, plugin_id: str, preset_id: str) -> Path:
        """Get file path for a preset"""
        plugin_dir = self.base_dir / plugin_id.replace('/', '_').replace('\\', '_')
        plugin_dir.mkdir(exist_ok=True, parents=True)
        return plugin_dir / f"{preset_id}.json"
    
    def create_preset(
        self,
        plugin_id: str,
        name: str,
        data: Dict[str, Any],
        description: str = "",
        tags: List[str] = None
    ) -> PluginPreset:
        """Create and save a new preset"""
        import uuid
        
        try:
            preset_id = str(uuid.uuid4())[:8]
            now = datetime.now(timezone.utc).isoformat()
            
            preset = PluginPreset(
                id=preset_id,
                pluginId=plugin_id,
                name=name,
                description=description,
                data=data,
                createdAt=now,
                modifiedAt=now,
                tags=tags or []
            )
            
            # Save to disk
            path = self._get_preset_path(plugin_id, preset_id)
            path.write_text(json.dumps(preset.model_dump(), indent=2))
            
            self.presets[preset_id] = preset
            logger.info(f"Created preset: {plugin_id}/{name}")
            return preset
        except Exception as e:
            logger.error(f"Error creating preset: {e}")
            raise
    
    def update_preset(self, preset_id: str, **updates) -> Optional[PluginPreset]:
        """Update a preset"""
        try:
            if preset_id not in self.presets:
                return None
            
            preset = self.presets[preset_id]
            
            # Update allowed fields
            if 'name' in updates:
                preset.name = updates['name']
            if 'description' in updates:
                preset.description = updates['description']
            if 'data' in updates:
                preset.data = updates['data']
            if 'tags' in updates:
                preset.tags = updates['tags']
            
            preset.modifiedAt = datetime.now(timezone.utc).isoformat()
            
            # Save to disk
            path = self._get_preset_path(preset.pluginId, preset_id)
            path.write_text(json.dumps(preset.model_dump(), indent=2))
            
            logger.info(f"Updated preset: {preset_id}")
            return preset
        except Exception as e:
            logger.error(f"Error updating preset: {e}")
            return None
    
    def delete_preset(self, preset_id: str) -> bool:
        """Delete a preset"""
        try:
            if preset_id not in self.presets:
                return False
            
            preset = self.presets[preset_id]
            path = self._get_preset_path(preset.pluginId, preset_id)
            
            if path.exists():
                path.unlink()
            
            del self.presets[preset_id]
            logger.info(f"Deleted preset: {preset_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting preset: {e}")
            return False
    
    def get_preset(self, preset_id: str) -> Optional[PluginPreset]:
        """Get preset by ID"""
        return self.presets.get(preset_id)
    
    def get_plugin_presets(self, plugin_id: str) -> List[PluginPreset]:
        """Get all presets for a plugin"""
        return [
            p for p in self.presets.values()
            if p.pluginId == plugin_id
        ]
    
    def search_presets(self, query: str) -> List[PluginPreset]:
        """Search presets by name or tags"""
        query = query.lower()
        results = []
        
        for preset in self.presets.values():
            if (query in preset.name.lower() or
                query in preset.description.lower() or
                any(query in tag.lower() for tag in preset.tags)):
                results.append(preset)
        
        return results


# ============================================================================
# SINGLETON INSTANCES
# ============================================================================

_file_system_manager: Optional[FileSystemManager] = None
_plugin_scanner: Optional[PluginScanner] = None
_preset_manager: Optional[PluginPresetManager] = None


def get_file_system_manager() -> FileSystemManager:
    """Get or create FileSystemManager singleton"""
    global _file_system_manager
    if _file_system_manager is None:
        _file_system_manager = FileSystemManager()
    return _file_system_manager


def get_plugin_scanner() -> PluginScanner:
    """Get or create PluginScanner singleton"""
    global _plugin_scanner
    if _plugin_scanner is None:
        _plugin_scanner = PluginScanner()
    return _plugin_scanner


def get_preset_manager() -> PluginPresetManager:
    """Get or create PluginPresetManager singleton"""
    global _preset_manager
    if _preset_manager is None:
        _preset_manager = PluginPresetManager()
    return _preset_manager
