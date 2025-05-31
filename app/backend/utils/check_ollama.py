"""
Utility script to check Ollama status and provide helpful error messages.
This can be run directly to diagnose Ollama issues.
"""

import requests
import subprocess
import sys
import os
import platform
import logging
import time
from typing import Tuple, Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3"
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

def check_ollama_installed() -> bool:
    """Check if Ollama is installed on the system."""
    try:
        print("Checking if Ollama is installed...")
        if platform.system() == "Windows":
            print("Running on Windows, using 'where' command")
            result = subprocess.run(
                ["where", "ollama"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        else:
            print("Running on non-Windows, using 'which' command")
            result = subprocess.run(
                ["which", "ollama"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        is_installed = result.returncode == 0
        print(f"Ollama installed: {is_installed}")
        if result.stdout:
            print(f"Stdout: {result.stdout}")
        if result.stderr:
            print(f"Stderr: {result.stderr}")
        return is_installed
    except Exception as e:
        print(f"Error checking if Ollama is installed: {e}")
        logger.error(f"Error checking if Ollama is installed: {e}")
        return False

def check_ollama_running(base_url: str = DEFAULT_BASE_URL) -> bool:
    """Check if Ollama server is running."""
    try:
        response = requests.get(f"{base_url}/api/version", timeout=5)
        return response.status_code == 200
    except Exception as e:
        logger.debug(f"Ollama server check failed: {e}")
        return False

def get_available_models(base_url: str = DEFAULT_BASE_URL) -> list:
    """Get list of available models."""
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=10)
        if response.status_code != 200:
            logger.warning(f"Failed to get models: {response.status_code}")
            return []

        models = response.json().get("models", [])
        return [m.get("name", "") for m in models]
    except Exception as e:
        logger.error(f"Error getting available models: {e}")
        return []

def is_model_available(model_name: str, base_url: str = DEFAULT_BASE_URL) -> bool:
    """Check if a specific model is available."""
    models = get_available_models(base_url)
    return any(name == model_name or name.startswith(f"{model_name}:") for name in models)

def start_ollama() -> bool:
    """Attempt to start Ollama as a background process."""
    try:
        # Determine the correct command based on the OS
        if platform.system() == "Windows":
            # On Windows, start Ollama in a new window
            subprocess.Popen(
                ["start", "ollama", "serve"],
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        else:
            # On Unix-like systems, start Ollama in the background
            subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

        # Wait for Ollama to start
        for _ in range(10):  # Try for 10 seconds
            time.sleep(1)
            if check_ollama_running():
                logger.info("Ollama started successfully")
                return True

        logger.error("Failed to start Ollama within timeout")
        return False
    except Exception as e:
        logger.error(f"Error starting Ollama: {e}")
        return False

def pull_model(model_name: str) -> bool:
    """Pull a model from Ollama library."""
    try:
        logger.info(f"Pulling model {model_name}...")
        result = subprocess.run(
            ["ollama", "pull", model_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False
        )

        if result.returncode == 0:
            logger.info(f"Successfully pulled model {model_name}")
            return True
        else:
            logger.error(f"Failed to pull model {model_name}: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"Error pulling model {model_name}: {e}")
        return False

def check_ollama_status(model_name: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Check the status of Ollama and the specified model.

    Returns:
        Dict with keys:
            - installed: bool
            - running: bool
            - model_available: bool
            - models: list of available models
            - status: overall status message
            - action: recommended action
    """
    status = {
        "installed": False,
        "running": False,
        "model_available": False,
        "models": [],
        "status": "Unknown",
        "action": "Unknown"
    }

    # Check if Ollama is installed
    status["installed"] = check_ollama_installed()
    if not status["installed"]:
        status["status"] = "Ollama is not installed"
        status["action"] = "Please install Ollama from https://ollama.ai/download"
        return status

    # Check if Ollama is running
    status["running"] = check_ollama_running()
    if not status["running"]:
        status["status"] = "Ollama is installed but not running"
        status["action"] = "Start Ollama by running 'ollama serve' in a terminal"
        return status

    # Get available models
    status["models"] = get_available_models()

    # Check if the specified model is available
    status["model_available"] = is_model_available(model_name)
    if not status["model_available"]:
        status["status"] = f"Ollama is running but model '{model_name}' is not available"
        status["action"] = f"Pull the model by running 'ollama pull {model_name}'"
        return status

    # All checks passed
    status["status"] = f"Ollama is running with model '{model_name}' available"
    status["action"] = "No action needed"
    return status

def fix_ollama_issues(model_name: str = DEFAULT_MODEL) -> Tuple[bool, str]:
    """
    Attempt to fix Ollama issues automatically.

    Returns:
        Tuple of (success, message)
    """
    # Check current status
    status = check_ollama_status(model_name)

    # If everything is fine, return success
    if status["installed"] and status["running"] and status["model_available"]:
        return True, "Ollama is running correctly with the required model"

    # If Ollama is not installed, we can't fix that
    if not status["installed"]:
        return False, "Ollama is not installed. Please install it from https://ollama.ai/download"

    # If Ollama is not running, try to start it
    if not status["running"]:
        if start_ollama():
            logger.info("Successfully started Ollama")
        else:
            return False, "Failed to start Ollama. Please start it manually by running 'ollama serve'"

    # Check if model is available, if not try to pull it
    if not is_model_available(model_name):
        if pull_model(model_name):
            logger.info(f"Successfully pulled model {model_name}")
        else:
            return False, f"Failed to pull model {model_name}. Please run 'ollama pull {model_name}' manually"

    # Check final status
    final_status = check_ollama_status(model_name)
    if final_status["installed"] and final_status["running"] and final_status["model_available"]:
        return True, "Successfully fixed Ollama issues"
    else:
        return False, "Failed to fix all Ollama issues. Please check the logs for details"

def main():
    """Main function to check Ollama status and fix issues."""
    print("Starting check_ollama.py main function")
    model_name = DEFAULT_MODEL
    if len(sys.argv) > 1:
        model_name = sys.argv[1]

    print(f"\n=== Checking Ollama Status for model '{model_name}' ===\n")
    sys.stdout.flush()  # Force output to be displayed

    # Check if Ollama is installed
    is_installed = check_ollama_installed()
    print(f"Ollama installed: {'✅' if is_installed else '❌'}")

    if not is_installed:
        print("Ollama is not installed. Please install it from https://ollama.ai/download")
        return 1

    # Check if Ollama is running
    is_running = check_ollama_running()
    print(f"Ollama running: {'✅' if is_running else '❌'}")

    if not is_running:
        print("Ollama is not running. Please start it by running 'ollama serve' in a terminal")
        print("\nWould you like to attempt to start Ollama? (y/n)")
        choice = input().lower()
        if choice.startswith('y'):
            if start_ollama():
                print("✅ Successfully started Ollama")
                is_running = True
            else:
                print("❌ Failed to start Ollama")
                return 1
        else:
            return 1

    # Get available models
    models = get_available_models()
    print(f"\nAvailable models: {len(models)}")
    for model in models:
        print(f"  - {model}")

    # Check if the specified model is available
    model_available = is_model_available(model_name)
    print(f"\nModel '{model_name}' available: {'✅' if model_available else '❌'}")

    if not model_available:
        print(f"Model '{model_name}' is not available. Please pull it by running 'ollama pull {model_name}'")
        print("\nWould you like to attempt to pull the model? (y/n)")
        choice = input().lower()
        if choice.startswith('y'):
            if pull_model(model_name):
                print(f"✅ Successfully pulled model {model_name}")
                model_available = True
            else:
                print(f"❌ Failed to pull model {model_name}")
                return 1
        else:
            return 1

    # All checks passed
    if is_installed and is_running and model_available:
        print("\n✅ Ollama is running correctly with the required model")
        return 0
    else:
        print("\n❌ There are still issues with Ollama")
        return 1

if __name__ == "__main__":
    sys.exit(main())
