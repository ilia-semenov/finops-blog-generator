import React from 'react';
import '../styles/LanguageSelector.css';

const LanguageSelector = ({ selectedLanguage, onLanguageChange }) => {
  const languages = [
    { id: 'auto', name: 'Auto-detect' },
    { id: 'en', name: 'English' },
    { id: 'ru', name: 'Russian' },
    { id: 'de', name: 'German' },
    { id: 'es', name: 'Spanish' },
    { id: 'fr', name: 'French' }
  ];

  return (
    <div className="selector-group">
      <label>Language:</label>
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="language-select"
      >
        {languages.map(lang => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector; 