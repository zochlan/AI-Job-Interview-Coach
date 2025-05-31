import sys
import logging
import os

# Configure logging to print to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Print environment variables for debugging
print(f"GROQ_API_KEY: {os.environ.get('GROQ_API_KEY', 'Not set')[:5]}...{os.environ.get('GROQ_API_KEY', 'Not set')[-5:] if os.environ.get('GROQ_API_KEY') else ''}")
print(f"GROQ_DEFAULT_MODEL: {os.environ.get('GROQ_DEFAULT_MODEL', 'Not set')}")

print(f"__name__ is: {__name__}")
from app.backend import create_app

print("Creating app...")
try:
    app = create_app()
    print("App created!")
    # CORS is already configured in create_app()
except Exception as e:
    print("Exception during create_app:", e)
    sys.exit(1)

if __name__ == '__main__':
    print("Starting Flask server...")
    try:
        # Enable debug mode for more verbose output
        app.run(debug=True)
    except Exception as e:
        print("Exception during app.run:", e)
        sys.exit(1)
