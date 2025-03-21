import os
import subprocess
import sys

def install_dependencies():
    """Install required Python packages"""
    print("Installing required packages...")
    requirements = [
        'flask==2.3.3',
        'flask-cors==4.0.0',
        'spacy==3.7.2',
        'transformers==4.35.2',
        'torch==2.1.1',
        'numpy==1.24.3',
        'pandas==2.1.1',
        'scikit-learn==1.3.1',
        'textblob==0.17.1',
        'python-dotenv==1.0.0',
        'click==8.1.7'
    ]
    
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install'] + requirements, check=True)
        print("Installing spaCy language model...")
        subprocess.run([sys.executable, '-m', 'spacy', 'download', 'en_core_web_sm'], check=True)
        print("Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)

def setup_environment():
    """Set up the development environment"""
    print("Setting up the development environment...")
    
    # Install dependencies first
    install_dependencies()
    
    # Set environment variables
    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_ENV'] = 'development'
    
    try:
        # Initialize the database
        subprocess.run([sys.executable, '-m', 'flask', 'init-db'], check=True)
        print("Database initialized successfully!")
        
    except subprocess.CalledProcessError as e:
        print(f"Error initializing database: {e}")
        sys.exit(1)

if __name__ == '__main__':
    setup_environment() 