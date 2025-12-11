#!/usr/bin/env python3
"""Add missing server startup code to codette_server_unified.py"""

startup_code = '''

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8000))
    
    logger.info("")
    logger.info("="*70)
    logger.info(" STARTING UVICORN SERVER")
    logger.info("="*70)
    logger.info(f" Host: 0.0.0.0")
    logger.info(f" Port: {port}")
    logger.info(f" Docs: http://localhost:{port}/docs")
    logger.info(f" Health: http://localhost:{port}/health")
    logger.info("="*70)
    logger.info("")
    
    # Start server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True,
        use_colors=True
    )
'''

with open('codette_server_unified.py', 'a', encoding='utf-8') as f:
    f.write(startup_code)

print("[SUCCESS] Added server startup code to codette_server_unified.py")
