import os
import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy.exc import SQLAlchemyError
from . import create_app

# Import the create_app function from __init__.py
app = create_app()

# Application-wide error handlers
@app.errorhandler(Exception)
def handle_exception(e):
    logging.error(f"Application error: {str(e)}")
    return jsonify({
        'error': 'Internal server error',
        'message': str(e)
    }), 500

@app.errorhandler(404)
def handle_not_found(e):
    logging.warning(f"404 error: {str(e)}")
    return jsonify({
        'error': 'Not found',
        'message': str(e)
    }), 404

@app.errorhandler(401)
def handle_unauthorized(e):
    logging.warning(f"401 error: {str(e)}")
    return jsonify({
        'error': 'Unauthorized',
        'message': str(e)
    }), 401

@app.errorhandler(403)
def handle_forbidden(e):
    logging.warning(f"403 error: {str(e)}")
    return jsonify({
        'error': 'Forbidden',
        'message': str(e)
    }), 403

@app.errorhandler(500)
def handle_internal_error(e):
    logging.error(f"500 error: {str(e)}")
    return jsonify({
        'error': 'Internal server error',
        'message': str(e)
    }), 500

@app.errorhandler(SQLAlchemyError)
def handle_db_error(e):
    logging.error(f"Database error: {str(e)}")
    # db.session.rollback() - Commented out as db is not defined
    return jsonify({
        'error': 'Database error',
        'message': str(e)
    }), 500

@app.errorhandler(ValueError)
def handle_value_error(e):
    logging.warning(f"Value error: {str(e)}")
    return jsonify({
        'error': 'Invalid input',
        'message': str(e)
    }), 400

@app.errorhandler(TypeError)
def handle_type_error(e):
    logging.warning(f"Type error: {str(e)}")
    return jsonify({
        'error': 'Invalid data type',
        'message': str(e)
    }), 400

@app.errorhandler(KeyError)
def handle_key_error(e):
    logging.warning(f"Key error: {str(e)}")
    return jsonify({
        'error': 'Missing required field',
        'message': str(e)
    }), 400

if __name__ == '__main__':
    app.run(debug=True)