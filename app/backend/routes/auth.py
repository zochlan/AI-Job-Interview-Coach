import logging
import random
import time
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, g, session, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..db import get_db
from ..db.models import User
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

from flask_limiter.util import get_remote_address
from flask_limiter import Limiter

# Create a limiter for rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Apply rate limiting to specific auth endpoints
@bp.route('/check', methods=['GET'])
@limiter.limit("60/minute")  # Limit to 60 requests per minute
def check_auth():
    from flask import session, jsonify, current_app, request
    from ..db import get_db
    from ..db.models import User
    import time

    # Add cache headers to prevent excessive requests
    response_headers = {
        'Cache-Control': 'private, max-age=60',  # Cache for 60 seconds on client side
        'Expires': time.strftime('%a, %d %b %Y %H:%M:%S GMT', time.gmtime(time.time() + 60))
    }

    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 200, response_headers

    # Use a simple in-memory cache with session ID as key
    # This reduces database queries for frequent auth checks
    cache_key = f"auth_check_{user_id}"
    if hasattr(current_app, 'auth_cache') and cache_key in current_app.auth_cache:
        cached_data, expiry = current_app.auth_cache[cache_key]
        if time.time() < expiry:
            return jsonify(cached_data), 200, response_headers

    # If not in cache or expired, query the database
    try:
        db = get_db()
        user = db.query(User).get(user_id)

        if not user:
            return jsonify({'authenticated': False}), 200, response_headers

        # Prepare response data
        result = {
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }

        # Store in cache for 5 minutes
        if not hasattr(current_app, 'auth_cache'):
            current_app.auth_cache = {}
        current_app.auth_cache[cache_key] = (result, time.time() + 300)

        return jsonify(result), 200, response_headers
    except Exception as e:
        current_app.logger.error(f"Error in auth check: {str(e)}")
        return jsonify({'authenticated': False, 'error': 'Database error'}), 200, response_headers


def handle_error(error):
    """Handle errors and return appropriate response."""
    if isinstance(error, HTTPException):
        return jsonify({'error': error.description}), error.code

    logging.error(f"Unexpected error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

@bp.route('/register', methods=['POST'])
@limiter.limit("10/hour")  # Limit to 10 registration attempts per hour
def register():
    """Register a new user."""
    data = request.get_json()

    try:
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400

        db = get_db()

        # Check if username or email already exists
        existing_user = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            return jsonify({'error': 'Username or email already exists'}), 400

        # Create new user
        hashed_password = generate_password_hash(password)
        user = User(
            username=username,
            email=email,
            password_hash=hashed_password,
            created_at=datetime.utcnow()
        )

        db.add(user)
        db.commit()

        # Clear any existing session data
        session.clear()

        # Set user_id in session
        session['user_id'] = user.id

        # Create access and refresh tokens
        access_token = create_access_token(identity=user.id, fresh=True)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201

    except (KeyError, ValueError) as e:
        logging.error(f"Invalid input in register: {e}")
        return jsonify({'error': str(e)}), 400
    except SQLAlchemyError as e:
        logging.error(f"Database error in register: {e}")
        db.rollback()
        return jsonify({'error': 'Database error'}), 500
    except Exception as e:
        logging.error(f"Unexpected error in register: {e}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@bp.route('/login', methods=['POST'])
@limiter.limit("20/hour")  # Limit to 20 login attempts per hour
def login():
    """Login user and return tokens."""
    data = request.get_json()

    try:
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise ValueError('Missing username or password')

        db = get_db()
        user = db.query(User).filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid username or password'}), 401

        # Successful login
        # Clear any existing session data
        session.clear()

        # Set user_id in session
        session['user_id'] = user.id

        # Create access and refresh tokens
        access_token = create_access_token(identity=user.id, fresh=True)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200

    except (KeyError, ValueError) as e:
        logging.error(f"Invalid input in login: {e}")
        return jsonify({'error': str(e)}), 400
    except SQLAlchemyError as e:
        logging.error(f"Database error in login: {e}")
        db.rollback()
        return jsonify({'error': 'Database error'}), 500
    except Exception as e:
        logging.error(f"Unexpected error in login: {e}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    current_user_id = get_jwt_identity()

    try:
        db = get_db()
        user = db.query(User).get(current_user_id)

        if not user:
            raise HTTPException('User not found', 404)

        access_token = create_access_token(identity=user.id, fresh=False)

        return jsonify({
            'access_token': access_token
        }), 200

    except SQLAlchemyError as e:
        logging.error(f"Database error in refresh: {e}")
        db.rollback()
        return jsonify({'error': 'Database error'}), 500

@bp.route('/logout', methods=['POST'])
def logout():
    """Logout user by clearing session."""
    session.pop('user_id', None)  # Remove user_id from session if present
    return jsonify({'message': 'Successfully logged out'}), 200

@bp.errorhandler(Exception)
def handle_exception(error):
    return handle_error(error)
