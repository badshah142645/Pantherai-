import React from 'react';
import './Loading.css';

function Loading({ type = 'spinner', size = 'medium', text = 'Loading...' }) {
  if (type === 'skeleton') {
    return <SkeletonLoader />;
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

function SkeletonLoader({ lines = 3, avatar = false }) {
  return (
    <div className="skeleton-loader">
      {avatar && (
        <div className="skeleton-avatar"></div>
      )}
      <div className="skeleton-content">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={`skeleton-line ${index === lines - 1 ? 'short' : ''}`}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header"></div>
      <div className="skeleton-body">
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
        <div className="skeleton-line"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="skeleton-table-cell"></div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }, (_, colIndex) => (
            <div key={colIndex} className="skeleton-table-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-avatar small"></div>
          <div className="skeleton-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Loading;