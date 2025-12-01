import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Wrapper to hide loading screen after mount
const AppWithLoader = () => {
  useEffect(() => {
    // Hide loading screen after React app is fully rendered
    const timer = setTimeout(() => {
      if (typeof window.hideLoadingScreen === 'function') {
        window.hideLoadingScreen();
        console.log('✅ Loading screen hidden - App ready!');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return <App />;
};

root.render(
  <React.StrictMode>
    <AppWithLoader />
  </React.StrictMode>
);