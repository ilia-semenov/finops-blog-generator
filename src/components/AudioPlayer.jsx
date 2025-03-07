import React, { useState, useRef, useEffect } from 'react';
import '../styles/AudioPlayer.css';

const AudioPlayer = ({ audioSrc, title }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (audioSrc) {
      setLoading(false);
    }
  }, [audioSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const seekTime = e.target.value;
    
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="audio-player">
      <h3 className="audio-title">{title || 'FinOps Podcast'}</h3>
      
      <div className="player-controls">
        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`} 
          onClick={togglePlay}
          disabled={loading}
        >
          {loading ? '⏳' : isPlaying ? '❚❚' : '▶'}
        </button>
        
        <div className="time-controls">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="seek-slider"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={loading}
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>
      </div>
      
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
    </div>
  );
};

export default AudioPlayer; 