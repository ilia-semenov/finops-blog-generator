import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, messages, temperature, max_completion_tokens } = req.body;
    
    console.log('OpenAI API request:', { model });
    
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
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: error.message }
    });
  }
} 