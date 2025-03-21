import subprocess
import sys

def install_dependencies():
    """Install all required packages for the project"""
    print("Installing required packages...")
    
    packages = [
        'pytest',
        'jupyter',
        'notebook',
        'pandas',
        'numpy',
        'matplotlib',
        'seaborn',
        'spacy',
        'transformers',
        'torch',
        'textblob',
        'scikit-learn',
        'flask',
        'flask-cors',
        'python-dotenv'
    ]
    
    for package in packages:
        print(f"Installing {package}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        except subprocess.CalledProcessError as e:
            print(f"Error installing {package}: {e}")
            continue
    
    # Install spaCy model
    print("\nInstalling spaCy language model...")
    try:
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    except subprocess.CalledProcessError as e:
        print(f"Error installing spaCy model: {e}")

if __name__ == "__main__":
    print("Starting dependency installation...")
    install_dependencies()
    print("\nDependency installation completed!") 