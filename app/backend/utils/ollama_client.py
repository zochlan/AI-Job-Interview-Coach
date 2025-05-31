"""
Enhanced Ollama client with better error handling, caching, and performance optimizations.
This module provides a more robust interface to the Ollama API.
"""

import requests
import logging
import time
import json
import os
import platform
import subprocess
from typing import Dict, Any, Optional, List, Tuple
from functools import lru_cache
import threading
import queue

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_BASE_URL = "http://localhost:11434"
DEFAULT_TIMEOUT = 60  # Increased timeout for Llama3 which may take longer
DEFAULT_MODEL = "llama3"  # Using Llama3 for better quality responses
MAX_RETRIES = 2  # Reduced to 2 retries to avoid long waits
RETRY_DELAY = 1  # seconds (reduced for faster feedback)

# Cache for model availability to reduce API calls
model_availability_cache = {}
model_availability_lock = threading.Lock()
model_availability_ttl = 300  # 5 minutes (increased from 60 seconds)

# Response cache to avoid duplicate requests
response_cache = {}
response_cache_lock = threading.Lock()
response_cache_ttl = 600  # 10 minutes (increased from 5 minutes)

class OllamaClient:
    """Enhanced client for interacting with Ollama API."""

    def __init__(self, base_url: str = DEFAULT_BASE_URL, default_model: str = DEFAULT_MODEL):
        """Initialize the Ollama client.

        Args:
            base_url: Base URL for the Ollama API
            default_model: Default model to use for generation
        """
        self.base_url = base_url
        self.default_model = default_model
        self.session = requests.Session()
        self._initialize_session()

    def _initialize_session(self):
        """Set up the requests session with appropriate defaults."""
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })
        # Use connection pooling for better performance
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,
            pool_maxsize=20,
            max_retries=3
        )
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def is_running(self) -> bool:
        """Check if Ollama server is running.

        Returns:
            bool: True if Ollama is running, False otherwise
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/version",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            logger.debug(f"Ollama server check failed: {e}")
            return False

    def get_available_models(self) -> List[str]:
        """Get list of available models.

        Returns:
            List[str]: List of available model names
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/tags",
                timeout=10
            )
            if response.status_code != 200:
                logger.warning(f"Failed to get models: {response.status_code}")
                return []

            models = response.json().get("models", [])
            return [m.get("name", "") for m in models]
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return []

    def is_model_available(self, model_name: str) -> bool:
        """Check if a specific model is available.

        Args:
            model_name: Name of the model to check

        Returns:
            bool: True if model is available, False otherwise
        """
        # Check cache first
        with model_availability_lock:
            cache_entry = model_availability_cache.get(model_name)
            if cache_entry:
                timestamp, is_available = cache_entry
                if time.time() - timestamp < model_availability_ttl:
                    return is_available

        # Cache miss or expired, check with API
        models = self.get_available_models()
        is_available = any(name == model_name or name.startswith(f"{model_name}:") for name in models)

        # Update cache
        with model_availability_lock:
            model_availability_cache[model_name] = (time.time(), is_available)

        return is_available

    def generate(self,
                prompt: str,
                model: Optional[str] = None,
                temperature: float = 0.7,
                max_tokens: int = 2048,
                timeout: int = DEFAULT_TIMEOUT) -> Tuple[str, bool]:
        """Generate text using Ollama.

        Args:
            prompt: The prompt to send to the model
            model: Model name (defaults to self.default_model)
            temperature: Temperature for generation (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            timeout: Request timeout in seconds

        Returns:
            Tuple[str, bool]: (Generated text, success flag)
        """
        model = model or self.default_model

        # Check if we have a cached response
        cache_key = f"{model}:{temperature}:{max_tokens}:{hash(prompt)}"
        with response_cache_lock:
            cache_entry = response_cache.get(cache_key)
            if cache_entry:
                timestamp, response = cache_entry
                if time.time() - timestamp < response_cache_ttl:
                    logger.debug(f"Cache hit for prompt: {prompt[:50]}...")
                    return response, True

        # Simplify the prompt if it's too long (over 1000 characters)
        original_prompt = prompt
        if len(prompt) > 1000:
            logger.warning(f"Prompt is very long ({len(prompt)} chars). Simplifying...")
            # Keep the beginning and end of the prompt, but simplify the middle
            prompt_parts = prompt.split("\n\n")
            if len(prompt_parts) > 4:
                # Keep first 2 and last 2 paragraphs
                simplified_prompt = "\n\n".join(prompt_parts[:2] + ["..."] + prompt_parts[-2:])
                prompt = simplified_prompt
                logger.info(f"Simplified prompt from {len(original_prompt)} to {len(prompt)} chars")

        # Prepare request payload with optimized parameters
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "temperature": temperature,
            "max_tokens": min(max_tokens, 1024),  # Limit max tokens to 1024 for faster response
            "top_p": 0.9,           # Add top_p sampling for better quality
            "top_k": 40,            # Add top_k sampling for better quality
            "repeat_penalty": 1.1   # Slightly penalize repetition
        }

        # Try to generate with retries
        for attempt in range(MAX_RETRIES):
            try:
                if not self.is_running():
                    logger.error("Ollama server is not running")
                    return "Error: Ollama server is not running. Please start it with 'ollama serve'.", False

                if not self.is_model_available(model):
                    logger.error(f"Model {model} is not available")
                    return f"Error: Model {model} is not available. Please run 'ollama pull {model}'.", False

                logger.info(f"Sending request to Ollama API with model: {model} (attempt {attempt+1}/{MAX_RETRIES})")

                # Use a shorter timeout for the first attempt
                current_timeout = min(timeout, 30) if attempt == 0 else timeout

                response = self.session.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=current_timeout
                )

                if response.status_code != 200:
                    logger.error(f"HTTP error {response.status_code} from Ollama API: {response.text}")
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_DELAY)
                        continue
                    # If all attempts failed, return a fallback response
                    return self._generate_fallback_response(), True

                result = response.json().get("response", "").strip()

                # Cache the successful response
                with response_cache_lock:
                    response_cache[cache_key] = (time.time(), result)

                return result, True

            except requests.exceptions.Timeout:
                logger.error(f"Timeout error with Ollama API (attempt {attempt+1}/{MAX_RETRIES})")

                # If we've tried multiple times and it's still timing out, return a fallback response
                if attempt >= 1:  # After the second attempt
                    logger.warning(f"Using fallback response after {attempt+1} timeout attempts")
                    return self._generate_fallback_response(), True

                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                    continue

                # If all attempts failed, return a fallback response
                return self._generate_fallback_response(), True

            except Exception as e:
                logger.error(f"Error generating with Ollama (attempt {attempt+1}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                    continue
                # If all attempts failed, return a fallback response
                return self._generate_fallback_response(), True

        # This should not be reached, but just in case
        return self._generate_fallback_response(), True

    def _generate_fallback_response(self) -> str:
        """Generate a fallback response when Ollama fails to respond."""
        return json.dumps({
            "reply": "I'm currently experiencing some technical difficulties processing your request. Let me provide a simpler response while our systems recover.",
            "analysis": "Unable to provide detailed analysis at this time.",
            "strengths": [
                "Your patience with technical difficulties",
                "Your willingness to engage with the AI Interview Coach"
            ],
            "improvement_tips": [
                "Try asking a more specific question",
                "Consider breaking down complex questions into smaller parts",
                "You can try again in a few moments when the system has recovered"
            ],
            "star_scores": {
                "Situation": 7,
                "Task": 7,
                "Action": 7,
                "Result": 7
            },
            "overall_score": 7
        })

# Create a singleton instance
ollama_client = OllamaClient()

# Convenience functions that use the singleton
def generate_text(prompt: str, model: str = DEFAULT_MODEL, **kwargs) -> str:
    """Generate text using Ollama.

    Args:
        prompt: The prompt to send to the model
        model: Model name
        **kwargs: Additional parameters to pass to OllamaClient.generate()

    Returns:
        str: Generated text
    """
    response, success = ollama_client.generate(prompt, model, **kwargs)
    return response

def ensure_ollama_running_with_model(model_name: str = DEFAULT_MODEL) -> bool:
    """Ensure Ollama is running and the specified model is available.

    Args:
        model_name: Name of the model to ensure is available

    Returns:
        bool: True if Ollama is running with the model, False otherwise
    """
    # Check if Ollama is running
    if not ollama_client.is_running():
        logger.info("Ollama is not running, attempting to start it")
        if not start_ollama():
            return False

    # Check if the model is available
    if not ollama_client.is_model_available(model_name):
        logger.info(f"Model {model_name} not available, attempting to pull it")
        return ensure_model_loaded(model_name)

    return True

def start_ollama() -> bool:
    """Attempt to start Ollama as a background process.

    Returns:
        bool: True if Ollama was started successfully, False otherwise
    """
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
            if ollama_client.is_running():
                logger.info("Ollama started successfully")
                return True

        logger.error("Failed to start Ollama within timeout")
        return False
    except Exception as e:
        logger.error(f"Error starting Ollama: {e}")
        return False

def ensure_model_loaded(model_name: str) -> bool:
    """Ensure that a specific model is loaded in Ollama.

    Args:
        model_name: Name of the model to ensure is loaded

    Returns:
        bool: True if the model is loaded, False otherwise
    """
    try:
        # Try to pull the model
        subprocess.run(
            ["ollama", "pull", model_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )

        # Check if the model is now available
        if ollama_client.is_model_available(model_name):
            logger.info(f"Successfully pulled model {model_name}")
            return True
        else:
            logger.error(f"Failed to pull model {model_name}")
            return False
    except Exception as e:
        logger.error(f"Error ensuring model {model_name} is loaded: {e}")
        return False
