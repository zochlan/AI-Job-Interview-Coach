from flask import g, current_app
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.pool import StaticPool
import click
import os
import logging
from .models import Base

def get_db():
    """Get the current database session."""
    if 'db' not in g:
        if 'sqlalchemy' not in current_app.extensions:
            raise RuntimeError("Database not initialized. Call init_db() first.")
        g.db = current_app.extensions['sqlalchemy']['session']()
    return g.db

def init_db(app):
    """Initialize database connection."""
    try:
        # Use DATABASE_URL from config
        db_url = app.config.get('DATABASE_URL') or app.config.get('SQLALCHEMY_DATABASE_URI')
        if app.config.get('TESTING'):
            engine = create_engine(
                'sqlite:///:memory:',
                connect_args={'check_same_thread': False},
                poolclass=StaticPool
            )
        else:
            engine = create_engine(
                db_url,
                connect_args={'check_same_thread': False},
                pool_pre_ping=True,
                pool_recycle=3600,
                pool_size=20,  # Increased from default 5
                max_overflow=30,  # Increased from default 10
                pool_timeout=60  # Increased from default 30
            )
        session_factory = sessionmaker(bind=engine)
        Session = scoped_session(session_factory)
        app.extensions['sqlalchemy'] = {
            'session': Session,
            'engine': engine
        }
        Base.metadata.create_all(engine)
        logging.info("Database initialized successfully")
    except Exception as e:
        logging.error(f"Error initializing database: {e}")
        raise

def close_db(e=None):
    """Close the database session."""
    db = g.pop('db', None)
    if db is not None:
        try:
            if e is None:  # Only commit if there was no exception
                db.commit()
            else:
                db.rollback()
        except Exception as commit_error:
            logging.error(f"Error during session cleanup: {commit_error}")
            db.rollback()
            raise
        finally:
            db.close()

def get_db_session():
    """Get the database session factory."""
    if 'sqlalchemy' not in current_app.extensions:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return current_app.extensions['sqlalchemy']['session']

@click.command('init-db')
def init_db_command():
    """Clear existing data and create new tables."""
    init_db(current_app)
    click.echo('Initialized the database.')

def init_app(app):
    """Register database functions with the Flask app."""
    app.cli.add_command(init_db_command)

    # Initialize database on app startup
    with app.app_context():
        init_db(app)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Add cleanup
    @app.teardown_appcontext
    def cleanup(exc):
        """Clean up database session."""
        close_db(exc)