import { useState } from 'react';
import BlogGenerator from './components/BlogGenerator';
import './App.css';

function App() {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`app ${isDark ? '' : 'light'}`}>
      <div className="hero-section">
        <div className="hero-content">
          <h1>FinOps Blog Generator</h1>
          <button 
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
          >
            {isDark ? '☾' : '☼'}
          </button>
        </div>
      </div>
      <div className="main-content">
        <BlogGenerator />
      </div>
    </div>
  );
}

export default App;
