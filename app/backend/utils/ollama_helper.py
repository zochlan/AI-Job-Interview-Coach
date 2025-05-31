import subprocess
import requests
import logging
import time
import os
import sys
import platform

def is_ollama_running(base_url="http://localhost:11434"):
    """Check if Ollama is running by making a request to its API."""
    try:
        response = requests.get(f"{base_url}/api/version", timeout=5)
        return response.status_code == 200
    except:
        return False

def is_model_available(model_name, base_url="http://localhost:11434"):
    """Check if a specific model is available in Ollama."""
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=5)
        if response.status_code != 200:
            return False
        
        models = response.json().get("models", [])
        model_names = [m.get("name", "") for m in models]
        
        # Check if the model is available (exact match or starts with)
        return any(name == model_name or name.startswith(f"{model_name}:") for name in model_names)
    except:
        return False

def start_ollama():
    """Attempt to start Ollama as a background process."""
    try:
        # Determine the correct command based on the OS
        if platform.system() == "Windows":
            # On Windows, start Ollama in a new window
            subprocess.Popen(["start", "ollama", "serve"], 
                            shell=True, 
                            stdout=subprocess.PIPE, 
                            stderr=subprocess.PIPE)
        else:
            # On Unix-like systems, start Ollama in the background
            subprocess.Popen(["ollama", "serve"], 
                            stdout=subprocess.PIPE, 
                            stderr=subprocess.PIPE)
        
        # Wait for Ollama to start
        for _ in range(10):  # Try for 10 seconds
            time.sleep(1)
            if is_ollama_running():
                logging.info("Ollama started successfully")
                return True
        
        logging.error("Failed to start Ollama within timeout")
        return False
    except Exception as e:
        logging.error(f"Error starting Ollama: {e}")
        return False

def ensure_model_loaded(model_name, base_url="http://localhost:11434"):
    """Ensure that a specific model is loaded in Ollama."""
    try:
        if not is_model_available(model_name, base_url):
            logging.info(f"Model {model_name} not available, attempting to pull it")
            
            # Pull the model
            subprocess.run(["ollama", "pull", model_name], 
                          stdout=subprocess.PIPE, 
                          stderr=subprocess.PIPE,
                          check=True)
            
            # Check if the model is now available
            if is_model_available(model_name, base_url):
                logging.info(f"Successfully pulled model {model_name}")
                return True
            else:
                logging.error(f"Failed to pull model {model_name}")
                return False
        return True
    except Exception as e:
        logging.error(f"Error ensuring model {model_name} is loaded: {e}")
        return False

def ensure_ollama_running_with_model(model_name="llama3", base_url="http://localhost:11434"):
    """Ensure Ollama is running and the specified model is available."""
    # Check if Ollama is running
    if not is_ollama_running(base_url):
        logging.info("Ollama is not running, attempting to start it")
        if not start_ollama():
            return False
    
    # Check if the model is available
    return ensure_model_loaded(model_name, base_url)

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Get model name from command line args or use default
    model_name = sys.argv[1] if len(sys.argv) > 1 else "llama3"
    
    # Ensure Ollama is running with the specified model
    if ensure_ollama_running_with_model(model_name):
        print(f"Ollama is running with model {model_name}")
        sys.exit(0)
    else:
        print(f"Failed to ensure Ollama is running with model {model_name}")
        sys.exit(1)
