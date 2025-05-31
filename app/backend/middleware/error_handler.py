"""
Error handling middleware for Flask applications.
Provides consistent error responses and logging.
"""

import logging
import traceback
import json
from flask import jsonify, request, current_app
from werkzeug.exceptions import HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle_error(error):
    """
    Handle errors and return appropriate JSON responses.
    
    Args:
        error: The error to handle
        
    Returns:
        tuple: (response, status_code)
    """
    status_code = 500
    error_type = type(error).__name__
    error_message = str(error)
    
    # Get traceback for internal logging
    tb = traceback.format_exc()
    
    # Handle HTTP exceptions
    if isinstance(error, HTTPException):
        status_code = error.code
        error_message = error.description
    
    # Log the error
    if status_code >= 500:
        logger.error(f"Error {error_type} ({status_code}): {error_message}\n{tb}")
    else:
        logger.warning(f"Error {error_type} ({status_code}): {error_message}")
    
    # Prepare response
    response = {
        'error': error_type,
        'message': error_message,
        'status_code': status_code
    }
    
    # Add request details in debug mode
    if current_app.debug:
        response['request'] = {
            'url': request.url,
            'method': request.method,
            'headers': dict(request.headers),
            'args': dict(request.args),
            'form': dict(request.form),
            'json': request.get_json(silent=True)
        }
        response['traceback'] = tb.split('\n')
    
    return jsonify(response), status_code

def setup_error_handlers(app):
    """
    Set up error handlers for a Flask app.
    
    Args:
        app: The Flask app
    """
    # Handle all HTTP exceptions
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return handle_error(error)
    
    # Handle all other exceptions
    @app.errorhandler(Exception)
    def handle_exception(error):
        return handle_error(error)
    
    # Handle JSON parsing errors
    @app.errorhandler(400)
    def handle_bad_request(error):
        if request.is_json and not request.get_json(silent=True):
            return jsonify({
                'error': 'InvalidJSON',
                'message': 'Invalid JSON in request body',
                'status_code': 400
            }), 400
        return handle_error(error)
    
    # Handle 404 errors
    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            'error': 'NotFound',
            'message': f"The requested URL {request.path} was not found on this server",
            'status_code': 404
        }), 404
    
    # Handle 405 errors
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        return jsonify({
            'error': 'MethodNotAllowed',
            'message': f"The method {request.method} is not allowed for the URL {request.path}",
            'status_code': 405,
            'allowed_methods': error.valid_methods
        }), 405
    
    # Handle 429 errors (rate limiting)
    @app.errorhandler(429)
    def handle_rate_limit_exceeded(error):
        return jsonify({
            'error': 'RateLimitExceeded',
            'message': "Too many requests. Please try again later.",
            'status_code': 429
        }), 429
