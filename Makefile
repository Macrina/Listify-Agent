# Listify Agent - Makefile
# Development and testing commands

.PHONY: help install lint format test clean dev build

# Default target
help:
	@echo "Listify Agent - Available Commands:"
	@echo "=================================="
	@echo "Installation:"
	@echo "  install-backend     Install backend dependencies (Node.js + Python)"
	@echo "  install-frontend    Install frontend dependencies"
	@echo "  install-all         Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  dev                 Start both frontend and backend servers"
	@echo "  dev-backend         Start backend development server"
	@echo "  dev-frontend        Start frontend development server"
	@echo ""
	@echo "Testing:"
	@echo "  test-traces         Run Arize tracing tests"
	@echo "  test-llm-evaluations      Run LLM evaluation tests"
	@echo "  test-advanced-llm-evaluations  Run advanced LLM evaluation tests"
	@echo "  test-production     Test production API calls"
	@echo "  test-all            Run all tests"
	@echo ""
	@echo "Build:"
	@echo "  build-frontend      Build frontend for production"
	@echo "  build-all           Build all components"
	@echo ""
	@echo "Utilities:"
	@echo "  health              Check API health"
	@echo "  ports-check         Check port usage"
	@echo "  ports-kill          Kill running servers"
	@echo "  clean               Clean build artifacts and caches"

# Installation commands
install-backend:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	cd backend && python -m venv venv
	cd backend && source venv/bin/activate && pip install -r requirements.txt

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

install-all: install-backend install-frontend
	@echo "All dependencies installed!"

# Development commands
dev-backend:
	@echo "Starting backend development server..."
	cd backend && npm run dev

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

dev:
	@echo "Starting both development servers..."
	@echo "Backend will run on http://localhost:3001"
	@echo "Frontend will run on http://localhost:5173"
	@echo "Press Ctrl+C to stop both servers"
	@trap 'kill %1 %2' INT; \
	cd backend && npm run dev & \
	cd frontend && npm run dev & \
	wait

# Testing commands
test-traces:
	@echo "Running Arize tracing tests..."
	cd backend && source venv/bin/activate && python test_basic.py
	cd backend && source venv/bin/activate && python test_comprehensive_traces.py

test-llm-evaluations:
	@echo "Running LLM evaluation tests..."
	cd backend && source venv/bin/activate && python test_llm_evaluations.py

test-advanced-llm-evaluations:
	@echo "Running advanced LLM evaluation tests..."
	cd backend && source venv/bin/activate && python test_advanced_llm_evaluations.py

test-production:
	@echo "Testing production API calls..."
	node test_production_traces_real.js

test-all: test-traces test-llm-evaluations test-production
	@echo "All tests completed!"

# Build commands
build-frontend:
	@echo "Building frontend for production..."
	cd frontend && npm run build

build-all: build-frontend
	@echo "All builds completed!"

# Utility commands
health:
	@echo "Checking API health..."
	curl -s http://localhost:3001/api/health | jq . || echo "API not running"

ports-check:
	@echo "Checking port usage..."
	lsof -i :3000,3001,3002 | grep LISTEN || echo "No servers running on ports 3000-3002"

ports-kill:
	@echo "Killing running servers..."
	pkill -f 'node.*server.js' && pkill -f 'vite' || echo "No servers to kill"

# Cleanup commands
clean:
	@echo "Cleaning build artifacts and caches..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.vite
	rm -rf backend/__pycache__
	rm -rf backend/*.pyc
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleanup completed!"

# Quick development setup
setup: install-all
	@echo "Development environment setup complete!"
	@echo "Run 'make dev' to start both servers"
	@echo "Run 'make test-all' to run all tests"
	@echo "Run 'make health' to check API status"
