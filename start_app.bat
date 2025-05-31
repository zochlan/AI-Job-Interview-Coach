@echo off
echo Starting AI Job Interview Coach...

REM Check if Ollama is running with the llama3 model
echo Checking Ollama...
python start_ollama.py

REM Start the backend server
echo Starting backend server...
start cmd /k "cd app\backend && python -m flask run"

REM Wait for the backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak

REM Start the frontend server
echo Starting frontend server...
start cmd /k "cd frontend && npm start"

echo AI Job Interview Coach is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
