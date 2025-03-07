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

// Test the OpenAI API with a simple completion request
async function testOpenAI() {
  try {
    console.log('Testing OpenAI API with a simple completion request...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('OpenAI API response:', response.data);
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

// Test the OpenAI TTS API
async function testTTS() {
  try {
    console.log('Testing OpenAI TTS API...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        voice: 'alloy',
        input: 'Hello, this is a test of the OpenAI text to speech API.',
        response_format: 'mp3'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    console.log('OpenAI TTS API response received');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data length:', response.data.length);
    console.log('Test successful!');
  } catch (error) {
    console.error('Error testing OpenAI TTS API:');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      if (error.response.data instanceof Buffer) {
        try {
          const textData = error.response.data.toString('utf8');
          console.error('Response data (buffer converted to text):', textData);
          
          try {
            const jsonData = JSON.parse(textData);
            console.error('Response data (parsed JSON):', jsonData);
          } catch (jsonError) {
            // Not JSON, that's fine
          }
        } catch (bufferError) {
          console.error('Could not convert buffer to text:', bufferError);
        }
      } else {
        console.error('Response data:', error.response.data);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run the tests
async function runTests() {
  console.log('Running OpenAI API tests...');
  
  await testOpenAI();
  console.log('\n----------------------------\n');
  await testTTS();
}

runTests().catch(console.error); 