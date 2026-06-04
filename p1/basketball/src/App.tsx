import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { GameOver } from './components/GameOver';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="w-screen h-screen overflow-hidden bg-pixel-darker">
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game" element={<GameCanvas />} />
          <Route path="/gameover" element={<GameOver />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
