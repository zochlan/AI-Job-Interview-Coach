"""
Caching middleware for Flask routes.
Provides a simple way to cache API responses to improve performance.
"""

import time
import json
import hashlib
import logging
import functools
import threading
from typing import Dict, Any, Callable, Optional, Tuple, Union
from flask import request, Response, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache storage
_cache: Dict[str, Tuple[float, Any, int]] = {}  # {key: (timestamp, data, ttl)}
_cache_lock = threading.Lock()

def _get_cache_key(route: str, args: Dict[str, Any] = None, body: Dict[str, Any] = None) -> str:
    """
    Generate a cache key based on the route, query args, and request body.
    
    Args:
        route: The route path
        args: Query arguments
        body: Request body
        
    Returns:
        str: A unique cache key
    """
    # Create a dictionary of all parameters that affect the response
    key_parts = {
        'route': route,
        'args': args or {},
        'body': body or {}
    }
    
    # Convert to a stable string representation and hash it
    key_str = json.dumps(key_parts, sort_keys=True)
    return hashlib.md5(key_str.encode('utf-8')).hexdigest()

def _is_cache_valid(key: str) -> bool:
    """
    Check if a cache entry is valid (exists and not expired).
    
    Args:
        key: The cache key
        
    Returns:
        bool: True if the cache entry is valid, False otherwise
    """
    with _cache_lock:
        if key not in _cache:
            return False
        
        timestamp, _, ttl = _cache[key]
        if ttl > 0 and time.time() - timestamp > ttl:
            # Cache entry has expired
            del _cache[key]
            return False
        
        return True

def _get_from_cache(key: str) -> Optional[Any]:
    """
    Get a value from the cache.
    
    Args:
        key: The cache key
        
    Returns:
        Any: The cached value, or None if not found or expired
    """
    with _cache_lock:
        if not _is_cache_valid(key):
            return None
        
        _, data, _ = _cache[key]
        return data

def _set_in_cache(key: str, data: Any, ttl: int) -> None:
    """
    Set a value in the cache.
    
    Args:
        key: The cache key
        data: The data to cache
        ttl: Time to live in seconds (0 for no expiration)
    """
    with _cache_lock:
        _cache[key] = (time.time(), data, ttl)

def _clear_expired_cache() -> int:
    """
    Clear expired cache entries.
    
    Returns:
        int: Number of entries cleared
    """
    cleared = 0
    current_time = time.time()
    
    with _cache_lock:
        keys_to_delete = []
        for key, (timestamp, _, ttl) in _cache.items():
            if ttl > 0 and current_time - timestamp > ttl:
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del _cache[key]
            cleared += 1
    
    return cleared

def clear_cache() -> int:
    """
    Clear all cache entries.
    
    Returns:
        int: Number of entries cleared
    """
    with _cache_lock:
        count = len(_cache)
        _cache.clear()
    return count

def cache_route(ttl: int = 300):
    """
    Decorator to cache a Flask route response.
    
    Args:
        ttl: Time to live in seconds (0 for no expiration)
        
    Returns:
        Callable: Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Response:
            # Skip caching for non-GET requests
            if request.method != 'GET':
                return func(*args, **kwargs)
            
            # Generate cache key
            cache_key = _get_cache_key(
                request.path,
                dict(request.args),
                request.get_json(silent=True)
            )
            
            # Check if response is in cache
            cached_response = _get_from_cache(cache_key)
            if cached_response is not None:
                logger.debug(f"Cache hit for {request.path}")
                if isinstance(cached_response, dict):
                    return jsonify(cached_response)
                return cached_response
            
            # Execute the original function
            response = func(*args, **kwargs)
            
            # Cache the response
            if isinstance(response, Response):
                # For Response objects, we need to copy the data
                response_copy = response.get_data()
                _set_in_cache(cache_key, response_copy, ttl)
                return response
            else:
                # For dictionaries or other JSON-serializable objects
                _set_in_cache(cache_key, response, ttl)
                return response
        
        return wrapper
    
    return decorator

# Periodically clean up expired cache entries
def start_cache_cleanup(interval: int = 3600) -> threading.Thread:
    """
    Start a background thread to periodically clean up expired cache entries.
    
    Args:
        interval: Cleanup interval in seconds
        
    Returns:
        threading.Thread: The cleanup thread
    """
    def cleanup_task():
        while True:
            time.sleep(interval)
            cleared = _clear_expired_cache()
            if cleared > 0:
                logger.info(f"Cleared {cleared} expired cache entries")
    
    thread = threading.Thread(target=cleanup_task, daemon=True)
    thread.start()
    return thread

# Start the cleanup thread when this module is imported
cleanup_thread = start_cache_cleanup()
