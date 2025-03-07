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
    const { model, messages, temperature, max_tokens, isVercel } = req.body;
    
    console.log('OpenAI API request:', { 
      model, 
      messages: messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.substring(0, 50) + '...' : '...' })),
      temperature,
      max_tokens
    });
    
    // Check if we're on Vercel or if the client indicated it's a Vercel deployment
    const isVercelEnv = process.env.VERCEL === '1' || isVercel;
    
    // For Vercel with its 5-second timeout, use a more aggressive approach
    if (isVercelEnv) {
      console.log('Running in Vercel environment with timeout limitations');
      
      // Use a faster model if possible
      let actualModel = model;
      if (model === 'gpt-4o' || model === 'gpt-4') {
        // Suggest using a faster model in the response
        console.log('Switching to a faster model for Vercel environment');
        actualModel = 'gpt-3.5-turbo';
      }
      
      // Limit tokens more aggressively
      const actualMaxTokens = Math.min(max_tokens || 2000, 1000);
      
      const requestBody = {
        model: actualModel,
        messages,
        temperature: temperature || 0.7,
        max_tokens: actualMaxTokens
      };
      
      // Add max_completion_tokens only for o3-mini model
      if (model === 'o3-mini') {
        requestBody.max_completion_tokens = Math.min(max_tokens || 2000, 1000);
      }
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 4000 // 4 second timeout to stay within Vercel's limits
        }
      );
      
      console.log('OpenAI API response received (Vercel-optimized)');
      
      // Add a flag to indicate this was processed in Vercel's limited environment
      response.data.partial = true;
      if (actualModel !== model) {
        response.data.model_switched = true;
        response.data.original_model = model;
        response.data.used_model = actualModel;
      }
      
      res.json(response.data);
      return;
    }
    
    // Standard processing for non-Vercel environments
    const requestBody = {
      model,
      messages,
      temperature: temperature || 0.7
    };
    
    // Add max_tokens if provided
    if (max_tokens) {
      requestBody.max_tokens = max_tokens;
    }
    
    // Add max_completion_tokens only for o3-mini model
    if (model === 'o3-mini' && max_tokens) {
      requestBody.max_completion_tokens = max_tokens;
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120 second timeout for non-Vercel environments
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
    
    // Provide a more helpful error message for timeouts
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Request timed out. On Vercel\'s free plan, functions are limited to 5 seconds. Try using a shorter prompt, a faster model, or reducing the content length.'
      });
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
    
    // Check if we're on Vercel (production) or local development
    const isVercel = process.env.VERCEL === '1';
    
    // For Vercel with its 5-second timeout, use a simpler approach
    if (isVercel) {
      // Extract metadata and content parts
      const parts = content.split('---').filter(Boolean);
      
      if (parts.length < 2) {
        return res.status(400).json({ error: 'Invalid content format. Expected metadata and content separated by ---' });
      }
      
      const metadata = parts[0].trim();
      const body = parts.slice(1).join('---').trim();
      
      // Process only the first 1000 characters to stay within time limits
      const processedBody = await processContentChunk(body.substring(0, 1000));
      
      // Combine with the rest of the original content
      const combinedBody = processedBody + body.substring(1000);
      
      // Reconstruct the full content
      const humanizedContent = `${metadata}\n---\n${combinedBody}`;
      
      return res.json({ content: humanizedContent, partial: true });
    }
    
    // For local development, process the entire content
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
        timeout: 60000 // 60 second timeout for local development
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
    
    // Provide a more helpful error message for timeouts
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Request timed out. On Vercel\'s free plan, functions are limited to 5 seconds. Try humanizing smaller pieces of content or upgrade to a paid plan.'
      });
    }
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || { message: error.message }
    });
  }
});

// Helper function to process a chunk of content
async function processContentChunk(chunk) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // Use a faster model for chunks
        messages: [
          {
            role: 'system',
            content: `Rewrite this content to sound more human and natural. Reduce AI detection flags.
            Keep it concise and maintain the same meaning and language.`
          },
          {
            role: 'user',
            content: chunk
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 4000 // 4 second timeout to stay within Vercel's limits
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error processing content chunk:', error);
    // If processing fails, return the original chunk
    return chunk;
  }
}

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