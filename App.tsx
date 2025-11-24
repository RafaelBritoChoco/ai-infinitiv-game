import React from 'react';
import GameCanvas from './components/GameCanvas';
import { ErrorBoundary } from './components/game/ErrorBoundary';

const App: React.FC = () => {
  return (
    <div className="w-full h-full">
      <ErrorBoundary>
        <GameCanvas />
      </ErrorBoundary>
    </div>
  );
};

export default App;
