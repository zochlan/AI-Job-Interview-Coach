"""
Health check endpoints for monitoring the application's status.
"""

import os
import time
import logging
import platform
import psutil
import json
from flask import Blueprint, jsonify, current_app
from app.backend.utils.ollama_client import ollama_client
from app.backend.middleware import track_performance

bp = Blueprint('health', __name__, url_prefix='/api/health')

@bp.route('/', methods=['GET'])
@track_performance()
def health_check():
    """
    Basic health check endpoint.
    Returns status of the application and its dependencies.
    """
    # Check if Ollama is running
    ollama_status = ollama_client.is_running()
    
    # Get available models
    available_models = []
    if ollama_status:
        available_models = ollama_client.get_available_models()
    
    # Get system info
    system_info = {
        'platform': platform.platform(),
        'python_version': platform.python_version(),
        'cpu_count': psutil.cpu_count(),
        'memory_total': psutil.virtual_memory().total,
        'memory_available': psutil.virtual_memory().available,
        'disk_usage': psutil.disk_usage('/').percent
    }
    
    # Get application info
    app_info = {
        'uptime': time.time() - current_app.start_time if hasattr(current_app, 'start_time') else None,
        'environment': os.environ.get('FLASK_ENV', 'development'),
        'debug': current_app.debug
    }
    
    return jsonify({
        'status': 'ok',
        'timestamp': time.time(),
        'ollama': {
            'running': ollama_status,
            'available_models': available_models
        },
        'system': system_info,
        'application': app_info
    })

@bp.route('/detailed', methods=['GET'])
@track_performance()
def detailed_health_check():
    """
    Detailed health check endpoint.
    Returns comprehensive status of the application and its dependencies.
    """
    # Basic health check
    basic_health = health_check().get_json()
    
    # Check database connection
    db_status = 'ok'
    db_error = None
    try:
        from app.backend.db import get_db
        db = get_db()
        # Execute a simple query
        db.execute('SELECT 1').fetchone()
    except Exception as e:
        db_status = 'error'
        db_error = str(e)
    
    # Check file system access
    fs_status = 'ok'
    fs_error = None
    try:
        # Try to write a temporary file
        temp_file = os.path.join(current_app.instance_path, 'health_check.tmp')
        with open(temp_file, 'w') as f:
            f.write('health check')
        os.remove(temp_file)
    except Exception as e:
        fs_status = 'error'
        fs_error = str(e)
    
    # Check Ollama model generation
    ollama_status = 'ok'
    ollama_error = None
    if basic_health['ollama']['running']:
        try:
            # Try a simple generation
            response, success = ollama_client.generate(
                prompt="Hello, this is a health check.",
                model="llama3",
                max_tokens=10
            )
            if not success:
                ollama_status = 'error'
                ollama_error = response
        except Exception as e:
            ollama_status = 'error'
            ollama_error = str(e)
    else:
        ollama_status = 'not_running'
    
    # Get performance metrics
    from app.backend.middleware.performance import get_route_metrics
    performance_metrics = get_route_metrics()
    
    # Get memory usage
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    return jsonify({
        **basic_health,
        'components': {
            'database': {
                'status': db_status,
                'error': db_error
            },
            'filesystem': {
                'status': fs_status,
                'error': fs_error
            },
            'ollama_generation': {
                'status': ollama_status,
                'error': ollama_error
            }
        },
        'performance': performance_metrics,
        'process': {
            'memory_rss': memory_info.rss,
            'memory_vms': memory_info.vms,
            'cpu_percent': process.cpu_percent(interval=0.1),
            'threads': process.num_threads(),
            'open_files': len(process.open_files())
        }
    })

@bp.route('/metrics', methods=['GET'])
@track_performance()
def metrics():
    """
    Performance metrics endpoint.
    Returns performance metrics for all routes.
    """
    from app.backend.middleware.performance import get_route_metrics
    return jsonify(get_route_metrics())
