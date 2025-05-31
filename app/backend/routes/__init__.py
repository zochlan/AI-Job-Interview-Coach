# Routes package initialization
from flask import Blueprint

# Import all route modules
from . import auth, cv, health, main

# Create a list of all blueprints to register
blueprints = [
    auth.bp,
    cv.bp,
    health.bp,
    main.bp
]

def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    # Register auth blueprint without prefix
    app.register_blueprint(auth.bp)

    # Register main blueprint without prefix since routes already include /api
    app.register_blueprint(main.bp, url_prefix='')

    # Register cv blueprint without prefix
    # Note: cv.py routes don't include /api in their paths
    app.register_blueprint(cv.bp, url_prefix='')

    # Register health blueprint without prefix
    app.register_blueprint(health.bp)