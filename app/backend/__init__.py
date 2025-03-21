from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    CORS(app)

    # Default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        DATABASE=os.path.join(app.instance_path, 'interview_coach.sqlite'),
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.update(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize Database
    from . import db
    db.init_app(app)

    # Register blueprints
    from .routes import main
    app.register_blueprint(main.bp)

    # Initialize NLP
    from .nlp import initialize_nlp
    initialize_nlp()

    return app 