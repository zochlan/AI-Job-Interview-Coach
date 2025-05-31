import os
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
import logging.config

# Create logs directory if it doesn't exist
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(log_dir, exist_ok=True)

# Get the current date for log file naming
current_date = datetime.now().strftime('%Y-%m-%d')

# Simplified logging configuration for testing
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(name)s - %(filename)s:%(lineno)d: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'json': {
            '()': jsonlogger.JsonFormatter,
            'fmt': '%(asctime)s %(levelname)s %(name)s %(message)s'
        },
        'verbose': {
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'DEBUG',
            'formatter': 'detailed',
            'filename': os.path.join(log_dir, f'application_{current_date}.log'),
            'maxBytes': 1024 * 1024 * 5,  # 5MB per file
            'backupCount': 5
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'ERROR',
            'formatter': 'detailed',
            'filename': os.path.join(log_dir, f'error_{current_date}.log'),
            'maxBytes': 1024 * 1024 * 5,  # 5MB per file
            'backupCount': 5
        }
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': True
        },
        'werkzeug': {  # Flask's default logger
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False
        },
        'sqlalchemy.engine': {  # SQLAlchemy logger
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False
        },
        'app': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False
        }
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO'
    }
}

def setup_logging(app):
    """Configure logging for the application."""
    logging.config.dictConfig(LOGGING_CONFIG)
