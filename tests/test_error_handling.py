import pytest
from app.backend import create_app

@pytest.fixture
def app():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test-secret-key'
    })
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_404_error(client):
    """Test 404 error handling."""
    response = client.get('/api/nonexistent')
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'message' in response.json

def test_500_error(client):
    """Test 500 error handling."""
    response = client.get('/api/test/error')
    assert response.status_code == 500
    assert 'error' in response.json
    assert 'message' in response.json

def test_db_error(client):
    """Test database error handling."""
    response = client.get('/api/test/db-error')
    assert response.status_code == 500
    assert 'error' in response.json
    assert 'message' in response.json

def test_value_error(client):
    """Test value error handling."""
    response = client.get('/api/test/value-error')
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'message' in response.json

def test_type_error(client):
    """Test type error handling."""
    response = client.get('/api/test/type-error')
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'message' in response.json

def test_key_error(client):
    """Test key error handling."""
    response = client.get('/api/test/key-error')
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'message' in response.json
