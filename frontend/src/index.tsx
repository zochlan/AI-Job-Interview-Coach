import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
// Register service worker for offline support
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
// Analytics initialization stub
// import { initAnalytics } from './analytics';
// if (process.env.NODE_ENV === 'production') initAnalytics();
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  // StrictMode causes double rendering in development, which can make the app feel laggy
  // <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  // </React.StrictMode>
);

// Register service worker for offline support
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // When a new version is available, show a notification
    const updateAvailable = window.confirm(
      'A new version of this app is available. Load the latest version?'
    );

    if (updateAvailable && registration.waiting) {
      // Send message to service worker to skip waiting and activate new version
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page to load the new version
      window.location.reload();
    }
  },
  onSuccess: (registration) => {
    console.log('Content is cached for offline use.');
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
