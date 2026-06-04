import { create } from 'zustand';

interface GameStore {
  screen: 'menu' | 'game' | 'result';
  periodLength: number;
  finalScore: { red: number; blue: number } | null;
  setScreen: (screen: 'menu' | 'game' | 'result') => void;
  setPeriodLength: (length: number) => void;
  setFinalScore: (score: { red: number; blue: number }) => void;
  startGame: () => void;
  endGame: (score: { red: number; blue: number }) => void;
  goToMenu: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  screen: 'menu',
  periodLength: 120,
  finalScore: null,
  setScreen: (screen) => set({ screen }),
  setPeriodLength: (periodLength) => set({ periodLength }),
  setFinalScore: (finalScore) => set({ finalScore }),
  startGame: () => set({ screen: 'game', finalScore: null }),
  endGame: (finalScore) => set({ screen: 'result', finalScore }),
  goToMenu: () => set({ screen: 'menu', finalScore: null }),
}));
