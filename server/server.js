import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config({ path: '../.env' });

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Proxy endpoint for Anthropic API
app.post('/api/anthropic', async (req, res) => {
  try {
    const { model, system, messages, max_tokens } = req.body;
    
    console.log('Anthropic API request:', { model, system, messages, max_tokens });
    console.log('Using API key:', process.env.VITE_ANTHROPIC_API_KEY ? 'API key is set' : 'API key is missing');
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        system,
        messages,
        max_tokens
      },
      {
        headers: {
          'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    
    console.log('Anthropic API response status:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling Anthropic API:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: error.message }
    });
  }
});

// Proxy endpoint for OpenAI API
app.post('/api/openai', async (req, res) => {
  try {
    const { model, messages, temperature, max_completion_tokens } = req.body;
    
    console.log('OpenAI API request:', { model, temperature, max_completion_tokens });
    console.log('Using API key:', process.env.VITE_OPENAI_API_KEY ? 'API key is set' : 'API key is missing');
    
    const requestBody = {
      model,
      messages,
      temperature
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
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('OpenAI API response status:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: error.message }
    });
  }
});

// For any other request, send the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`OpenAI API key: ${process.env.VITE_OPENAI_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`Anthropic API key: ${process.env.VITE_ANTHROPIC_API_KEY ? 'Set' : 'Not set'}`);
}); 