#!/bin/bash

# Test Traces Script
# This script runs both trace tests with proper environment loading

echo "🧪 Running Arize Trace Tests..."
echo "================================"

echo ""
echo "1️⃣ Running Synthetic Trace Test..."
node test_production_traces.js

echo ""
echo "2️⃣ Running Real API Trace Test..."
node test_production_traces_real.js

echo ""
echo "✅ All trace tests completed!"
echo "📊 Check your Arize dashboard for new traces."
