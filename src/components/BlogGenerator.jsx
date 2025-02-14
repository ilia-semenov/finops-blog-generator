import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import '../styles/BlogGenerator.css';

function BlogGenerator() {
  const [prompt, setPrompt] = useState('');
  const [blogPost, setBlogPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const systemPrompt = `Role: An experienced copywriter focusing on Cloud FinOps, and also an expert cloud cost management analyst and engineer.

Task: Create informative and engaging blog posts about cloud cost management and FinOps practices.

Language Detection and Response Rules:
1. First, analyze the user's input language:
   - If the input contains English words/phrases (e.g., "in the UK", "cloud cost") → Respond in English
   - If the input contains German words/phrases (e.g., "in Deutschland", "Kosten") → Respond in German
   - If the input contains Russian words/phrases (e.g., "в России", "облачные") → Respond in Russian
   - If no specific language indicators are present → Default to English

2. Keep these fields in English ALWAYS:
   - date (YYYY-MM-DD format)
   - author: FinOps Laboratory
   - tags: finops, cloud-cost-management

3. Generate all other content in the detected input language:
   - title
   - excerpt
   - SEO title and description
   - main content

Structure: Structure the materials with the following metadata:
---
title: [Title in detected language]
date: [Current date in ISO format]
author: FinOps Laboratory
excerpt: [Brief summary in detected language]
draft: false
seo:
  title: [SEO title in detected language]
  description: [SEO description in detected language]
  image: blog/[image-name].webp
images:
  feature: blog/[image-name].webp
  thumb: blog/[image-name].webp
tags:
  - finops
  - cloud-cost-management
---

[Main content in detected language with proper markdown formatting]

Example language detection:
- Input "FinOps in UK" → Generate in English
- Input "FinOps in Deutschland" → Generate in German
- Input "FinOps в России" → Generate in Russian`;

  const generateBlogPost = async () => {
    if (!prompt.trim()) {
      setError('Please enter a topic or question');
      return;
    }

    // Reset states before generating new content
    setBlogPost('');
    setError('');
    setCopiedMeta(false);
    setCopiedContent(false);
    setLoading(true);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7, // Add temperature to ensure fresh responses
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const formattedContent = response.data.choices[0].message.content;
      setBlogPost(formattedContent);
    } catch (err) {
      console.error('Detailed error:', err.response?.data || err.message || err);
      setError(`Failed to generate blog post: ${err.response?.data?.error?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = useCallback(async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const getRandomTopic = (text) => {
    const isRussian = /[а-яА-Я]/.test(text);
    
    const russianTopics = [
      'Оптимизация затрат на облачные сервисы в российских компаниях',
      'FinOps практики для работы с Yandex Cloud',
      'Внедрение FinOps в крупных российских предприятиях',
      'Управление облачными расходами в условиях импортозамещения'
    ];

    const englishTopics = [
      'Implementing FinOps in Enterprise Organizations',
      'Cloud Cost Optimization Best Practices',
      'FinOps for Multi-Cloud Environments',
      'Building a Successful FinOps Culture'
    ];

    const topics = isRussian ? russianTopics : englishTopics;
    return topics[Math.floor(Math.random() * topics.length)];
  };

  useEffect(() => {
    setSuggestion(getRandomTopic(prompt));
  }, [prompt]);

  const renderBlogContent = (content) => {
    if (!content.trim()) {
      return (
        <div className="empty-state">
          <p>No content generated yet. Try entering a topic about FinOps.</p>
          <p className="suggestion">Suggested topic: {suggestion}</p>
        </div>
      );
    }

    const parts = content.split('---').filter(Boolean);
    const metadata = parts[0].trim();
    const body = parts.slice(1).join('---').trim();

    return (
      <div className="blog-output">
        <div className="output-section">
          <button
            className={`copy-button ${copiedMeta ? 'copied' : ''}`}
            onClick={() => copyToClipboard(metadata, setCopiedMeta)}
            aria-label="Copy metadata"
          >
            {copiedMeta ? '✓' : '⧉'}
          </button>
          <div className="metadata-section">
            <pre>{metadata}</pre>
          </div>
        </div>

        <div className="output-section">
          <button
            className={`copy-button ${copiedContent ? 'copied' : ''}`}
            onClick={() => copyToClipboard(body, setCopiedContent)}
            aria-label="Copy content"
          >
            {copiedContent ? '✓' : '⧉'}
          </button>
          <div className="blog-content">
            {body.split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <div key={index} className="blog-paragraph">
                  {paragraph.startsWith('#') ? (
                    <h2>{paragraph.replace(/^#+\s/, '')}</h2>
                  ) : (
                    <p>{paragraph}</p>
                  )}
                </div>
              ) : null
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getPlaceholder = () => {
    const isRussian = /[а-яА-Я]/.test(prompt);
    return isRussian 
      ? "Введите тему для статьи о FinOps..."
      : "Enter your FinOps blog topic...";
  };

  // Update the key press handler
  const handleKeyPress = (e) => {
    // If Shift + Enter, allow default behavior (new line)
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    }
    
    // If just Enter, generate blog post
    if (e.key === 'Enter' && !loading) {
      e.preventDefault(); // Prevent default Enter behavior
      generateBlogPost();
    }
  };

  const handleTextareaInput = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="blog-generator">
      <div className="input-section">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            handleTextareaInput(e);
          }}
          onKeyPress={handleKeyPress}
          placeholder={getPlaceholder()}
          className="prompt-input"
          rows="1"
        />
        <button 
          onClick={generateBlogPost}
          disabled={loading}
          className="generate-button"
        >
          {loading ? 'Generating...' : 'Generate Blog Post'}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {blogPost ? renderBlogContent(blogPost) : (
        <div className="empty-state">
          <p>Enter a topic to generate a FinOps blog post.</p>
          <p className="suggestion">Try this: {suggestion}</p>
        </div>
      )}
    </div>
  );
}

export default BlogGenerator; 