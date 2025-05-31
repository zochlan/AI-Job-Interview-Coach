"""
Middleware components for the AI Job Interview Coach backend.
Provides caching, performance monitoring, error handling, and other middleware functionality.
"""

from .cache import cache_route, clear_cache
from .performance import track_performance, get_route_metrics, reset_metrics, setup_performance_monitoring
from .error_handler import setup_error_handlers, handle_error
