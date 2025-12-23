"""
Codette REST API Endpoints - Integration with FastAPI server

To integrate these endpoints, add the following to codette_server_unified.py after imports:

    from codette_backend_extensions import (
        get_file_system_manager,
        get_plugin_scanner,
        get_preset_manager,
        FileItem,
        FileSystemManager,
        PluginScanner,
        PluginPresetManager,
        FileItem,
        FolderInfo,
        PluginInfo,
        PluginPreset,
        BatchImportRequest
    )

Then add these endpoint functions before the "if __name__" block in that file.
This file documents the endpoints and provides the registration function.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# FILE SYSTEM ENDPOINTS
# ============================================================================

def register_file_system_endpoints(app: FastAPI):
    """Register file system endpoints to FastAPI app"""
    
    from codette_backend_extensions import get_file_system_manager
    
    @app.get("/api/files/list")
    async def list_files(path: str = ""):
        """
        List files and folders at given path
        
        Query Parameters:
            path (str): Directory path. Empty string for home directory.
        
        Returns:
            {
                "files": List[FileItem],
                "currentPath": str
            }
        """
        try:
            mgr = get_file_system_manager()
            items, current = mgr.list_files(path or "")
            
            # Add recent tracking
            if path:
                mgr.add_recent(path)
            
            return {
                "files": [item.model_dump() for item in items],
                "currentPath": current
            }
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/api/files/rename")
    async def rename_file(oldPath: str, newName: str):
        """
        Rename a file or folder
        
        Query Parameters:
            oldPath (str): Full path to file/folder
            newName (str): New name (not full path)
        
        Returns:
            {"success": bool}
        """
        try:
            mgr = get_file_system_manager()
            success = mgr.rename_file(oldPath, newName)
            if not success:
                raise HTTPException(status_code=400, detail="Rename failed")
            return {"success": success}
        except Exception as e:
            logger.error(f"Error renaming file: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.delete("/api/files/{file_id}")
    async def delete_file(file_id: str):
        """
        Delete a file or empty folder
        
        Path Parameters:
            file_id (str): URL-encoded file path
        
        Returns:
            {"success": bool}
        """
        try:
            from urllib.parse import unquote
            path = unquote(file_id)
            mgr = get_file_system_manager()
            success = mgr.delete_file(path)
            if not success:
                raise HTTPException(status_code=400, detail="Delete failed")
            return {"success": success}
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.get("/api/files/properties")
    async def get_file_properties(path: str):
        """
        Get detailed file properties
        
        Query Parameters:
            path (str): Full path to file/folder
        
        Returns:
            Dict with name, path, type, size, dates, etc.
        """
        try:
            mgr = get_file_system_manager()
            props = mgr.get_file_properties(path)
            return props
        except Exception as e:
            logger.error(f"Error getting properties: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/api/files/favorite")
    async def toggle_favorite(path: str):
        """
        Toggle favorite status for a path
        
        Query Parameters:
            path (str): Full path to file/folder
        
        Returns:
            {"isFavorite": bool}
        """
        try:
            mgr = get_file_system_manager()
            is_favorite = mgr.toggle_favorite(path)
            return {"isFavorite": is_favorite}
        except Exception as e:
            logger.error(f"Error toggling favorite: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    logger.info("[OK] File system endpoints registered")


# ============================================================================
# FAVORITES & RECENTS ENDPOINTS
# ============================================================================

def register_favorites_endpoints(app: FastAPI):
    """Register favorites and recents endpoints"""
    
    from codette_backend_extensions import get_file_system_manager
    
    @app.get("/api/folders/favorites")
    async def get_favorites():
        """
        Get list of favorite folders
        
        Returns:
            {
                "folders": List[FolderInfo]
            }
        """
        try:
            mgr = get_file_system_manager()
            favorites = mgr.get_favorites()
            return {
                "folders": [f.model_dump() for f in favorites]
            }
        except Exception as e:
            logger.error(f"Error getting favorites: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.get("/api/folders/recents")
    async def get_recents(limit: int = 10):
        """
        Get recently accessed folders
        
        Query Parameters:
            limit (int): Maximum number of recents to return (default 10)
        
        Returns:
            {
                "folders": List[FolderInfo]
            }
        """
        try:
            mgr = get_file_system_manager()
            recents = mgr.get_recents(limit)
            return {
                "folders": [f.model_dump() for f in recents]
            }
        except Exception as e:
            logger.error(f"Error getting recents: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    logger.info("[OK] Favorites & recents endpoints registered")


# ============================================================================
# PLUGIN SCANNING ENDPOINTS
# ============================================================================

def register_plugin_endpoints(app: FastAPI):
    """Register plugin scanning endpoints"""
    
    from codette_backend_extensions import get_plugin_scanner
    
    @app.post("/api/plugins/scan")
    async def scan_plugins(force: bool = False):
        """
        Scan for VST/AU plugins on the system
        
        Query Parameters:
            force (bool): Force rescan (ignores cache)
        
        Returns:
            {
                "plugins": List[PluginInfo],
                "count": int
            }
        """
        try:
            scanner = get_plugin_scanner()
            plugins = await scanner.scan_plugins(force_rescan=force)
            return {
                "plugins": [p.model_dump() for p in plugins],
                "count": len(plugins)
            }
        except Exception as e:
            logger.error(f"Error scanning plugins: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/api/plugins")
    async def get_plugins():
        """
        Get cached list of plugins (from last scan)
        
        Returns:
            {
                "plugins": List[PluginInfo],
                "count": int
            }
        """
        try:
            scanner = get_plugin_scanner()
            plugins = list(scanner.plugin_cache.values())
            return {
                "plugins": [p.model_dump() for p in plugins],
                "count": len(plugins)
            }
        except Exception as e:
            logger.error(f"Error getting plugins: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.get("/api/plugins/category/{category}")
    async def get_plugins_by_category(category: str):
        """
        Get plugins by category
        
        Path Parameters:
            category (str): Plugin category (eq, dynamics, reverb, etc.)
        
        Returns:
            {
                "plugins": List[PluginInfo],
                "category": str,
                "count": int
            }
        """
        try:
            scanner = get_plugin_scanner()
            plugins = scanner.get_plugins_by_category(category)
            return {
                "plugins": [p.model_dump() for p in plugins],
                "category": category,
                "count": len(plugins)
            }
        except Exception as e:
            logger.error(f"Error getting plugins by category: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    logger.info("[OK] Plugin endpoints registered")


# ============================================================================
# PLUGIN PRESET ENDPOINTS
# ============================================================================

def register_preset_endpoints(app: FastAPI):
    """Register plugin preset endpoints"""
    
    from codette_backend_extensions import get_preset_manager, PluginPreset
    
    @app.post("/api/plugins/{plugin_id}/presets")
    async def create_preset(
        plugin_id: str,
        name: str,
        data: Dict[str, Any],
        description: str = "",
        tags: List[str] = None
    ):
        """
        Create a new plugin preset
        
        Path Parameters:
            plugin_id (str): Plugin identifier
        
        Query Parameters:
            name (str): Preset name
            data (dict): Serialized preset data
            description (str): Optional description
            tags (List[str]): Optional tags
        
        Returns:
            PluginPreset with created timestamp
        """
        try:
            mgr = get_preset_manager()
            preset = mgr.create_preset(
                plugin_id, name, data, description, tags
            )
            return preset.model_dump()
        except Exception as e:
            logger.error(f"Error creating preset: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.get("/api/plugins/{plugin_id}/presets")
    async def get_plugin_presets(plugin_id: str):
        """
        Get all presets for a plugin
        
        Path Parameters:
            plugin_id (str): Plugin identifier
        
        Returns:
            {
                "pluginId": str,
                "presets": List[PluginPreset]
            }
        """
        try:
            mgr = get_preset_manager()
            presets = mgr.get_plugin_presets(plugin_id)
            return {
                "pluginId": plugin_id,
                "presets": [p.model_dump() for p in presets]
            }
        except Exception as e:
            logger.error(f"Error getting presets: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.put("/api/plugins/{plugin_id}/presets/{preset_id}")
    async def update_preset(
        plugin_id: str,
        preset_id: str,
        name: str = None,
        description: str = None,
        data: Dict[str, Any] = None,
        tags: List[str] = None
    ):
        """
        Update a plugin preset
        
        Path Parameters:
            plugin_id (str): Plugin identifier
            preset_id (str): Preset identifier
        
        Query Parameters:
            name (str): New preset name
            description (str): New description
            data (dict): New preset data
            tags (List[str]): New tags
        
        Returns:
            Updated PluginPreset
        """
        try:
            mgr = get_preset_manager()
            updates = {}
            if name is not None:
                updates['name'] = name
            if description is not None:
                updates['description'] = description
            if data is not None:
                updates['data'] = data
            if tags is not None:
                updates['tags'] = tags
            
            preset = mgr.update_preset(preset_id, **updates)
            if not preset:
                raise HTTPException(status_code=404, detail="Preset not found")
            return preset.model_dump()
        except Exception as e:
            logger.error(f"Error updating preset: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.delete("/api/plugins/{plugin_id}/presets/{preset_id}")
    async def delete_preset(plugin_id: str, preset_id: str):
        """
        Delete a plugin preset
        
        Path Parameters:
            plugin_id (str): Plugin identifier
            preset_id (str): Preset identifier
        
        Returns:
            {"success": bool}
        """
        try:
            mgr = get_preset_manager()
            success = mgr.delete_preset(preset_id)
            if not success:
                raise HTTPException(status_code=404, detail="Preset not found")
            return {"success": success}
        except Exception as e:
            logger.error(f"Error deleting preset: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.get("/api/presets/search")
    async def search_presets(query: str):
        """
        Search presets by name, description, or tags
        
        Query Parameters:
            query (str): Search query
        
        Returns:
            {
                "query": str,
                "presets": List[PluginPreset]
            }
        """
        try:
            mgr = get_preset_manager()
            presets = mgr.search_presets(query)
            return {
                "query": query,
                "presets": [p.model_dump() for p in presets]
            }
        except Exception as e:
            logger.error(f"Error searching presets: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    logger.info("[OK] Preset endpoints registered")


# ============================================================================
# BATCH IMPORT ENDPOINT
# ============================================================================

def register_batch_import_endpoint(app: FastAPI):
    """Register batch file import endpoint"""
    
    from codette_backend_extensions import BatchImportRequest
    
    @app.post("/api/batch/import")
    async def batch_import(request: BatchImportRequest):
        """
        Import multiple files to the DAW
        
        Request Body:
            {
                "files": List[str],  # File paths
                "targetTrackId": Optional[str],
                "insertMode": str  # 'replace' or 'append'
            }
        
        Returns:
            {
                "success": bool,
                "imported": List[str],
                "failed": List[str],
                "count": int
            }
        """
        try:
            imported = []
            failed = []
            
            # This would integrate with your DAW engine
            # For now, validate files
            from pathlib import Path
            
            for file_path in request.files:
                try:
                    path = Path(file_path)
                    if path.exists() and path.is_file():
                        imported.append(str(path))
                    else:
                        failed.append(file_path)
                except Exception as e:
                    logger.debug(f"File validation error: {e}")
                    failed.append(file_path)
            
            return {
                "success": len(imported) > 0,
                "imported": imported,
                "failed": failed,
                "count": len(imported)
            }
        except Exception as e:
            logger.error(f"Error importing files: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    logger.info("[OK] Batch import endpoint registered")


# ============================================================================
# REGISTRATION HELPER - Call this in codette_server_unified.py startup
# ============================================================================

def register_all_endpoints(app: FastAPI):
    """
    Register all backend extension endpoints
    
    Usage in codette_server_unified.py:
        from codette_backend_endpoints import register_all_endpoints
        
        # After creating app = FastAPI(...)
        register_all_endpoints(app)
    """
    logger.info("")
    logger.info("Registering Backend Extension Endpoints...")
    logger.info("=" * 70)
    
    try:
        register_file_system_endpoints(app)
        register_favorites_endpoints(app)
        register_plugin_endpoints(app)
        register_preset_endpoints(app)
        register_batch_import_endpoint(app)
        
        logger.info("=" * 70)
        logger.info("[OK] All backend endpoints registered successfully")
        logger.info("")
        return True
    except Exception as e:
        logger.error(f"[X] Failed to register endpoints: {e}")
        return False
