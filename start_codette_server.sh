#!/bin/bash
# Codette AI Backend Server Startup Script (Bash version)
# Compatible with Mac, Linux, and WSL

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          Codette AI Backend Server Startup                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "📁 Project Root: $PROJECT_ROOT"
echo ""

# Parse arguments
PORT=8000
HOST="127.0.0.1"
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Step 1: Check Python
echo "🔍 Step 1: Checking Python Installation..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python not found! Please install Python 3.10 or later."
        echo "   macOS: brew install python3"
        echo "   Linux: sudo apt-get install python3"
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

PYTHON_VERSION=$($PYTHON_CMD --version)
echo "✅ Python found: $PYTHON_VERSION"
echo ""

# Step 2: Check dependencies
echo "🔍 Step 2: Checking Python Dependencies..."
REQUIRED_PACKAGES=("fastapi" "uvicorn" "pydantic" "vaderSentiment" "nltk")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if $PYTHON_CMD -c "import $package" 2>/dev/null; then
        echo "   ✅ $package"
    else
        echo "   ❌ $package - MISSING"
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Missing packages detected! Installing..."
    echo ""
    
    PACKAGE_LIST=$(IFS=' '; echo "${MISSING_PACKAGES[*]}")
    echo "Running: pip3 install $PACKAGE_LIST"
    echo ""
    
    if ! $PYTHON_CMD -m pip install "${MISSING_PACKAGES[@]}"; then
        echo "❌ Failed to install packages!"
        echo "You may need to install manually:"
        echo "   pip install $PACKAGE_LIST"
        exit 1
    fi
    echo "✅ Packages installed successfully!"
fi

# Step 3: Check Codette
echo ""
echo "🔍 Step 3: Checking Codette Installation..."
if [ -f "$PROJECT_ROOT/Codette/codette.py" ]; then
    echo "✅ Codette.py found"
else
    echo "❌ Codette.py not found at: $PROJECT_ROOT/Codette/codette.py"
    echo "   Please ensure Codette folder exists with codette.py"
fi

# Step 4: Set environment
echo ""
echo "⚙️  Step 4: Setting Environment Variables..."
export CODETTE_PORT=$PORT
export CODETTE_HOST=$HOST
export PYTHONUNBUFFERED=1

echo "   CODETTE_PORT: $PORT"
echo "   CODETTE_HOST: $HOST"
echo ""

# Step 5: Start server
echo "🚀 Step 5: Starting Codette Backend Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$DEBUG" = true ]; then
    $PYTHON_CMD -u "$PROJECT_ROOT/codette_server.py"
else
    $PYTHON_CMD -u "$PROJECT_ROOT/codette_server.py" &
    SERVER_PID=$!
    
    # Give server time to start
    sleep 2
    
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ Server failed to start"
        exit 1
    fi
    
    echo "✅ Server started successfully! (PID: $SERVER_PID)"
    echo ""
    echo "📡 Codette Backend Server is now running:"
    echo "   URL: http://$HOST:$PORT"
    echo "   Health: http://$HOST:$PORT/health"
    echo "   Docs: http://$HOST:$PORT/docs"
    echo ""
    echo "Frontend configuration:"
    echo "   Add to .env.local: VITE_CODETTE_API_URL=http://$HOST:$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    wait $SERVER_PID
fi
