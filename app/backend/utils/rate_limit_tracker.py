"""
Rate limit tracker utility for Flask backend.

This module provides functions to track and manage rate limits for different API endpoints.
It maintains an in-memory cache of rate-limited clients to avoid unnecessary API calls.
"""

import time
import logging
import threading
from typing import Dict, Set, Tuple

# Configure logging
logger = logging.getLogger(__name__)

# Rate limit tracking
# Structure: {endpoint: {client_ip: expiration_timestamp}}
_rate_limited_clients: Dict[str, Dict[str, float]] = {}
_rate_limit_lock = threading.Lock()

# Default rate limit duration in seconds (1 hour)
DEFAULT_RATE_LIMIT_DURATION = 3600

def is_rate_limited(client_ip: str, endpoint: str) -> bool:
    """
    Check if a client is currently rate limited for a specific endpoint.
    
    Args:
        client_ip: The client's IP address
        endpoint: The endpoint to check
        
    Returns:
        bool: True if the client is rate limited, False otherwise
    """
    with _rate_limit_lock:
        # Clean up expired entries first
        _cleanup_expired_rate_limits()
        
        # Check if client is rate limited
        if endpoint in _rate_limited_clients and client_ip in _rate_limited_clients[endpoint]:
            expiration = _rate_limited_clients[endpoint][client_ip]
            if time.time() < expiration:
                logger.info(f"Client {client_ip} is rate limited for {endpoint} until {time.ctime(expiration)}")
                return True
            else:
                # Rate limit has expired, remove it
                del _rate_limited_clients[endpoint][client_ip]
                logger.info(f"Rate limit for client {client_ip} on {endpoint} has expired")
                return False
        
        return False

def mark_rate_limited(client_ip: str, endpoint: str, duration: float = DEFAULT_RATE_LIMIT_DURATION) -> None:
    """
    Mark a client as rate limited for a specific endpoint.
    
    Args:
        client_ip: The client's IP address
        endpoint: The endpoint to rate limit
        duration: Duration of the rate limit in seconds (default: 1 hour)
    """
    with _rate_limit_lock:
        # Initialize endpoint dict if it doesn't exist
        if endpoint not in _rate_limited_clients:
            _rate_limited_clients[endpoint] = {}
        
        # Set expiration timestamp
        expiration = time.time() + duration
        _rate_limited_clients[endpoint][client_ip] = expiration
        
        logger.warning(f"Client {client_ip} rate limited for {endpoint} until {time.ctime(expiration)}")

def _cleanup_expired_rate_limits() -> None:
    """
    Clean up expired rate limits from the cache.
    This is called automatically when checking rate limits.
    """
    current_time = time.time()
    endpoints_to_remove = []
    
    for endpoint, clients in _rate_limited_clients.items():
        clients_to_remove = []
        
        for client_ip, expiration in clients.items():
            if current_time >= expiration:
                clients_to_remove.append(client_ip)
        
        # Remove expired clients
        for client_ip in clients_to_remove:
            del clients[client_ip]
        
        # If no clients left for this endpoint, mark for removal
        if not clients:
            endpoints_to_remove.append(endpoint)
    
    # Remove empty endpoints
    for endpoint in endpoints_to_remove:
        del _rate_limited_clients[endpoint]

def get_rate_limited_clients() -> Dict[str, Dict[str, float]]:
    """
    Get all currently rate limited clients.
    Useful for debugging and monitoring.
    
    Returns:
        Dict: A dictionary of rate limited clients by endpoint
    """
    with _rate_limit_lock:
        # Clean up expired entries first
        _cleanup_expired_rate_limits()
        
        # Return a copy to avoid thread safety issues
        return {endpoint: clients.copy() for endpoint, clients in _rate_limited_clients.items()}

def clear_rate_limits(endpoint: str = None, client_ip: str = None) -> None:
    """
    Clear rate limits for a specific endpoint, client, or both.
    If no parameters are provided, clears all rate limits.
    
    Args:
        endpoint: The endpoint to clear (optional)
        client_ip: The client IP to clear (optional)
    """
    with _rate_limit_lock:
        if endpoint is None and client_ip is None:
            # Clear all rate limits
            _rate_limited_clients.clear()
            logger.info("Cleared all rate limits")
        elif endpoint is not None and client_ip is None:
            # Clear all rate limits for a specific endpoint
            if endpoint in _rate_limited_clients:
                del _rate_limited_clients[endpoint]
                logger.info(f"Cleared all rate limits for endpoint {endpoint}")
        elif endpoint is None and client_ip is not None:
            # Clear all rate limits for a specific client
            endpoints_to_remove = []
            
            for ep, clients in _rate_limited_clients.items():
                if client_ip in clients:
                    del clients[client_ip]
                    logger.info(f"Cleared rate limit for client {client_ip} on endpoint {ep}")
                
                # If no clients left for this endpoint, mark for removal
                if not clients:
                    endpoints_to_remove.append(ep)
            
            # Remove empty endpoints
            for ep in endpoints_to_remove:
                del _rate_limited_clients[ep]
        else:
            # Clear a specific client's rate limit for a specific endpoint
            if endpoint in _rate_limited_clients and client_ip in _rate_limited_clients[endpoint]:
                del _rate_limited_clients[endpoint][client_ip]
                logger.info(f"Cleared rate limit for client {client_ip} on endpoint {endpoint}")
                
                # If no clients left for this endpoint, remove it
                if not _rate_limited_clients[endpoint]:
                    del _rate_limited_clients[endpoint]
