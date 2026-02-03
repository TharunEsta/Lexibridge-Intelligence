import React, { useState, useEffect } from 'react';
import './TypingEffect.css';

function TypingEffect({ text, speed = 30, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');
    setIsComplete(false);
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(typingInterval);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed, onComplete]);

  return (
    <span className="typing-text">
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </span>
  );
}

export default TypingEffect;
