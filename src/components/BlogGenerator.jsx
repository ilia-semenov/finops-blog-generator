import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import '../styles/BlogGenerator.css';
import LanguageSelector from './LanguageSelector';
import ModelSelector from './ModelSelector';
import AudioPlayer from './AudioPlayer';

const getLanguageStrings = (languageCode) => {
  const strings = {
    'en': {
      placeholder: "Enter your FinOps blog topic...",
      emptyState: "No content generated yet. Try entering a topic about FinOps.",
      enterTopic: "Enter a topic to generate a FinOps blog post.",
      trySuggestion: "Try this:",
      generating: "Generating...",
      generateButton: "Generate Blog Post",
      errorPrompt: "Please enter a topic or question",
      modelLabel: "Model:",
      lengthLabel: "Length:",
      short: "Short",
      medium: "Medium",
      long: "Long",
      generatePodcast: "Generate Podcast",
      generatingPodcast: "Generating Podcast...",
      history: "History",
      noHistory: "No history yet",
      clearHistory: "Clear History",
      loadFromHistory: "Load",
      humanizeContent: "Humanize Content",
      humanizingContent: "Humanizing...",
      humanizeSuccess: "Content humanized successfully!",
      humanizeTooltip: "Reduce AI detection flags in the content"
    },
    'ru': {
      placeholder: "Введите тему для статьи о FinOps...",
      emptyState: "Контент еще не сгенерирован. Попробуйте ввести тему о FinOps.",
      enterTopic: "Введите тему для создания статьи о FinOps.",
      trySuggestion: "Попробуйте это:",
      generating: "Генерация...",
      generateButton: "Создать статью",
      errorPrompt: "Пожалуйста, введите тему или вопрос",
      modelLabel: "Модель:",
      lengthLabel: "Длина:",
      short: "Короткая",
      medium: "Средняя",
      long: "Длинная",
      generatePodcast: "Создать подкаст",
      generatingPodcast: "Создание подкаста...",
      history: "История",
      noHistory: "История пуста",
      clearHistory: "Очистить историю",
      loadFromHistory: "Загрузить",
      humanizeContent: "Очеловечить контент",
      humanizingContent: "Обработка...",
      humanizeSuccess: "Контент успешно обработан!",
      humanizeTooltip: "Снизить признаки ИИ-генерации в контенте"
    },
    'de': {
      placeholder: "Geben Sie Ihr FinOps-Blogthema ein...",
      emptyState: "Noch keine Inhalte generiert. Versuchen Sie ein Thema über FinOps einzugeben.",
      enterTopic: "Geben Sie ein Thema ein, um einen FinOps-Blogbeitrag zu erstellen.",
      trySuggestion: "Versuchen Sie dies:",
      generating: "Generierung...",
      generateButton: "Blogbeitrag erstellen",
      errorPrompt: "Bitte geben Sie ein Thema oder eine Frage ein",
      modelLabel: "Modell:",
      lengthLabel: "Länge:",
      short: "Kurz",
      medium: "Mittel",
      long: "Lang",
      generatePodcast: "Podcast erstellen",
      generatingPodcast: "Podcast wird erstellt...",
      history: "Verlauf",
      noHistory: "Noch kein Verlauf",
      clearHistory: "Verlauf löschen",
      loadFromHistory: "Laden",
      humanizeContent: "Inhalt humanisieren",
      humanizingContent: "Humanisierung...",
      humanizeSuccess: "Inhalt erfolgreich humanisiert!",
      humanizeTooltip: "KI-Erkennungsmerkmale im Inhalt reduzieren"
    },
    'es': {
      placeholder: "Ingrese su tema de blog sobre FinOps...",
      emptyState: "Aún no se ha generado contenido. Intente ingresar un tema sobre FinOps.",
      enterTopic: "Ingrese un tema para generar un post de blog sobre FinOps.",
      trySuggestion: "Pruebe esto:",
      generating: "Generando...",
      generateButton: "Generar Post",
      errorPrompt: "Por favor, ingrese un tema o pregunta",
      modelLabel: "Modelo:",
      lengthLabel: "Longitud:",
      short: "Corto",
      medium: "Medio",
      long: "Largo",
      generatePodcast: "Generar Podcast",
      generatingPodcast: "Generando Podcast...",
      history: "Historial",
      noHistory: "Sin historial",
      clearHistory: "Borrar historial",
      loadFromHistory: "Cargar",
      humanizeContent: "Humanizar contenido",
      humanizingContent: "Humanizando...",
      humanizeSuccess: "¡Contenido humanizado con éxito!",
      humanizeTooltip: "Reducir marcadores de detección de IA en el contenido"
    },
    'fr': {
      placeholder: "Entrez votre sujet de blog FinOps...",
      emptyState: "Aucun contenu généré. Essayez d'entrer un sujet sur FinOps.",
      enterTopic: "Entrez un sujet pour générer un article de blog FinOps.",
      trySuggestion: "Essayez ceci :",
      generating: "Génération...",
      generateButton: "Générer l'article",
      errorPrompt: "Veuillez entrer un sujet ou une question",
      modelLabel: "Modèle :",
      lengthLabel: "Longueur :",
      short: "Court",
      medium: "Moyen",
      long: "Long",
      generatePodcast: "Générer un Podcast",
      generatingPodcast: "Génération du Podcast...",
      history: "Historique",
      noHistory: "Pas d'historique",
      clearHistory: "Effacer l'historique",
      loadFromHistory: "Charger",
      humanizeContent: "Humaniser le contenu",
      humanizingContent: "Humanisation...",
      humanizeSuccess: "Contenu humanisé avec succès !",
      humanizeTooltip: "Réduire les marqueurs de détection d'IA dans le contenu"
    }
  };

  return strings[languageCode] || strings['en'];
};

