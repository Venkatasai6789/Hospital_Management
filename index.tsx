import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { testSupabaseConnection } from './src/lib/supabase';
import './src/i18n'; // Import i18n config
import './index.css';

// Test Supabase connection on app startup
testSupabaseConnection();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);