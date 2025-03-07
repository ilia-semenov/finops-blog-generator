import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, system, messages, max_tokens } = req.body;
    
    console.log('Anthropic API request:', { model });
    
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
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling Anthropic API:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: error.message }
    });
  }
} 