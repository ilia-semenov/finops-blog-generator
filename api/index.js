// This file helps Vercel discover all API routes
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working!',
    availableEndpoints: [
      '/api/text-to-speech',
      '/api/openai',
      '/api/anthropic',
      '/api/test'
    ]
  });
} 