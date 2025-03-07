# FinOps News Generator

A web application that generates blog posts and podcasts about FinOps (Financial Operations) topics using AI.

## Features

- Generate blog posts about FinOps topics
- Customize content length (short, medium, long)
- Support for multiple languages
- Convert blog posts to podcasts with text-to-speech
- "Humanize" content to reduce AI detection flags
- Save and load from history
- Dark/light mode

## Project Structure

This project uses a dual-server architecture:

- **Frontend**: React application built with Vite
- **Backend**: Express server for API endpoints

### Server Files

- **`dev-server.js`**: Development server that runs both Vite and Express API server
- **`server.js`**: Production server that serves the built frontend and API endpoints

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
4. Add your API keys to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

## Running the Application

### Development Mode

Run the development server:

```
npm run dev
```

This will start both the Vite development server and the Express API server using `dev-server.js`. The application will be available at http://localhost:5173.

### Production Mode

Build the application:

```
npm run build
```

Start the production server:

```
npm start
```

This will run the `server.js` file which serves the built frontend and API endpoints. The application will be available at http://localhost:3000 (or the port specified in your `.env` file).

## API Endpoints

- `/api/openai` - Generate content using OpenAI models
- `/api/anthropic` - Generate content using Anthropic models
- `/api/text-to-speech` - Convert text to speech
- `/api/humanize` - Process content to reduce AI detection flags

## Troubleshooting

If you encounter a 404 error or connection refused error when using the API endpoints, make sure:

1. Your `.env` file contains the correct API keys
2. Both the Vite development server and Express API server are running
3. The proxy settings in `vite.config.js` are correctly pointing to your API server

## License

[MIT](LICENSE)
