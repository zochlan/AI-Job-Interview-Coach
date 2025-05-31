# Groq API Integration for AI Interview Coach

This guide explains how to integrate the Groq API with your AI Interview Coach application to improve response quality and speed.

## Overview

Groq provides access to various AI models through a unified API. This integration allows your application to:

1. Generate high-quality interview questions
2. Analyze candidate responses
3. Provide coaching feedback

## Prerequisites

- Groq API key (sign up at [groq.com](https://console.groq.com/))
- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation Steps

### 1. Backend Setup

1. Install backend dependencies:
   ```bash
   pip install openai
   ```

2. Create or update the `.env` file in the root directory:
   ```bash
   # Groq API Configuration
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_API_BASE=https://api.groq.com/openai/v1
   GROQ_DEFAULT_MODEL=llama3-8b-8192
   ```

3. Ensure the `groq_client.py` file is in the project root directory.

### 2. Frontend Setup

The frontend code has been updated to use the new backend API endpoints. No additional setup is required.

## Running the Application

1. Start the backend server:
   ```bash
   python flask_app.py
   ```

2. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Access the application at http://localhost:3000

## API Endpoints

The backend provides the following endpoints:

- `POST /api/groq/question` - Generate an interview question
- `POST /api/groq/analyze` - Analyze a candidate's response
- `POST /api/groq/chat` - General chat endpoint for interview coaching
- `GET /api/groq/models` - Get available Groq models

## Troubleshooting

If you encounter issues with the Groq API:

1. Check that your API key is correct in the `.env` file
2. Verify that you have sufficient credits/quota on your Groq account
3. Check the backend logs for error messages
4. The application will automatically fall back to the local question bank if the API fails

## Model Selection

You can change the default model by updating the `GROQ_DEFAULT_MODEL` in your `.env` file. Available options include:

- `llama3-8b-8192` - Good balance of quality and speed
- `llama3-70b-8192` - Higher quality but slower
- `mixtral-8x7b-32768` - Good for complex reasoning
- `gemma-7b-it` - Google's model, good for general tasks
- `claude-3-opus-20240229` - Anthropic's highest quality model
- `claude-3-sonnet-20240229` - Good balance of quality and speed
- `claude-3-haiku-20240307` - Fastest Claude model

## Advantages of Groq

Groq offers several key advantages for your AI Interview Coach application:

1. **Speed**: Groq is known for its extremely fast inference times, providing near-instant responses
2. **Quality**: Access to high-quality models like Llama 3 and Claude 3
3. **Free Tier**: Generous free tier for development and testing
4. **Simple API**: OpenAI-compatible API makes integration straightforward
5. **Reliability**: High uptime and consistent performance

## Customization

You can customize the prompts used for generating questions and analyzing responses by modifying the functions in `groq_client.py`.

## Security Considerations

- Keep your Groq API key secure and never commit it to version control
- Use environment variables for sensitive information
- Consider implementing rate limiting to prevent abuse

## Next Steps

After implementing this integration, consider:

1. Fine-tuning the prompts for better question generation
2. Implementing caching to reduce API calls
3. Adding more detailed analysis of candidate responses
4. Implementing a feedback loop to improve the system over time

## Credits

This integration was developed by the AI Job Interview Coach team.
