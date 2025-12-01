import React from 'react';
import GameCanvas from './components/GameCanvas';
import { ErrorBoundary } from './components/game/ErrorBoundary';
import { VersionChecker } from './components/game/ui_parts/VersionChecker';

const App: React.FC = () => {
  return (
    <div className="w-full h-full">
      {/* Auto version checker - blocks UI if update needed */}
      <VersionChecker />

      <ErrorBoundary>
        <GameCanvas />
      </ErrorBoundary>
    </div>
  );
};

export default App;
