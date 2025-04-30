//index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind and global styles
import './App.css';   // Only if you have custom styles here
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: performance measuring
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();
