import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///instance/interview_coach.sqlite')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    RATE_LIMIT_STORAGE_URL = os.getenv('RATE_LIMIT_STORAGE_URL', None)
    RATE_LIMIT_DEFAULT = "200 per day;50 per hour"
    SESSION_TYPE = 'redis'
    SESSION_PERMANENT = True
    PROMETHEUS_METRICS_PATH = '/metrics'
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE_SIZE = int(os.getenv('LOG_FILE_SIZE', 10485760))
    LOG_FILE_BACKUP_COUNT = int(os.getenv('LOG_FILE_BACKUP_COUNT', 5))
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*')
    SPACY_MODEL = os.getenv('SPACY_MODEL', 'en_core_web_sm')
    MAX_SUMMARY_LENGTH = int(os.getenv('MAX_SUMMARY_LENGTH', 1024))
    MIN_PROFESSIONAL_TONE = float(os.getenv('MIN_PROFESSIONAL_TONE', 0.6))
    MIN_CONFIDENCE_TONE = float(os.getenv('MIN_CONFIDENCE_TONE', 0.5))
    MAX_SENTENCE_LENGTH = int(os.getenv('MAX_SENTENCE_LENGTH', 25))
    MAX_READABILITY_SCORE = int(os.getenv('MAX_READABILITY_SCORE', 30))
    MIN_ENTITY_DENSITY = float(os.getenv('MIN_ENTITY_DENSITY', 0.1))
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    RATE_LIMIT_DEFAULT = "1000 per day;100 per hour"

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    FORCE_HTTPS = True
    STRICT_TRANSPORT_SECURITY = True
    X_FRAME_OPTIONS = 'DENY'
    CONTENT_SECURITY_POLICY = {
        'default-src': "'self'",
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"]
    }

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig
}
