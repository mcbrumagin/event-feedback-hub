import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { log } from '@/lib/logger';

log.info('Application starting', { 
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
