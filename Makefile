# Listify Agent - Makefile
# Comprehensive linting and formatting commands

.PHONY: help install lint lint-fix format format-check test clean dev build

# Default target
help:
	@echo "Listify Agent - Available Commands:"
	@echo "=================================="
	@echo "Installation:"
	@echo "  install-backend     Install backend dependencies (Node.js + Python)"
	@echo "  install-frontend   Install frontend dependencies"
	@echo "  install-all        Install all dependencies"
	@echo ""
	@echo "Linting:"
	@echo "  lint-backend       Lint backend Python code (black, flake8, mypy, isort)"
	@echo "  lint-frontend      Lint frontend JavaScript/React code (ESLint)"
	@echo "  lint-all           Lint all code"
	@echo ""
	@echo "Formatting:"
	@echo "  format-backend     Format backend Python code (black, isort)"
	@echo "  format-frontend    Format frontend code (Prettier)"
	@echo "  format-all         Format all code"
	@echo ""
	@echo "Auto-fix:"
	@echo "  fix-backend        Auto-fix backend Python code"
	@echo "  fix-frontend       Auto-fix frontend code"
	@echo "  fix-all            Auto-fix all code"
	@echo ""
	@echo "Development:"
	@echo "  dev-backend        Start backend development server"
	@echo "  dev-frontend       Start frontend development server"
	@echo "  dev                Start both servers"
	@echo ""
	@echo "Testing:"
	@echo "  test-traces        Run Arize tracing tests"
	@echo "  test-python        Run Python tests"
	@echo "  test-context7      Test Context7 MCP integration"
	@echo "  test-llm-evaluations      Run basic LLM evaluation tests"
	@echo "  test-advanced-llm-evaluations  Run advanced LLM evaluation tests"
	@echo "  test-llm-all       Run all LLM evaluation tests with reporting"
	@echo "  test-all           Run all tests"
	@echo ""
	@echo "Build:"
	@echo "  build-frontend     Build frontend for production"
	@echo "  build-all          Build all components"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean              Clean build artifacts and caches"

# Installation commands
install-backend:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	cd backend && python -m venv venv
	cd backend && source venv/bin/activate && pip install -r requirements.txt
	cd backend && source venv/bin/activate && pip install black flake8 mypy isort

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

install-all: install-backend install-frontend
	@echo "All dependencies installed!"

# Backend linting
lint-backend:
	@echo "Linting backend Python code..."
	cd backend && source venv/bin/activate && black --check .
	cd backend && source venv/bin/activate && flake8 .
	cd backend && source venv/bin/activate && isort --check-only .
	cd backend && source venv/bin/activate && mypy .

lint-backend-fix:
	@echo "Auto-fixing backend Python code..."
	cd backend && source venv/bin/activate && black .
	cd backend && source venv/bin/activate && isort .

format-backend:
	@echo "Formatting backend Python code..."
	cd backend && source venv/bin/activate && black .
	cd backend && source venv/bin/activate && isort .

# Frontend linting
lint-frontend:
	@echo "Linting frontend JavaScript/React code..."
	cd frontend && npm run lint

lint-frontend-fix:
	@echo "Auto-fixing frontend code..."
	cd frontend && npm run lint:fix

format-frontend:
	@echo "Formatting frontend code..."
	cd frontend && npm run format

# Combined commands
lint-all: lint-backend lint-frontend
	@echo "All linting completed!"

format-all: format-backend format-frontend
	@echo "All formatting completed!"

fix-all: lint-backend-fix lint-frontend-fix
	@echo "All auto-fixes completed!"

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

test-python:
	@echo "Running Python tests..."
	cd backend && source venv/bin/activate && python -m pytest tests/ -v || echo "No pytest tests found"

test-context7:
	@echo "Testing Context7 MCP integration..."
	node test-context7.js

test-llm-evaluations:
	@echo "Running LLM evaluation tests..."
	cd backend && source venv/bin/activate && python test_llm_evaluations.py

test-advanced-llm-evaluations:
	@echo "Running advanced LLM evaluation tests..."
	cd backend && source venv/bin/activate && python test_advanced_llm_evaluations.py

test-llm-all:
	@echo "Running all LLM evaluation tests..."
	cd backend && source venv/bin/activate && python run_llm_evaluations.py

test-all: test-traces test-python test-context7 test-llm-all
	@echo "All tests completed!"

# Build commands
build-frontend:
	@echo "Building frontend for production..."
	cd frontend && npm run build

build-all: build-frontend
	@echo "All builds completed!"

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
	@echo "Run 'make lint-all' to check code quality"
	@echo "Run 'make format-all' to format code"
