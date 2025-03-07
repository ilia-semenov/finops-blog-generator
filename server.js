import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy endpoint for Anthropic API
app.post('/api/anthropic', async (req, res) => {
  try {
    const { model, system, messages, max_tokens } = req.body;
    
    console.log('Anthropic API request:', { model, system: system.substring(0, 100) + '...', messages });
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        system,
        messages,
        max_tokens: max_tokens || 4000
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 120000 // 120 second timeout
      }
    );
    
    console.log('Anthropic API response received');
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Anthropic API:', error.response?.data || error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || { message: error.message }
    });
  }
});

// Proxy endpoint for OpenAI API
app.post('/api/openai', async (req, res) => {
  try {
    const { model, messages, temperature, max_completion_tokens } = req.body;
    
    console.log('OpenAI API request:', { 
      model, 
      messages: messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.substring(0, 50) + '...' : '...' })),
      temperature
    });
    
    const requestBody = {
      model,
      messages,
      temperature: temperature || 0.7
    };
    
    // Add max_completion_tokens only for o3-mini model
    if (model === 'o3-mini' && max_completion_tokens) {
      requestBody.max_completion_tokens = max_completion_tokens;
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120 second timeout
      }
    );
    
    console.log('OpenAI API response received');
    res.json(response.data);
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response?.data || error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || { message: error.message }
    });
  }
});

// Text-to-speech API endpoint
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log(`Text-to-speech request: ${text.substring(0, 100)}... (${text.length} chars)`);
    
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        voice: voice || 'alloy',
        input: text.substring(0, 4096) // OpenAI has a 4096 character limit
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout
      }
    );
    
    // Convert audio buffer to base64
    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    console.log('Text-to-speech response received');
    res.json({ audio: audioBase64 });
  } catch (error) {
    console.error('Error calling text-to-speech API:', error.response?.data || error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // For arraybuffer responses, we need to convert to string
      if (error.response.data) {
        const errorData = Buffer.from(error.response.data).toString('utf8');
        console.error('Response data:', errorData);
        try {
          const parsedError = JSON.parse(errorData);
          return res.status(error.response.status).json({ error: parsedError });
        } catch (e) {
          // If we can't parse the error, just send the string
          return res.status(error.response.status).json({ error: errorData });
        }
      }
    }
    
    res.status(error.response?.status || 500).json({
      error: error.message || 'Unknown error'
    });
  }
});

// Humanize content endpoint
app.post('/api/humanize', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    console.log(`Humanize request: ${content.substring(0, 100)}... (${content.length} chars)`);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert editor who specializes in making AI-generated content sound more human and natural. 
            Your task is to rewrite the provided content to reduce AI detection flags while preserving the meaning, structure, and information.
            
            Guidelines:
            - Vary sentence structure and length
            - Use more casual language where appropriate
            - Add occasional colloquialisms or idioms
            - Introduce minor imperfections that a human might make
            - Maintain the original formatting (headings, paragraphs, etc.)
            - Preserve all factual information
            - Keep the same overall structure and flow
            - Maintain the same language as the original content
            
            Return ONLY the edited content without any explanations or comments.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120 second timeout
      }
    );
    
    console.log('Humanize response received');
    res.json({ content: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error humanizing content:', error.response?.data || error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || { message: error.message }
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// API index
app.get('/api', (req, res) => {
  res.json({
    message: 'FinOps News Generator API',
    endpoints: [
      '/api/openai',
      '/api/anthropic',
      '/api/text-to-speech',
      '/api/humanize',
      '/api/test'
    ]
  });
});

// For any other request, send the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Frontend available at http://localhost:${PORT}`);
  });
}

// Export the Express app for serverless environments
export default app; 