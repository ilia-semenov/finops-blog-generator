import axios from 'axios';

// This is a serverless function for Vercel
export default async function handler(req, res) {
  console.log('Text-to-speech API endpoint called');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'alloy' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('Text-to-Speech request:', { textLength: text.length, voice });
    
    // Check if API key is available
    if (!process.env.VITE_OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }
    
    console.log('API key available, calling OpenAI TTS API');
    
    // Call OpenAI's TTS API
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    console.log('OpenAI TTS API response received');
    
    // Convert the audio buffer to base64
    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    console.log('Audio converted to base64, sending response');
    
    return res.status(200).json({ 
      audio: audioBase64,
      format: 'mp3'
    });
  } catch (error) {
    console.error('Error calling Text-to-Speech API:', error.response?.data || error.message);
    
    // Provide more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      if (error.response.status === 401) {
        return res.status(401).json({ error: 'Authentication error: Invalid API key' });
      } else if (error.response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded: Too many requests' });
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return res.status(500).json({ error: 'No response received from OpenAI API' });
    }
    
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || error.message || 'Unknown error'
    });
  }
} 