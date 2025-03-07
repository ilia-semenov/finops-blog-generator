import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key from environment variables
const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error('Error: No OpenAI API key found in environment variables');
  process.exit(1);
}

console.log('API key found (starts with):', apiKey.substring(0, 5) + '...');

// Test the OpenAI API with GPT-4o
async function testGPT4o() {
  try {
    console.log('Testing OpenAI API with GPT-4o...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Write a short paragraph about cloud cost optimization.' }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('OpenAI API response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Generated content:', response.data.choices[0].message.content);
    console.log('Test successful!');
  } catch (error) {
    console.error('Error testing OpenAI API:');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testGPT4o().catch(console.error); 