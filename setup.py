from setuptools import setup, find_packages

setup(
    name='ai_interview_coach',
    version='0.1.0',
    packages=find_packages(),
    python_requires='>=3.8',
    include_package_data=True,
    description='AI-powered interview coach with advanced NLP analysis',
    author='Your Name',
    author_email='your.email@example.com',
    url='https://github.com/yourusername/ai-interview-coach',
    classifiers=[
        'Programming Language :: Python :: 3.8',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    install_requires=[
        'flask',
        'flask-sqlalchemy',
        'flask-jwt-extended',
        'flask-limiter',
        'flask-talisman',
        'spacy',
        'transformers',
        'torch',
        'pytest',
        'pytest-cov',
        'prometheus-client',
        'python-dotenv',
        'redis',
        'textblob',
        'nltk'
    ]
)
