#!/bin/bash
# Unified Startup Script for Listify Agent
# Handles different environments and port management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${NODE_ENV:-development}
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
API_PORT=${API_PORT:-3001}

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                   ║${NC}"
echo -e "${BLUE}║       🚀  Listify Agent Startup Script          ║${NC}"
echo -e "${BLUE}║                                                   ║${NC}"
echo -e "${BLUE}║       Environment: ${ENVIRONMENT}$(printf '%*s' $((20-${#ENVIRONMENT})) '') ║${NC}"
echo -e "${BLUE}║       Backend Port: ${BACKEND_PORT}$(printf '%*s' $((20-${#BACKEND_PORT})) '') ║${NC}"
echo -e "${BLUE}║       Frontend Port: ${FRONTEND_PORT}$(printf '%*s' $((19-${#FRONTEND_PORT})) '') ║${NC}"
echo -e "${BLUE}║                                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to find available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while ! check_port $port 2>/dev/null; do
        port=$((port + 1))
        if [ $port -gt $((start_port + 10)) ]; then
            echo -e "${RED}❌ No available ports found starting from $start_port${NC}"
            exit 1
        fi
    done
    
    echo $port
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🚀 Starting Backend Server...${NC}"
    
    # Check and find available port for backend
    if ! check_port $BACKEND_PORT; then
        BACKEND_PORT=$(find_available_port $BACKEND_PORT)
        echo -e "${YELLOW}⚠️  Using port $BACKEND_PORT for backend${NC}"
    fi
    
    cd backend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Start backend
    PORT=$BACKEND_PORT NODE_ENV=$ENVIRONMENT npm start &
    BACKEND_PID=$!
    
    cd ..
    
    # Wait for backend to start
    echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
    sleep 3
    
    # Check if backend is running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Backend started on port $BACKEND_PORT (PID: $BACKEND_PID)${NC}"
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
    
    # Check and find available port for frontend
    if ! check_port $FRONTEND_PORT; then
        FRONTEND_PORT=$(find_available_port $FRONTEND_PORT)
        echo -e "${YELLOW}⚠️  Using port $FRONTEND_PORT for frontend${NC}"
    fi
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start frontend
    VITE_PORT=$FRONTEND_PORT VITE_API_URL="http://localhost:$BACKEND_PORT" npm run dev &
    FRONTEND_PID=$!
    
    cd ..
    
    # Wait for frontend to start
    echo -e "${BLUE}⏳ Waiting for frontend to start...${NC}"
    sleep 3
    
    # Check if frontend is running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend failed to start${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Frontend started on port $FRONTEND_PORT (PID: $FRONTEND_PID)${NC}"
}

# Function to handle graceful shutdown
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
case "$1" in
    "backend")
        start_backend
        echo -e "${GREEN}🎉 Backend server running on http://localhost:$BACKEND_PORT${NC}"
        echo -e "${BLUE}Press Ctrl+C to stop${NC}"
        wait $BACKEND_PID
        ;;
    "frontend")
        start_frontend
        echo -e "${GREEN}🎉 Frontend server running on http://localhost:$FRONTEND_PORT${NC}"
        echo -e "${BLUE}Press Ctrl+C to stop${NC}"
        wait $FRONTEND_PID
        ;;
    "dev"|"development"|"")
        start_backend
        start_frontend
        
        echo -e "\n${GREEN}🎉 Development servers started successfully!${NC}"
        echo -e "${BLUE}🌐 Frontend: http://localhost:$FRONTEND_PORT${NC}"
        echo -e "${BLUE}🔧 Backend:  http://localhost:$BACKEND_PORT${NC}"
        echo -e "${BLUE}📊 Health:   http://localhost:$BACKEND_PORT/api/health${NC}"
        echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}"
        
        # Wait for both processes
        wait
        ;;
    "production")
        echo -e "${BLUE}🏭 Starting in production mode...${NC}"
        start_backend
        echo -e "${GREEN}🎉 Production server running on http://localhost:$BACKEND_PORT${NC}"
        wait $BACKEND_PID
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "${BLUE}Usage: $0 [backend|frontend|dev|production]${NC}"
        exit 1
        ;;
esac
