import { OpenAI } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
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
      temperature: 0.7,
    });

    // Extract the humanized content
    const humanizedContent = response.choices[0].message.content;
    
    // Process the response to ensure metadata is preserved
    let processedContent = humanizedContent;
    
    // If the response doesn't include the metadata section properly, reconstruct it
    if (!humanizedContent.includes('---') || !humanizedContent.includes('title:')) {
      processedContent = `---\n${metadata}\n---\n\n${humanizedContent}`;
    }

    return res.status(200).json({ content: processedContent });
  } catch (error) {
    console.error('Error humanizing content:', error);
    return res.status(500).json({ 
      error: error.message || 'An error occurred while humanizing the content' 
    });
  }
} 