#!/bin/bash
set -e

echo "🚀 Starting StockIntel — AI Market Analysis"
echo ""

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  if [ -f backend/.env ] && grep -q "ANTHROPIC_API_KEY=your_" backend/.env 2>/dev/null; then
    echo "⚠️  Set your ANTHROPIC_API_KEY in backend/.env before running!"
    exit 1
  fi
fi

# Start backend
echo "▶ Starting backend  (http://localhost:3001)..."
cd backend && node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

# Start frontend
echo "▶ Starting frontend (http://localhost:5173)..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Running! Open → http://localhost:5173"
echo "   Press Ctrl+C to stop both servers."
echo ""

# Handle shutdown
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
