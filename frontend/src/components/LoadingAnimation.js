import React, { useState, useEffect } from 'react';
import './LoadingAnimation.css';

function LoadingAnimation({ status, progress: externalProgress, statusMessage: externalMessage }) {
  const [currentStatus, setCurrentStatus] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');

  const statusMessages = [
    'Reading document...',
    'Extracting legal entities...',
    'Analyzing ownership details...',
    'Identifying survey numbers...',
    'Checking for encumbrances...',
    'Assessing potential risks...',
    'Generating simplified summary...',
    'Finalizing analysis...'
  ];

  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
    }
    if (externalMessage) {
      setCurrentMessage(externalMessage);
    }
  }, [externalProgress, externalMessage]);

  useEffect(() => {
    if (!status) {
      setProgress(0);
      setCurrentStatus(0);
      setCurrentMessage('');
      return;
    }

    if (!externalMessage) {
      const interval = setInterval(() => {
        setCurrentStatus((prev) => {
          const next = (prev + 1) % statusMessages.length;
          setCurrentMessage(statusMessages[next]);
          return next;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [status, externalMessage]);

  useEffect(() => {
    if (!status || externalProgress !== undefined) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [status, externalProgress]);

  if (!status) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-center"></div>
        </div>
        <div className="loading-content">
          <h3 className="loading-title">Analyzing Document</h3>
          <p className="loading-status">
            {currentMessage || statusMessages[currentStatus]}
          </p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${Math.min(progress, 95)}%` }}
            ></div>
            <span className="progress-percentage">{Math.round(Math.min(progress, 95))}%</span>
          </div>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingAnimation;
