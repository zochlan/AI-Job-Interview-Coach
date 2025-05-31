"""
Performance monitoring middleware for Flask routes.
Tracks request timing and logs slow requests.
"""

import time
import logging
import functools
import threading
from typing import Dict, List, Callable, Any
from flask import request, g, current_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Performance metrics storage
_metrics: Dict[str, List[float]] = {}  # {route: [times]}
_metrics_lock = threading.Lock()

# Threshold for slow requests (in seconds)
DEFAULT_SLOW_THRESHOLD = 1.0

def track_performance(slow_threshold: float = DEFAULT_SLOW_THRESHOLD):
    """
    Decorator to track the performance of a Flask route.
    
    Args:
        slow_threshold: Threshold in seconds for logging slow requests
        
    Returns:
        Callable: Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Record start time
            start_time = time.time()
            
            # Set a flag in g to indicate we're tracking performance
            g.tracking_performance = True
            
            # Execute the original function
            result = func(*args, **kwargs)
            
            # Calculate elapsed time
            elapsed_time = time.time() - start_time
            
            # Get the route name
            route = request.endpoint or request.path
            
            # Store the timing
            with _metrics_lock:
                if route not in _metrics:
                    _metrics[route] = []
                _metrics[route].append(elapsed_time)
                
                # Keep only the last 100 timings
                if len(_metrics[route]) > 100:
                    _metrics[route] = _metrics[route][-100:]
            
            # Log slow requests
            if elapsed_time > slow_threshold:
                logger.warning(f"Slow request: {request.method} {request.path} took {elapsed_time:.2f}s")
            
            return result
        
        return wrapper
    
    return decorator

def get_route_metrics(route: str = None) -> Dict[str, Any]:
    """
    Get performance metrics for a specific route or all routes.
    
    Args:
        route: The route to get metrics for, or None for all routes
        
    Returns:
        Dict: Performance metrics
    """
    with _metrics_lock:
        if route is not None:
            if route not in _metrics:
                return {'route': route, 'count': 0, 'avg_time': 0, 'min_time': 0, 'max_time': 0}
            
            times = _metrics[route]
            return {
                'route': route,
                'count': len(times),
                'avg_time': sum(times) / len(times) if times else 0,
                'min_time': min(times) if times else 0,
                'max_time': max(times) if times else 0
            }
        
        # Get metrics for all routes
        result = []
        for r, times in _metrics.items():
            result.append({
                'route': r,
                'count': len(times),
                'avg_time': sum(times) / len(times) if times else 0,
                'min_time': min(times) if times else 0,
                'max_time': max(times) if times else 0
            })
        
        return {'routes': result}

def reset_metrics() -> None:
    """Reset all performance metrics."""
    with _metrics_lock:
        _metrics.clear()

def setup_performance_monitoring(app):
    """
    Set up performance monitoring for a Flask app.
    
    Args:
        app: The Flask app
    """
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        # Skip if we're already tracking performance with the decorator
        if hasattr(g, 'tracking_performance') and g.tracking_performance:
            return response
        
        # Calculate elapsed time
        if hasattr(g, 'start_time'):
            elapsed_time = time.time() - g.start_time
            
            # Get the route name
            route = request.endpoint or request.path
            
            # Store the timing
            with _metrics_lock:
                if route not in _metrics:
                    _metrics[route] = []
                _metrics[route].append(elapsed_time)
                
                # Keep only the last 100 timings
                if len(_metrics[route]) > 100:
                    _metrics[route] = _metrics[route][-100:]
            
            # Log slow requests
            if elapsed_time > DEFAULT_SLOW_THRESHOLD:
                logger.warning(f"Slow request: {request.method} {request.path} took {elapsed_time:.2f}s")
            
            # Add timing header to response
            response.headers['X-Response-Time'] = f"{elapsed_time:.6f}s"
        
        return response
    
    # Add a route to get performance metrics
    @app.route('/api/metrics', methods=['GET'])
    def metrics():
        from flask import jsonify
        return jsonify(get_route_metrics())
