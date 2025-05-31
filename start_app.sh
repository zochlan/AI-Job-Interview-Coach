#!/bin/bash
echo "Starting AI Job Interview Coach..."

# Check if Ollama is running with the llama3 model
echo "Checking Ollama..."
python start_ollama.py

# Start the backend server
echo "Starting backend server..."
cd app/backend && python -m flask run &
BACKEND_PID=$!

# Wait for the backend to start
echo "Waiting for backend to start..."
sleep 5

# Start the frontend server
echo "Starting frontend server..."
cd ../../frontend && npm start &
FRONTEND_PID=$!

echo "AI Job Interview Coach is starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"

# Wait for user to press Ctrl+C
echo "Press Ctrl+C to stop all servers"
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
