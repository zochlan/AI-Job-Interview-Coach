import os
import time
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_redis import FlaskRedis
from prometheus_flask_exporter import PrometheusMetrics
from logging.config import dictConfig
from app.backend.config.logging_config import LOGGING_CONFIG
from .db import init_db
from .nlp import init_nlp

def create_app(test_config=None):
    """Create and configure the Flask application."""
    print("create_app: start")
    # Set up logging
    dictConfig(LOGGING_CONFIG)
    print("create_app: logging configured")

    # Create app
    app = Flask(__name__, instance_relative_config=True)
    print("create_app: Flask app created")

    # --- CORS CONFIGURATION ---
    from flask_cors import CORS
    CORS(app, origins=os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(','), supports_credentials=True)
    print("create_app: CORS configured")
    # --- END CORS CONFIGURATION ---

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
        print("create_app: instance_path created")
    except OSError:
        print("create_app: instance_path exists")
        pass

    # Load configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        DATABASE_URL=os.environ.get('DATABASE_URL', 'sqlite:///instance/interview_coach.sqlite'),
        TRANSFORMERS_CACHE=os.path.join(app.instance_path, 'models'),
        SPACY_MODEL=os.environ.get('SPACY_MODEL', 'en_core_web_sm'),
        MAX_SUMMARY_LENGTH=int(os.environ.get('MAX_SUMMARY_LENGTH', 1024)),
        MIN_PROFESSIONAL_TONE=float(os.environ.get('MIN_PROFESSIONAL_TONE', 0.6)),
        MIN_CONFIDENCE_TONE=float(os.environ.get('MIN_CONFIDENCE_TONE', 0.5)),
        MAX_SENTENCE_LENGTH=int(os.environ.get('MAX_SENTENCE_LENGTH', 25)),
        MAX_READABILITY_SCORE=int(os.environ.get('MAX_READABILITY_SCORE', 30)),
        MIN_ENTITY_DENSITY=float(os.environ.get('MIN_ENTITY_DENSITY', 0.1)),
        SESSION_TYPE='filesystem',
        SESSION_PERMANENT=True,
        PERMANENT_SESSION_LIFETIME=7200,  # 2 hours (increased from 1 hour)
        RATE_LIMIT_STORAGE_URL=os.environ.get('REDIS_URL', None),
        ALLOWED_ORIGINS=os.environ.get('ALLOWED_ORIGINS', '*'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///instance/interview_coach.sqlite')
    )
    print("create_app: config loaded")

    # Override config with test config if provided
    if test_config is not None:
        app.config.update(test_config)
        print("create_app: test config loaded")

    # Initialize extensions
    db = SQLAlchemy(app)
    print("create_app: SQLAlchemy initialized")
    migrate = Migrate(app, db)
    print("create_app: Migrate initialized")
    jwt = JWTManager(app)
    print("create_app: JWTManager initialized")
    redis_client = FlaskRedis(app)
    print("create_app: Redis initialized")

    # Security
    Talisman(app, force_https=False)  # Set to True in production
    print("create_app: Talisman initialized")

    # Rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )
    print("create_app: Limiter initialized")

    # Prometheus monitoring
    metrics = PrometheusMetrics(app)
    print("create_app: Prometheus metrics initialized")

    # Initialize database and NLP
    print("create_app: initializing DB")
    init_db(app)
    print("create_app: DB initialized")
    print("create_app: initializing NLP")
    init_nlp(app)
    print("create_app: NLP initialized")

    # Register blueprints
    print("create_app: importing blueprints")
    from .routes import register_blueprints
    print("create_app: registering blueprints")
    register_blueprints(app)
    print("create_app: blueprints registered")

    # Store app start time for uptime tracking
    app.start_time = time.time()

    # Debug: Print all registered routes
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule}")

    # Debug: Log every incoming request path and method
    @app.before_request
    def log_request_info():
        print(f"[REQUEST] {request.method} {request.path}")

    # Initialize auth cache for storing authentication results
    app.auth_cache = {}

    # Set up performance monitoring
    from app.backend.middleware.performance import setup_performance_monitoring
    setup_performance_monitoring(app)

    # Set up error handling
    from app.backend.middleware.error_handler import setup_error_handlers
    setup_error_handlers(app)

    # Initialize response cache
    app.response_cache = {}

    # Apply rate limiting to auth endpoints
    # We'll handle this in the auth blueprint with decorators instead of exempting

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        logging.warning(f"404 error: {str(error)}")
        return jsonify({
            'error': 'Not found',
            'message': str(error)
        }), 404

    @app.errorhandler(400)
    def bad_request_error(error):
        logging.warning(f"400 error: {str(error)}")
        return jsonify({
            'error': 'Bad request',
            'message': str(error)
        }), 400

    @app.errorhandler(500)
    def internal_error(error):
        logging.error(f"500 error: {str(error)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(error)
        }), 500

    print(f"Registered blueprints: {list(app.blueprints.keys())}")
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule}")
    print("create_app: returning app")
    return app