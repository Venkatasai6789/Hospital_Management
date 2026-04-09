import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { testSupabaseConnection } from './src/lib/supabase';
import './src/i18n'; // Import i18n config
import './index.css';
import 'leaflet/dist/leaflet.css';

// Filter console warnings that are not critical
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const message = typeof first === 'string' ? first : '';
    
    // Filter out expected React and Recharts warnings
    if (
      message.includes('XAxis: Support for defaultProps will be removed') ||
      message.includes('YAxis: Support for defaultProps will be removed') ||
      message.includes('Unrecognized feature')
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: unknown[]) => {
    const first = args[0];
    const message = typeof first === 'string' ? first : '';
    
    // Filter out Jitsi and other non-critical warnings
    if (
      message.includes('Unrecognized feature') ||
      message.includes('speaker-selection')
    ) {
      return;
    }
    originalConsoleWarn(...args);
  };
}

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