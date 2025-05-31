# AI Job Interview Coach

An AI-powered interview preparation tool that helps users practice and improve their interview skills through real-time feedback and analysis.

## Features

- **Real-time Response Analysis**: Get instant feedback on your responses using advanced NLP techniques.
- **STAR Framework Support**: Practice answering behavioral questions using the STAR method.
- **Technical Interview Preparation**: Prepare for technical questions with specific domain knowledge.
- **Progress Tracking**: Monitor your improvement over time with detailed analytics.
- **Session Management**: Create and manage multiple interview practice sessions.
- **Professional Feedback**: Receive feedback on tone, clarity, and completeness of your responses.

## Tech Stack

- **Backend**: Python 3.8+, Flask, SQLAlchemy
- **Frontend**: React, TypeScript, Material-UI
- **NLP**: PyTorch, Transformers, spaCy, TextBlob
- **Database**: SQLite
- **Authentication**: JWT
- **AI Integration**: Poe API (Gemini 2.0 Flash), Ollama (llama3)
- **Monitoring**: Prometheus

## Project Structure

```
AI-Job-Interview-Coach/
├── app/                    # Main Flask application
│   └── backend/            # Backend code
│       ├── config/         # Configuration files
│       ├── data/           # Data files and datasets
│       ├── db/             # Database models and migrations
│       ├── middleware/     # Middleware components
│       ├── nlp/            # NLP components and analysis
│       ├── routes/         # API routes and endpoints
│       ├── uploads/        # User uploaded files
│       └── utils/          # Utility functions
├── data/                   # Additional data files
├── docs/                   # Documentation
├── frontend/               # React frontend
│   ├── public/             # Static files
│   └── src/                # Source code
│       ├── components/     # React components
│       ├── contexts/       # Context providers
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Page components
│       ├── types/          # TypeScript type definitions
│       └── utils/          # Utility functions
├── models/                 # ML model files
├── tests/                  # Test files
├── .env                    # Environment variables
├── flask_app.py            # Flask application entry point
├── groq_client.py          # Groq API client
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
```

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- [Ollama](https://ollama.ai/download) with the llama3 model
- Redis (optional, for production)

### AI Integration Setup

#### Option 1: Groq API (Recommended)

1. Set up your Groq API key in the `.env` file:
```
GROQ_API_KEY=your_groq_api_key
GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_DEFAULT_MODEL=llama3-8b-8192
```

2. The application will automatically use the Groq API for generating interview questions and analyzing responses.

#### Option 2: Ollama (Local LLM)

1. Download and install Ollama from [https://ollama.ai/download](https://ollama.ai/download)

2. Pull the llama3 model:
```bash
ollama pull llama3
```

3. Start Ollama with the llama3 model:
```bash
ollama run llama3
```

4. The application will fall back to Ollama if the Poe API is not available.

### Backend Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd AI-Job-Interview-Coach
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```bash
cp .env.example .env
```

5. Run the backend:
```bash
python flask_app.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## API Documentation

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login user
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Logout user
- `GET /api/auth/check`: Check authentication status

### Interview Sessions

- `POST /api/sessions`: Create a new session
- `GET /api/sessions/<id>`: Get session details
- `GET /sessions`: Get all sessions for the current user
- `POST /sessions`: Create a new session
- `GET /sessions/<id>`: Get session details
- `POST /sessions/<id>/responses`: Submit a response
- `POST /sessions/<id>/end`: End a session
- `DELETE /sessions/<id>`: Delete a session

### Response Analysis

- `POST /api/analyze`: Analyze a response
- `POST /api/feedback`: Create feedback for a response

### CV Management

- `POST /upload-cv`: Upload a CV for analysis
- `POST /save-profile`: Save user profile data
- `POST /clear-profile`: Clear user profile data

### Groq API Integration

- `POST /groq/question`: Generate an interview question
- `POST /groq/analyze`: Analyze a response
- `GET /groq/models`: Get available Groq models
- `POST /groq/chat`: Send a chat message

## Configuration

Configuration is managed through environment variables. The main configuration file is located at `app/backend/config.py`.

### Environment Variables

- `SECRET_KEY`: Flask secret key
- `DATABASE_URL`: Database connection URL
- `JWT_SECRET_KEY`: JWT secret key
- `RATE_LIMIT_STORAGE_URL`: Redis URL for rate limiting
- `ALLOWED_ORIGINS`: CORS allowed origins
- `SPACY_MODEL`: SpaCy model to use
- `REDIS_URL`: Redis connection URL
- `MAIL_SERVER`: Email server for notifications

## Security

- JWT-based authentication
- Rate limiting
- CSRF protection
- Secure headers
- Input validation
- Password hashing

## Troubleshooting

### Groq API Connection Issues

If you see errors related to the Groq API, follow these steps:

1. Check if your Groq API key is correctly set in the `.env` file:
```
GROQ_API_KEY=your_groq_api_key
GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_DEFAULT_MODEL=llama3-8b-8192
```

2. Verify that your Groq API key is valid and has sufficient credits.

3. Check the Groq API status at [https://status.groq.com/](https://status.groq.com/).

### Ollama Connection Issues

If you're using Ollama as a fallback and see connection errors, follow these steps:

1. Check if Ollama is installed:
```bash
ollama --version
```

2. Check if Ollama is running:
```bash
ollama list
```

3. Make sure the llama3 model is available:
```bash
ollama pull llama3
```

4. Start Ollama with the llama3 model:
```bash
ollama run llama3
```

### Other Common Issues

- **"Module not found" errors**: Make sure you've installed all dependencies with `pip install -r requirements.txt`
- **Database errors**: Check that your database file exists in the `instance` directory
- **Frontend connection errors**: Ensure the backend server is running and CORS is properly configured
- **CV upload issues**: Make sure the `uploads` directory exists and has write permissions

## Monitoring

- Prometheus metrics
- Structured logging
- Error tracking
- Performance monitoring

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.