import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { ErrorBoundary } from './components/game/ErrorBoundary';
import { VersionChecker } from './components/game/ui_parts/VersionChecker';
import { LoginScreen } from './components/game/ui_parts/LoginScreen';
import { Persistence } from './components/game/persistence';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = sessionStorage.getItem('auth_token');
    const username = sessionStorage.getItem('username');

    if (token && username) {
      Persistence.setProfile(username);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (token: string, username: string, isGuest: boolean, isAdmin?: boolean, preferences?: any) => {
    Persistence.setProfile(username);

    if (isAdmin && preferences) {
      // Apply admin preferences
      if (preferences.unlockAll) {
        // Logic to unlock everything would go here or in Persistence
        localStorage.setItem('ADMIN_UNLOCK_ALL', 'true');
      }
      if (preferences.infiniteMoney) {
        localStorage.setItem('ADMIN_INFINITE_MONEY', 'true');
      }
    } else {
      // Clear admin flags for normal users
      localStorage.removeItem('ADMIN_UNLOCK_ALL');
      localStorage.removeItem('ADMIN_INFINITE_MONEY');
    }

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('ADMIN_UNLOCK_ALL');
    localStorage.removeItem('ADMIN_INFINITE_MONEY');
    setIsAuthenticated(false);
  };

  if (isLoading) return null;

  return (
    <div className="w-full h-full">
      {/* Auto version checker - blocks UI if update needed */}
      <VersionChecker />

      {!isAuthenticated ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <ErrorBoundary>
          <GameCanvas onLogout={handleLogout} />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default App;
