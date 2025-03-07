import { createServer } from 'vite';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function startDevServer() {
  // Start Vite dev server
  const vite = await createServer({
    server: {
      port: 5173,
    },
  });
  
  await vite.listen();
  console.log('Vite server started at http://localhost:5173');

  // Create Express server for API endpoints
  const app = express();
  const PORT = 3001;

  // Enable CORS
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Log environment variables (without revealing full keys)
  console.log('Environment variables:');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (starts with ' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)' : 'Not set');

  // Add global error handler for unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // OpenAI API endpoint for blog post generation
  app.post('/api/openai', async (req, res) => {
    try {
      console.log('Received OpenAI request');
      
      const { model, messages, temperature, max_completion_tokens } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        console.error('Messages are required and must be an array');
        return res.status(400).json({ error: 'Messages are required and must be an array' });
      }

      console.log('OpenAI request:', { 
        model,
        temperature,
        messagesCount: messages.length,
        firstMessagePreview: messages[0]?.content?.substring(0, 50) + '...' 
      });
      
      // Check if API key is available - try both environment variables
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OpenAI API key is missing');
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }
      
      console.log('API key available, preparing OpenAI API call');
      
      // Create the request payload
      const payload = {
        model: model || 'gpt-4o',
        messages,
        temperature: temperature || 0.7
      };
      
      // Add max_completion_tokens only for o3-mini model
      if (model === 'o3-mini' && max_completion_tokens) {
        payload.max_completion_tokens = max_completion_tokens;
      }
      
      console.log('Request payload:', { 
        model: payload.model,
        temperature: payload.temperature,
        messagesCount: payload.messages.length
      });
      
      try {
        console.log('Sending request to OpenAI API...');
        
        // Call OpenAI's API
        const response = await axios({
          method: 'post',
          url: 'https://api.openai.com/v1/chat/completions',
          data: payload,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 120 second timeout (2 minutes)
        });
        
        console.log('OpenAI API response received:', {
          status: response.status,
          choices: response.data?.choices?.length || 0
        });
        
        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
          console.error('Invalid response format from OpenAI API:', response.data);
          return res.status(500).json({ error: 'Invalid response format from OpenAI API' });
        }
        
        return res.status(200).json(response.data);
      } catch (apiError) {
        console.error('OpenAI API Error:', apiError);
        
        // Try to extract more detailed error information
        let errorMessage = 'OpenAI API error: ';
        
        if (apiError.response) {
          console.error('Response status:', apiError.response.status);
          console.error('Response headers:', apiError.response.headers);
          
          try {
            console.error('Response data:', typeof apiError.response.data === 'object' 
              ? JSON.stringify(apiError.response.data, null, 2) 
              : apiError.response.data);
          } catch (e) {
            console.error('Could not stringify response data:', e);
          }
          
          errorMessage += apiError.response.data?.error?.message || JSON.stringify(apiError.response.data);
          return res.status(apiError.response.status).json({ error: errorMessage });
        } else if (apiError.request) {
          console.error('No response received:', apiError.request._currentUrl);
          
          if (apiError.code === 'ECONNREFUSED') {
            return res.status(500).json({ error: 'Connection refused. Please check your network connection and API endpoint.' });
          } else if (apiError.code === 'ECONNABORTED') {
            return res.status(500).json({ error: 'Connection timed out. The request took too long to complete.' });
          } else if (apiError.code === 'ETIMEDOUT') {
            return res.status(500).json({ error: 'Connection timed out. The server did not respond in time.' });
          }
          
          return res.status(500).json({ error: 'No response received from OpenAI API: ' + apiError.message });
        }
        
        return res.status(500).json({ error: errorMessage + apiError.message });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Server error: ' + error.message, stack: error.stack });
    }
  });

  // Anthropic API endpoint
  app.post('/api/anthropic', async (req, res) => {
    try {
      console.log('Received Anthropic request');
      
      const { model, system, messages, max_tokens } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        console.error('Messages are required and must be an array');
        return res.status(400).json({ error: 'Messages are required and must be an array' });
      }

      console.log('Anthropic request:', { 
        model,
        messagesCount: messages.length,
        systemPromptLength: system?.length || 0,
        firstMessagePreview: messages[0]?.content?.substring(0, 50) + '...' 
      });
      
      // Check if API key is available - try both environment variables
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error('Anthropic API key is missing');
        return res.status(500).json({ error: 'Anthropic API key is not configured' });
      }
      
      console.log('API key available, preparing Anthropic API call');
      
      // Create the request payload
      const payload = {
        model,
        system,
        messages,
        max_tokens: max_tokens || 2000
      };
      
      console.log('Request payload:', { 
        ...payload, 
        system: system ? `${system.length} chars` : 'none',
        messages: `${payload.messages.length} messages` 
      });
      
      try {
        console.log('Sending request to Anthropic API...');
        
        // Call Anthropic's API
        const response = await axios({
          method: 'post',
          url: 'https://api.anthropic.com/v1/messages',
          data: payload,
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout
        });
        
        console.log('Anthropic API response received:', {
          status: response.status,
          contentLength: response.data?.content?.length || 0
        });
        
        return res.status(200).json(response.data);
      } catch (apiError) {
        console.error('Anthropic API Error:', apiError);
        
        // Try to extract more detailed error information
        let errorMessage = 'Anthropic API error: ';
        
        if (apiError.response) {
          console.error('Response status:', apiError.response.status);
          console.error('Response data:', apiError.response.data);
          
          errorMessage += apiError.response.data?.error?.message || JSON.stringify(apiError.response.data);
          return res.status(apiError.response.status).json({ error: errorMessage });
        } else if (apiError.request) {
          console.error('No response received:', apiError.request);
          
          if (apiError.code === 'ECONNREFUSED') {
            return res.status(500).json({ error: 'Connection refused. Please check your network connection and API endpoint.' });
          } else if (apiError.code === 'ECONNABORTED') {
            return res.status(500).json({ error: 'Connection timed out. The request took too long to complete.' });
          } else if (apiError.code === 'ETIMEDOUT') {
            return res.status(500).json({ error: 'Connection timed out. The server did not respond in time.' });
          }
          
          return res.status(500).json({ error: 'No response received from Anthropic API: ' + apiError.message });
        }
        
        return res.status(500).json({ error: errorMessage + apiError.message });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Server error: ' + error.message, stack: error.stack });
    }
  });

  // Text-to-speech API implementation
  app.post('/api/text-to-speech', async (req, res) => {
    try {
      console.log('Received text-to-speech request');
      
      const { text, voice = 'alloy' } = req.body;
      
      if (!text) {
        console.error('Text is required but was not provided');
        return res.status(400).json({ error: 'Text is required' });
      }

      console.log('Text-to-Speech request:', { 
        textLength: text.length, 
        voice,
        textPreview: text.substring(0, 50) + '...' 
      });
      
      // Check if API key is available - try both environment variables
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OpenAI API key is missing');
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }
      
      console.log('API key available, preparing OpenAI TTS API call');
      
      // Create the request payload
      const payload = {
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3'
      };
      
      console.log('Request payload:', { ...payload, input: 'text of length ' + text.length });
      
      try {
        console.log('Sending request to OpenAI TTS API...');
        
        // Call OpenAI's TTS API
        const response = await axios({
          method: 'post',
          url: 'https://api.openai.com/v1/audio/speech',
          data: payload,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 60000 // 60 second timeout
        });
        
        console.log('OpenAI TTS API response received:', {
          status: response.status,
          headers: response.headers,
          dataLength: response.data?.length || 0
        });
        
        if (!response.data || response.data.length === 0) {
          console.error('Empty response from OpenAI API');
          return res.status(500).json({ error: 'Empty response from OpenAI API' });
        }
        
        // Convert the audio buffer to base64
        const audioBase64 = Buffer.from(response.data).toString('base64');
        
        console.log('Audio converted to base64, length:', audioBase64.length);
        
        return res.status(200).json({ 
          audio: audioBase64,
          format: 'mp3'
        });
      } catch (apiError) {
        console.error('OpenAI API Error:', apiError);
        
        // Try to extract more detailed error information
        let errorMessage = 'OpenAI API error: ';
        
        if (apiError.response) {
          console.error('Response status:', apiError.response.status);
          console.error('Response headers:', apiError.response.headers);
          
          // Try to parse the response data if it's not a buffer
          if (apiError.response.data) {
            if (apiError.response.data instanceof Buffer) {
              try {
                const textData = apiError.response.data.toString('utf8');
                console.error('Response data (buffer converted to text):', textData);
                
                try {
                  const jsonData = JSON.parse(textData);
                  console.error('Response data (parsed JSON):', jsonData);
                  errorMessage += jsonData.error?.message || textData;
                } catch (jsonError) {
                  errorMessage += textData;
                }
              } catch (bufferError) {
                console.error('Could not convert buffer to text:', bufferError);
                errorMessage += 'Could not parse error response';
              }
            } else {
              console.error('Response data:', apiError.response.data);
              errorMessage += apiError.response.data.error?.message || JSON.stringify(apiError.response.data);
            }
          }
          
          return res.status(apiError.response.status).json({ error: errorMessage });
        } else if (apiError.request) {
          console.error('No response received:', apiError.request);
          
          if (apiError.code === 'ECONNREFUSED') {
            return res.status(500).json({ error: 'Connection refused. Please check your network connection and API endpoint.' });
          } else if (apiError.code === 'ECONNABORTED') {
            return res.status(500).json({ error: 'Connection timed out. The request took too long to complete.' });
          } else if (apiError.code === 'ETIMEDOUT') {
            return res.status(500).json({ error: 'Connection timed out. The server did not respond in time.' });
          }
          
          return res.status(500).json({ error: 'No response received from OpenAI API: ' + apiError.message });
        }
        
        return res.status(500).json({ error: errorMessage + apiError.message });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Server error: ' + error.message, stack: error.stack });
    }
  });

  // Add the humanize endpoint
  app.post('/api/humanize', async (req, res) => {
    try {
      console.log('Received humanize request');
      
      const { content } = req.body;

      if (!content) {
        console.error('Content is required but was not provided');
        return res.status(400).json({ error: 'Content is required' });
      }

      console.log('Humanize request:', { 
        contentLength: content.length,
        contentPreview: content.substring(0, 50) + '...' 
      });
      
      // Check if API key is available
      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OpenAI API key is missing');
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      // Split the content into metadata and body
      const parts = content.split('---').filter(Boolean);
      const metadata = parts[0].trim();
      const body = parts.slice(1).join('---').trim();

      // Prepare the system prompt for humanizing
      const systemPrompt = `You are an expert editor who specializes in making AI-generated content appear more human-written. 
      Your task is to edit the provided content to reduce AI detection flags while preserving the meaning, information, and structure.
      
      Follow these guidelines:
      1. Vary sentence structure and length more naturally
      2. Introduce occasional minor grammatical variations that humans make
      3. Use more colloquial phrases and expressions where appropriate
      4. Add personal touches, anecdotes, or rhetorical questions
      5. Reduce repetitive patterns and formulaic transitions
      6. Maintain the original information, facts, and key points
      7. Preserve the overall structure and formatting
      8. Keep the same language as the original content
      9. Do not change the metadata section (title, date, etc.)
      
      Return the full content with your edits, keeping the metadata section unchanged.`;

      console.log('Calling OpenAI API to humanize content...');
      
      // Call the OpenAI API using axios instead of the SDK
      const response = await axios({
        method: 'post',
        url: 'https://api.openai.com/v1/chat/completions',
        data: {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Please humanize this content to reduce AI detection flags:\n\n---\n${metadata}\n---\n\n${body}`
            }
          ],
          temperature: 0.7
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120 second timeout
      });

      // Extract the humanized content
      const humanizedContent = response.data.choices[0].message.content;
      
      // Process the response to ensure metadata is preserved
      let processedContent = humanizedContent;
      
      // If the response doesn't include the metadata section properly, reconstruct it
      if (!humanizedContent.includes('---') || !humanizedContent.includes('title:')) {
        processedContent = `---\n${metadata}\n---\n\n${humanizedContent}`;
      }

      console.log('Content humanized successfully');
      return res.status(200).json({ content: processedContent });
    } catch (error) {
      console.error('Error humanizing content:', error);
      return res.status(500).json({ 
        error: error.message || 'An error occurred while humanizing the content' 
      });
    }
  });

  // Simple test endpoint
  app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'API is working!' });
  });

  // API index endpoint
  app.get('/api', (req, res) => {
    res.status(200).json({ 
      message: 'API is working!',
      availableEndpoints: [
        '/api/openai',
        '/api/anthropic',
        '/api/text-to-speech',
        '/api/humanize',
        '/api/test'
      ]
    });
  });

  // Start the Express server
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
  });
}

startDevServer().catch(err => {
  console.error('Failed to start development server:', err);
  process.exit(1);
}); 