function BlogGenerator() {
  const [prompt, setPrompt] = useState('');
  const [blogPost, setBlogPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [selectedModel, setSelectedModel] = useState('default');
  const [outputLength, setOutputLength] = useState('medium');
  const [audioSrc, setAudioSrc] = useState('');
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [podcastTitle, setPodcastTitle] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [humanizeSuccess, setHumanizeSuccess] = useState(false);
  const [showVercelWarning, setShowVercelWarning] = useState(true);

  const strings = getLanguageStrings(selectedLanguage === 'auto' ? 'en' : selectedLanguage);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('finopsHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing history from localStorage:', e);
        localStorage.removeItem('finopsHistory');
      }
    }
    
    // Check if we should show the Vercel warning
    const hideVercelWarning = localStorage.getItem('hideVercelWarning');
    if (hideVercelWarning) {
      setShowVercelWarning(false);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('finopsHistory', JSON.stringify(history));
  }, [history]);

  // Reset humanize success message after 3 seconds
  useEffect(() => {
    if (humanizeSuccess) {
      const timer = setTimeout(() => {
        setHumanizeSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [humanizeSuccess]);

  const getLengthInstruction = (length) => {
    switch (length) {
      case 'short':
        return 'Keep the blog post concise, around 500 words.';
      case 'long':
        return 'Create a detailed blog post of approximately 2000 words.';
      default:
        return 'Write a blog post of about 1000 words.';
    }
  };

  const getSystemPrompt = (language) => `Role: An experienced copywriter focusing on Cloud FinOps, and also an expert cloud cost management analyst and engineer.

Task: Create informative and engaging blog posts about cloud cost management and FinOps practices.

${getLengthInstruction(outputLength)}

Language Requirements:
${language === 'auto' ? `
Detect and use the language from the user's input. If no clear language indicators are present, default to English.
` : `
Generate the content in ${language} language, regardless of the input language.
`}

Keep these fields in English ALWAYS:
- date (YYYY-MM-DD format)
- author: FinOps Laboratory
- tags: finops, cloud-cost-management

All other content should be in ${language === 'auto' ? 'the detected/default' : 'the selected'} language:
- title
- excerpt
- SEO title and description
- main content

Structure: Structure the materials with the following metadata:
---
title: [Title in ${language === 'auto' ? 'detected/default' : 'selected'} language]
date: [Current date in ISO format]
author: FinOps Laboratory
excerpt: [Brief summary in ${language === 'auto' ? 'detected/default' : 'selected'} language]
draft: false
seo:
  title: [SEO title in ${language === 'auto' ? 'detected/default' : 'selected'} language]
  description: [SEO description in ${language === 'auto' ? 'detected/default' : 'selected'} language]
  image: blog/[image-name].webp
images:
  feature: blog/[image-name].webp
  thumb: blog/[image-name].webp
tags:
  - finops
  - cloud-cost-management
---

[Main content in ${language === 'auto' ? 'detected/default' : 'selected'} language]`;

  const generateBlogPost = async () => {
    if (!prompt.trim()) {
      setError(strings.errorPrompt);
      return;
    }

    setBlogPost('');
    setError('');
    setCopiedMeta(false);
    setCopiedContent(false);
    setLoading(true);
    // Reset audio state when generating a new blog post
    setAudioSrc('');
    setPodcastTitle('');

    const getLanguageName = (code) => {
      const languages = {
        'en': 'English',
        'ru': 'Russian',
        'de': 'German',
        'es': 'Spanish',
        'fr': 'French'
      };
      return languages[code] || 'English';
    };

    try {
      console.log('Generating blog post with model:', selectedModel);
      console.log('Selected language:', selectedLanguage);
      console.log('Selected length:', outputLength);
      
      // Determine which API to use based on model name
      if (selectedModel.includes('claude')) {
        console.log('Using Anthropic API');
        await generateWithAnthropic(getLanguageName);
      } else if (selectedModel === 'o3-mini') {
        console.log('Using OpenAI API with O3 Mini model');
        await generateWithO3Mini(getLanguageName);
      } else if (selectedModel.includes('gpt') || selectedModel === 'default') {
        console.log('Using OpenAI API');
        await generateWithOpenAI(getLanguageName);
      } else {
        // Default to OpenAI if model type is unclear
        console.log('Model type unclear, defaulting to OpenAI API');
        await generateWithOpenAI(getLanguageName);
      }
      
      // History is now saved in each API function after content is generated
      
    } catch (err) {
      console.error('Error generating blog post:', err);
      
      let errorMessage = 'Failed to generate blog post: ';
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 401) {
          errorMessage += 'Authentication error: Invalid API key. Please check your API key and try again.';
        } else if (err.response.status === 429) {
          errorMessage += 'Rate limit exceeded: Too many requests. Please try again later.';
        } else if (err.response.status === 400) {
          errorMessage += `Bad request: ${err.response.data?.error || 'Please check your inputs and try again.'}`;
        } else if (err.response.status === 504 || err.response.status === 503) {
          errorMessage += 'Server timeout: The request took too long to process. This is likely due to Vercel\'s 5-second timeout limit on the free plan. Try using a shorter prompt, selecting a faster model, or reducing the content length.';
        } else {
          errorMessage += err.response.data?.error || err.response.statusText || err.message;
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. The server took too long to respond. This may be due to Vercel\'s timeout limits.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage += 'Connection refused. The server may be down or unreachable.';
      } else if (err.message.includes('Network Error')) {
        errorMessage += 'Network error: Unable to connect to the API. Please check your internet connection.';
      } else if (err.message.includes('timeout') || err.message.includes('Timeout') || err.message.includes('504')) {
        errorMessage += 'Server timeout: The request took too long to process. This is likely due to Vercel\'s 5-second timeout limit on the free plan. Try using a shorter prompt, selecting a faster model, or reducing the content length.';
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to load a history item
  const loadFromHistory = (historyItem) => {
    setPrompt(historyItem.prompt);
    setBlogPost(historyItem.blogPost);
    setSelectedLanguage(historyItem.selectedLanguage);
    setSelectedModel(historyItem.selectedModel);
    setOutputLength(historyItem.outputLength);
    setAudioSrc(''); // Reset audio when loading from history
    setPodcastTitle('');
    setShowHistory(false); // Close history panel after selection
  };

  // Function to clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('finopsHistory');
  };

  const generateWithOpenAI = async (getLanguageName) => {
    const messages = [];
      
    if (selectedLanguage !== 'auto') {
      messages.push({
        role: 'system',
        content: `CRITICAL INSTRUCTION: You MUST write your response in ${getLanguageName(selectedLanguage)}. 
        This is a strict requirement that overrides any language in the user's input.`
      });
    }

    messages.push({
      role: 'system',
      content: getSystemPrompt(selectedLanguage)
    });

    if (selectedLanguage !== 'auto') {
      messages.push({
        role: 'system',
        content: `FINAL REMINDER: Regardless of the input language, you must write in ${getLanguageName(selectedLanguage)}.
        If the user's query is in a different language, translate it first, then respond in ${getLanguageName(selectedLanguage)}.`
      });
    }

    // Add a note about Vercel's timeout limits for deployed version
    const isDeployed = window.location.hostname.includes('vercel.app');
    if (isDeployed) {
      messages.push({
        role: 'system',
        content: `IMPORTANT: This request is running on Vercel's free plan with a 5-second timeout limit. 
        Respond quickly and concisely. Keep your response shorter than usual while still addressing the main points.`
      });
    }

    messages.push({
      role: 'user',
      content: selectedLanguage === 'auto' 
        ? prompt 
        : `Generate a response in ${getLanguageName(selectedLanguage)} for the following query: ${prompt}`
    });

    const modelToUse = selectedModel === 'default' ? 'gpt-4o' : selectedModel;
    
    // Adjust max tokens based on output length and deployment environment
    let maxTokens;
    if (isDeployed) {
      // Use smaller token limits for deployed version to avoid timeouts
      maxTokens = outputLength === 'short' ? 500 : outputLength === 'long' ? 1000 : 750;
    } else {
      // Use normal token limits for local development
      maxTokens = outputLength === 'short' ? 1000 : outputLength === 'long' ? 4000 : 2000;
    }

    try {
      console.log('Calling OpenAI API with model:', modelToUse);
      console.log('Using max tokens:', maxTokens);
      
      // Use API endpoint
      const response = await axios.post(
        '/api/openai',
        {
          model: modelToUse,
          messages: messages,
          temperature: 0.7,
          max_tokens: maxTokens,
          // Add a flag to indicate this is running on Vercel
          isVercel: isDeployed
        },
        {
          timeout: isDeployed ? 4500 : 60000 // 4.5 seconds for Vercel, 60 seconds for local
        }
      );

      console.log('OpenAI API response received');
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const formattedContent = response.data.choices[0].message.content;
        setBlogPost(formattedContent);
        
        // Add to history after setting the blog post
        addToHistory(formattedContent);
        
        // If this was a partial response (truncated due to Vercel limits), show a note
        if (response.data.partial) {
          setTimeout(() => {
            setError(
              <div>
                <strong>Note:</strong> Due to Vercel's 5-second timeout limit, your content was truncated. 
                <div className="error-suggestion">
                  For complete content:
                  <ul>
                    <li>Try a shorter prompt</li>
                    <li>Select a faster model (like GPT-3.5 or Claude Haiku)</li>
                    <li>Choose "Short" for content length</li>
                    <li>Run the application locally</li>
                  </ul>
                </div>
              </div>
            );
          }, 1000);
        }
      } else {
        throw new Error('Unexpected response format from OpenAI API');
      }
    } catch (err) {
      console.error('OpenAI API error details:', err.response?.data || err.message || err);
      throw err; // Re-throw to be caught by the main error handler
    }
  };

  const generateWithO3Mini = async (getLanguageName) => {
    const messages = [];
      
    if (selectedLanguage !== 'auto') {
      messages.push({
        role: 'system',
        content: `CRITICAL INSTRUCTION: You MUST write your response in ${getLanguageName(selectedLanguage)}. 
        This is a strict requirement that overrides any language in the user's input.`
      });
    }

    messages.push({
      role: 'system',
      content: getSystemPrompt(selectedLanguage)
    });

    if (selectedLanguage !== 'auto') {
      messages.push({
        role: 'system',
        content: `FINAL REMINDER: Regardless of the input language, you must write in ${getLanguageName(selectedLanguage)}.
        If the user's query is in a different language, translate it first, then respond in ${getLanguageName(selectedLanguage)}.`
      });
    }

    messages.push({
      role: 'user',
      content: selectedLanguage === 'auto' 
        ? prompt 
        : `Generate a response in ${getLanguageName(selectedLanguage)} for the following query: ${prompt}`
    });

    try {
      console.log('Calling OpenAI API with O3 Mini model');
      
      // Use API endpoint
      const response = await axios.post(
        '/api/openai',
        {
          model: 'o3-mini',
          messages: messages,
          max_completion_tokens: outputLength === 'short' ? 1000 : outputLength === 'long' ? 4000 : 2000,
        },
        {
          timeout: 60000 // 60 second timeout
        }
      );

      console.log('OpenAI API response received');
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const formattedContent = response.data.choices[0].message.content;
        setBlogPost(formattedContent);
        
        // Add to history after setting the blog post
        addToHistory(formattedContent);
      } else {
        throw new Error('Unexpected response format from OpenAI API');
      }
    } catch (err) {
      console.error('OpenAI API error details:', err.response?.data || err.message || err);
      throw err; // Re-throw to be caught by the main error handler
    }
  };

  const generateWithAnthropic = async (getLanguageName) => {
    let systemPrompt = getSystemPrompt(selectedLanguage);
    
    if (selectedLanguage !== 'auto') {
      systemPrompt = `CRITICAL INSTRUCTION: You MUST write your response in ${getLanguageName(selectedLanguage)}. 
      This is a strict requirement that overrides any language in the user's input.
      
      ${systemPrompt}
      
      FINAL REMINDER: Regardless of the input language, you must write in ${getLanguageName(selectedLanguage)}.
      If the user's query is in a different language, translate it first, then respond in ${getLanguageName(selectedLanguage)}.`;
    }

    const userContent = selectedLanguage === 'auto' 
      ? prompt 
      : `Generate a response in ${getLanguageName(selectedLanguage)} for the following query: ${prompt}`;

    // Set max tokens based on output length
    const maxTokens = outputLength === 'short' ? 1000 : outputLength === 'long' ? 4000 : 2000;

    try {
      console.log('Calling Anthropic API with model:', selectedModel);
      
      // Use API endpoint
      const response = await axios.post(
        '/api/anthropic',
        {
          model: selectedModel,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userContent
            }
          ],
          max_tokens: maxTokens
        },
        {
          timeout: 60000 // 60 second timeout
        }
      );

      console.log('Anthropic API response:', response);
      
      if (response.data && response.data.content && response.data.content.length > 0) {
        const formattedContent = response.data.content[0].text;
        setBlogPost(formattedContent);
        
        // Add to history after setting the blog post
        addToHistory(formattedContent);
      } else {
        throw new Error('Unexpected response format from Anthropic API');
      }
    } catch (err) {
      console.error('Anthropic API error details:', err.response?.data || err.message || err);
      throw err; // Re-throw to be caught by the main error handler
    }
  };

  // Helper function to add to history
  const addToHistory = (content) => {
    const timestamp = new Date().toISOString();
    const historyItem = {
      id: timestamp,
      timestamp,
      prompt,
      blogPost: content,
      selectedLanguage,
      selectedModel,
      outputLength
    };
    
    setHistory(prevHistory => [historyItem, ...prevHistory.slice(0, 19)]); // Keep last 20 items
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

  const getRandomTopic = () => {
    const topics = {
      'en': [
        'Implementing FinOps in Enterprise Organizations',
        'Cloud Cost Optimization Best Practices',
        'FinOps for Multi-Cloud Environments',
        'Building a Successful FinOps Culture'
      ],
      'ru': [
        'Оптимизация затрат на облачные сервисы в российских компаниях',
        'FinOps практики для работы с Yandex Cloud',
        'Внедрение FinOps в крупных российских предприятиях',
        'Управление облачными расходами в условиях импортозамещения'
      ],
      'de': [
        'FinOps-Implementierung in Unternehmensorganisationen',
        'Best Practices für Cloud-Kostenoptimierung',
        'FinOps für Multi-Cloud-Umgebungen',
        'Aufbau einer erfolgreichen FinOps-Kultur'
      ],
      'es': [
        'Implementación de FinOps en organizaciones empresariales',
        'Mejores prácticas de optimización de costos en la nube',
        'FinOps para entornos multicloud',
        'Construyendo una cultura FinOps exitosa'
      ],
      'fr': [
        'Mise en œuvre de FinOps dans les organisations',
        'Meilleures pratiques d\'optimisation des coûts cloud',
        'FinOps pour les environnements multi-cloud',
        'Construire une culture FinOps réussie'
      ]
    };

    const languageTopics = topics[selectedLanguage === 'auto' ? 'en' : selectedLanguage] || topics['en'];
    return languageTopics[Math.floor(Math.random() * languageTopics.length)];
  };

  useEffect(() => {
    setSuggestion(getRandomTopic());
  }, [prompt, selectedLanguage]);

  const generatePodcast = async (content) => {
    if (!content) return;
    
    try {
      setGeneratingAudio(true);
      setError(''); // Clear any previous errors
      
      // Extract the title from the content
      const titleMatch = content.match(/title:\s*\[(.*?)\]/);
      const podcastTitle = titleMatch ? titleMatch[1] : 'FinOps Podcast';
      setPodcastTitle(podcastTitle);
      
      // Prepare the podcast script
      const parts = content.split('---').filter(Boolean);
      const body = parts.slice(1).join('---').trim();
      
      // Create an introduction
      const intro = `Welcome to the FinOps Laboratory podcast. Today we're discussing: ${podcastTitle}. Let's dive in.`;
      
      // Combine intro and content, limiting to a reasonable length for TTS
      const podcastScript = intro + '\n\n' + body;
      const limitedScript = podcastScript.substring(0, 4000); // Limit to 4000 chars to avoid TTS API limits
      
      console.log('Generating podcast with script length:', limitedScript.length);
      
      // Call the text-to-speech API
      try {
        console.log('Calling text-to-speech API...');
        const response = await axios.post('/api/text-to-speech', {
          text: limitedScript,
          voice: 'onyx' // Using a professional voice
        }, {
          timeout: 60000 // 60 second timeout
        });
        
        console.log('Text-to-speech API response received');
        
        // Create audio source from base64 data
        const audioData = response.data.audio;
        const audioSrc = `data:audio/mp3;base64,${audioData}`;
        setAudioSrc(audioSrc);
      } catch (apiError) {
        console.error('API Error details:', apiError);
        
        let errorMessage = 'Failed to generate podcast: ';
        
        if (apiError.code === 'ECONNABORTED') {
          errorMessage += 'Request timed out. The server took too long to respond.';
        } else if (apiError.code === 'ECONNREFUSED') {
          errorMessage += 'Connection refused. The server may be down or unreachable.';
        } else if (apiError.response) {
          errorMessage += apiError.response.data?.error || apiError.response.statusText || apiError.message;
        } else {
          errorMessage += apiError.message;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error generating podcast:', error);
      setError('Failed to generate podcast: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setGeneratingAudio(false);
    }
  };

  const humanizeContent = async () => {
    if (!blogPost.trim()) {
      setError("No content to humanize");
      return;
    }

    setHumanizing(true);
    setError('');
    setHumanizeSuccess(false);

    try {
      console.log('Sending content to humanize API...');
      
      // Call our dedicated humanize API endpoint
      const response = await axios.post('/api/humanize', {
        content: blogPost
      }, {
        timeout: 120000 // 120 second timeout (humanizing can take longer)
      });
      
      console.log('Humanize API response received');
      
      // Update the blog post with humanized content
      const humanizedContent = response.data.content;
      setBlogPost(humanizedContent);
      
      // Add to history with a special tag
      const timestamp = new Date().toISOString();
      const historyItem = {
        id: timestamp,
        timestamp,
        prompt: prompt + " (Humanized)",
        blogPost: humanizedContent,
        selectedLanguage,
        selectedModel: selectedModel + " + Humanized",
        outputLength
      };
      
      setHistory(prevHistory => [historyItem, ...prevHistory.slice(0, 19)]);
      
      // Show success message with note if it was partial humanization
      setHumanizeSuccess(true);
      
      // If the humanization was partial, show a note to the user
      if (response.data.partial) {
        setTimeout(() => {
          setError(
            <div>
              <strong>Note:</strong> Due to Vercel's 5-second timeout limit on the free plan, only the first portion of your content was humanized. 
              <div className="error-suggestion">
                For full humanization, consider:
                <ul>
                  <li>Upgrading to a paid Vercel plan</li>
                  <li>Running the application locally</li>
                  <li>Humanizing smaller pieces of content at a time</li>
                </ul>
              </div>
            </div>
          );
        }, 1000);
      }
      
    } catch (err) {
      console.error('Error humanizing content:', err);
      
      let errorMessage = 'Failed to humanize content: ';
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 504 || err.response.status === 503) {
          errorMessage = (
            <div>
              <strong>Server Timeout Error</strong>
              <p>The request took too long to process. This is due to Vercel's 5-second timeout limit on the free plan.</p>
              <div className="error-suggestion">
                Possible solutions:
                <ul>
                  <li>Try humanizing a shorter piece of content</li>
                  <li>Upgrade to a paid Vercel plan</li>
                  <li>Run the application locally instead</li>
                </ul>
              </div>
            </div>
          );
        } else {
          errorMessage += err.response.data?.error || err.response.statusText || err.message;
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = (
          <div>
            <strong>Request Timeout</strong>
            <p>The server took too long to respond. This may be due to Vercel's timeout limits.</p>
            <div className="error-suggestion">
              Try using a shorter piece of content or running the application locally.
            </div>
          </div>
        );
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage += 'Connection refused. The server may be down or unreachable.';
      } else if (err.message.includes('Network Error')) {
        errorMessage += 'Network error: Unable to connect to the API. Please check your internet connection.';
      } else if (err.message.includes('timeout') || err.message.includes('Timeout') || err.message.includes('504')) {
        errorMessage = (
          <div>
            <strong>Server Timeout Error</strong>
            <p>The request took too long to process. This is due to Vercel's 5-second timeout limit on the free plan.</p>
            <div className="error-suggestion">
              Possible solutions:
              <ul>
                <li>Try humanizing a shorter piece of content</li>
                <li>Upgrade to a paid Vercel plan</li>
                <li>Run the application locally instead</li>
              </ul>
            </div>
          </div>
        );
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setHumanizing(false);
    }
  };

  const renderBlogContent = (content) => {
    if (!content.trim()) {
      return (
        <div className="empty-state">
          <p>{strings.emptyState}</p>
          <p className="suggestion">{strings.trySuggestion} {suggestion}</p>
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
        
        <div className="action-buttons">
          <button
            className={`podcast-button ${generatingAudio ? 'generating' : ''}`}
            onClick={() => generatePodcast(content)}
            disabled={generatingAudio}
            title="Note: Podcast generation may time out on Vercel's free plan due to the 5-second limit"
          >
            {generatingAudio ? strings.generatingPodcast || 'Generating Podcast...' : strings.generatePodcast || 'Generate Podcast'}
          </button>
          
          <button
            className={`humanize-button ${humanizing ? 'humanizing' : ''} ${humanizeSuccess ? 'success' : ''}`}
            onClick={humanizeContent}
            disabled={humanizing}
            title={strings.humanizeTooltip + " (Note: May time out on Vercel's free plan due to the 5-second limit)"}
          >
            {humanizing 
              ? strings.humanizingContent 
              : humanizeSuccess 
                ? strings.humanizeSuccess 
                : strings.humanizeContent}
          </button>
        </div>
        
        {audioSrc && (
          <AudioPlayer audioSrc={audioSrc} title={podcastTitle} />
        )}
      </div>
    );
  };

  // Render history panel
  const renderHistoryPanel = () => {
    if (!showHistory) return null;
    
    return (
      <div className="history-panel">
        <div className="history-header">
          <h3>{strings.history}</h3>
          <button 
            className="clear-history-button" 
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            {strings.clearHistory}
          </button>
        </div>
        
        {history.length === 0 ? (
          <div className="no-history">{strings.noHistory}</div>
        ) : (
          <div className="history-items">
            {history.map((item) => {
              // Extract title from blog post if available
              let title = item.prompt;
              if (item.blogPost) {
                const titleMatch = item.blogPost.match(/title:\s*\[(.*?)\]/);
                if (titleMatch && titleMatch[1]) {
                  title = titleMatch[1];
                }
              }
              
              // Format date
              const date = new Date(item.timestamp);
              const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
              
              return (
                <div key={item.id} className="history-item">
                  <div className="history-item-content">
                    <div className="history-item-title">{title}</div>
                    <div className="history-item-meta">
                      <span>{formattedDate}</span>
                      <span>{item.selectedModel}</span>
                      <span>{item.selectedLanguage}</span>
                    </div>
                  </div>
                  <button 
                    className="load-history-button"
                    onClick={() => loadFromHistory(item)}
                  >
                    {strings.loadFromHistory}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    }
    
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      generateBlogPost();
    }
  };

  const handleTextareaInput = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const dismissVercelWarning = () => {
    setShowVercelWarning(false);
    localStorage.setItem('hideVercelWarning', 'true');
  };

  return (
    <div className="blog-generator">
      {showVercelWarning && (
        <div className="vercel-warning">
          <div className="warning-content">
            <strong>Vercel Free Plan Limitations</strong>
            <p>
              This application is running on Vercel's free plan, which has a 5-second timeout limit for serverless functions.
              Longer operations like generating blog posts, podcasts, or humanizing content may fail with timeout errors.
            </p>
            <div className="warning-suggestions">
              For the best experience:
              <ul>
                <li>Use shorter prompts</li>
                <li>Select faster models (like GPT-3.5 or Claude Haiku)</li>
                <li>Choose "Short" for content length</li>
                <li>Run the application locally for unlimited processing time</li>
              </ul>
            </div>
          </div>
          <button className="dismiss-warning" onClick={dismissVercelWarning}>
            Got it
          </button>
        </div>
      )}
      
      <div className="input-section">
        <div className="controls">
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            outputLength={outputLength}
            onLengthChange={setOutputLength}
            strings={strings}
          />
          <button 
            className={`history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Toggle history"
          >
            {strings.history}
          </button>
        </div>
        
        {renderHistoryPanel()}
        
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            handleTextareaInput(e);
          }}
          onKeyPress={handleKeyPress}
          placeholder={strings.placeholder}
          className="prompt-input"
          rows="1"
        />
        <button 
          onClick={generateBlogPost}
          disabled={loading}
          className="generate-button"
        >
          {loading ? strings.generating : strings.generateButton}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {blogPost ? renderBlogContent(blogPost) : (
        <div className="empty-state">
          <p>{strings.enterTopic}</p>
          <p className="suggestion">{strings.trySuggestion} {suggestion}</p>
        </div>
      )}
    </div>
  );
}

export default BlogGenerator; 