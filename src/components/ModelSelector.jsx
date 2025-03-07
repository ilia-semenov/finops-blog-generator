import React from 'react';
import '../styles/ModelSelector.css';

const ModelSelector = ({ 
  selectedModel, 
  onModelChange, 
  outputLength, 
  onLengthChange,
  strings 
}) => {
  const models = [
    { id: 'default', name: 'default', description: 'Default model' },
    { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet', description: 'Latest Sonnet' },
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', description: 'Balanced performance' },
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', description: 'Fast responses' },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', description: 'Most powerful Claude' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Faster & cheaper' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'OpenAI GPT-4o' },
    { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', description: 'Latest GPT preview' },
    { id: 'o3-mini', name: 'o3-mini', description: 'OpenAI fast reasoning model' }
  ];

  const lengths = [
    { id: 'short', name: strings?.short || 'Short', tokens: '~500 words' },
    { id: 'medium', name: strings?.medium || 'Medium', tokens: '~1000 words' },
    { id: 'long', name: strings?.long || 'Long', tokens: '~2000 words' }
  ];

  return (
    <div className="model-selector">
      <div className="selector-group">
        <label>{strings?.modelLabel || 'Model:'}</label>
        <select 
          value={selectedModel} 
          onChange={(e) => onModelChange(e.target.value)}
          className="model-select"
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <label>{strings?.lengthLabel || 'Length:'}</label>
        <select 
          value={outputLength} 
          onChange={(e) => onLengthChange(e.target.value)}
          className="length-select"
        >
          {lengths.map(length => (
            <option key={length.id} value={length.id}>
              {length.name} ({length.tokens})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ModelSelector; 